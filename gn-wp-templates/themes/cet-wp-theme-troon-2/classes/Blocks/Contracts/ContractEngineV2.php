<?php

namespace Cet\Theme\Troon2\Blocks\Contracts;

use \WP_HTML_Tag_Processor;

/**
 * Block Contract Engine v2
 *
 * Parallel engine for the role-based (Entity/Part/Wrapper) contract system.
 * Operates independently of ContractEngine (v1) — different attr key, no shared state.
 *
 * Activation is per-block: a block is handled by v2 when it is registered in the
 * Registry and removed from the v1 config. Unregistered blocks pass through untouched.
 *
 * @package cet-wp-theme-troon-2
 */
class ContractEngineV2 {

	private Registry $registry;

	/** @var array<int, string> */
	private array $allowedNestedParents;

	/**
	 * @param Registry           $registry             v2 definition store.
	 * @param array<int, string> $allowedNestedParents Block names whose direct children
	 *                                                 may receive Part contracts.
	 */
	public function __construct( Registry $registry, array $allowedNestedParents = [] ) {
		$this->registry             = $registry;
		$this->allowedNestedParents = $allowedNestedParents;

		add_filter( 'render_block_data', [ $this, 'resolve' ], 10, 3 );
		add_filter( 'render_block', [ $this, 'apply' ], 10, 2 );
	}

	/**
	 * Resolve v2 contract for a block.
	 *
	 * Stores result in 'cetBlockContractV2' attrs key — separate from v1's 'cetBlockContract'.
	 *
	 * @param array<string, mixed> $parsed_block Parsed block data.
	 * @param array<string, mixed> $source_block Original block data.
	 * @param \WP_Block|null       $parent_block Parent block instance.
	 * @return array<string, mixed>
	 */
	public function resolve( array $parsed_block, array $source_block, $parent_block ): array {
		if ( empty( $parsed_block['blockName'] ) ) {
			return $parsed_block;
		}

		$blockName = $parsed_block['blockName'];
		$isNested  = ! empty( $parent_block );

		// --- Entity path ---
		$entity = $this->registry->matchEntity( $parsed_block );

		if ( $entity ) {
			$contract = [
				'role'       => 'entity',
				'type'       => $entity->type,
				'base_class' => 'cet-entity',
				'type_class' => 'cet-entity-' . $entity->type,
			];

			// Suppress section modifiers when inside any v2-contracted block (entity,
			// part, or wrapper). All three mean an ancestor entity already owns the
			// section layout — adding container/spacing here would conflict or double-apply.
			// At root level OR inside a v1/un-contracted block, this entity owns its layout.
			$parentHasV2Contract = $isNested && $parent_block !== null
				&& ! empty( $parent_block->parsed_block['attrs']['cetBlockContractV2'] );

			if ( ! $parentHasV2Contract ) {
				if ( ! $isNested ) {
					// Root-level entity owns its layout — unless the editor has set a WP
					// alignment (alignfull, alignwide, etc.). In that case WP's alignment
					// CSS already controls the width; adding our modifier would conflict.
					$align = $parsed_block['attrs']['align'] ?? '';
					if ( $align === '' ) {
						$contract['container']       = $entity->container;
						$contract['spacing']         = $entity->spacing;
						$contract['modifier_prefix'] = '-has-';
					}
				} else {
					// Nested in a non-v2 parent: host controls layout, entity fills it.
					// Container/spacing modifiers move to the host so the entity doesn't
					// attempt a breakout inside a constrained or already-full-width wrapper.
					$parent_block->parsed_block['attrs']['cetV2EntityHost'] = [
						'container' => $entity->container,
						'spacing'   => $entity->spacing,
					];
				}
			}

			if ( ! empty( $entity->subElements ) ) {
				$contract['sub_elements'] = $entity->subElements;
			}

			if ( $entity->orientationAttr !== null ) {
				$attrValue = $parsed_block['attrs'][ $entity->orientationAttr ] ?? null;
				if ( is_string( $attrValue ) && $attrValue !== '' ) {
					$contract['orientation'] = $attrValue;
				}
			}

			$parsed_block['attrs']['cetBlockContractV2'] = $contract;
			return $parsed_block;
		}

		// --- Part path ---
		// Only activates when direct parent is already a v2 entity (parent guard).
		// This ensures Parts inside v1 entities remain untouched.
		if ( $isNested ) {
			$parentContract = $parent_block->parsed_block['attrs']['cetBlockContractV2'] ?? [];
			$parentIsV2     = ( $parentContract['role'] ?? '' ) === 'entity';

			if ( $parentIsV2 ) {
				// Allowed-parent guard (mirrors v1 behaviour).
				if ( ! empty( $this->allowedNestedParents ) &&
					! in_array( $parent_block->name, $this->allowedNestedParents, true ) ) {
					return $parsed_block;
				}

				$part = $this->registry->matchPart( $blockName );

				if ( $part ) {
					$parsed_block['attrs']['cetBlockContractV2'] = [
						'role'       => 'part',
						'type'       => $part->type,
						'base_class' => 'cet-part',
						'type_class' => 'cet-part-' . $part->type,
					];
				} elseif ( $this->registry->isWrapper( $blockName ) ) {
					// Wrapper: structural container with no visual identity.
					// Only stamped when inside a v2 entity — avoids conflict with v1 engine
					// for top-level or v1-parented instances of the same block.
					$parsed_block['attrs']['cetBlockContractV2'] = [
						'role'       => 'wrapper',
						'base_class' => 'cet-wrap',
					];
				}
			}
		}

		return $parsed_block;
	}

	/**
	 * Apply v2 contract to rendered markup.
	 *
	 * @param string               $blockContent Rendered block content.
	 * @param array<string, mixed> $block        Block data.
	 * @return string
	 */
	public function apply( string $blockContent, array $block ): string {
		// Outer containers (cover, group, etc.) that wrap a v2 entity get cet-entity-host.
		// This runs before the v2 contract check so a block can be a host without being
		// a v2 entity itself (v1 blocks that contain v2 entities hit this path).
		if ( ! empty( $block['attrs']['cetV2EntityHost'] ) ) {
			$hostData     = is_array( $block['attrs']['cetV2EntityHost'] ) ? $block['attrs']['cetV2EntityHost'] : [];
			$align        = $block['attrs']['align'] ?? '';
			$blockContent = $this->applyEntityHost( $blockContent, $hostData, $align );
		}

		if ( empty( $block['attrs']['cetBlockContractV2'] ) ) {
			return $blockContent;
		}

		$contract = $block['attrs']['cetBlockContractV2'];

		return match ( $contract['role'] ?? '' ) {
			'entity'  => $this->applyEntity( $blockContent, $contract ),
			'part'    => $this->applyPart( $blockContent, $contract ),
			'wrapper' => $this->applyWrapper( $blockContent ),
			default   => $blockContent,
		};
	}

	/**
	 * Stamp an outer container block that wraps a v2 entity child.
	 *
	 * Distinct from cet-wrap (inner structural slot inside an entity).
	 * cet-entity-host marks the *outer* block so CSS can normalise entity rendering
	 * regardless of which container type (cover, group, columns, grid) it lives in.
	 *
	 * Container logic:
	 * - When the host has a WP alignment (align: full/wide/center/left/right), that
	 *   alignment class already defines the host width — we follow it and add nothing.
	 * - When no WP alignment is set, we apply the entity's container modifier
	 *   (e.g. -has-full-bleed) directly to the host so it sizes correctly.
	 *
	 * @param array<string, mixed> $entityData Container/spacing from the v2 entity definition.
	 * @param string               $align      WP block alignment attr value (full|wide|center|left|right|'').
	 */
	private function applyEntityHost( string $blockContent, array $entityData = [], string $align = '' ): string {
		$processor = new WP_HTML_Tag_Processor( $blockContent );

		if ( ! $processor->next_tag() ) {
			return $blockContent;
		}

		$processor->add_class( 'cet-entity-host' );
		$processor->set_attribute( 'data-cet-role', 'host' );

		// Only add our container modifier when the host has no WP alignment class.
		// alignfull/alignwide/aligncenter etc. are handled by WP's own CSS — we follow
		// those rather than stamping a conflicting width.
		if ( $align === '' && ! empty( $entityData['container'] ) ) {
			$processor->add_class( '-has-' . $entityData['container'] );

			if ( ! empty( $entityData['spacing'] ) ) {
				$processor->add_class( '-has-section-spacing-' . $entityData['spacing'] );
			}
		}

		return $processor->get_updated_html();
	}

	/**
	 * @param array<string, mixed> $contract
	 */
	private function applyEntity( string $blockContent, array $contract ): string {
		$processor = new WP_HTML_Tag_Processor( $blockContent );

		if ( ! $processor->next_tag() ) {
			return $blockContent;
		}

		$processor->add_class( $contract['base_class'] );
		$processor->add_class( $contract['type_class'] );
		$processor->set_attribute( 'data-cet-entity', $contract['type'] );
		$processor->set_attribute( 'data-cet-role', 'entity' );

		// Section modifiers — only present when block is at root level.
		if ( ! empty( $contract['container'] ) ) {
			$prefix = $contract['modifier_prefix'] ?? '-has-';
			$processor->add_class( $prefix . $contract['container'] );
			$processor->add_class( $prefix . 'section-spacing-' . $contract['spacing'] );
			$processor->set_attribute( 'data-cet-container', $contract['container'] );
			$processor->set_attribute( 'data-cet-spacing', $contract['spacing'] );
		}

		if ( ! empty( $contract['orientation'] ) ) {
			$processor->set_attribute( 'data-cet-block-orientation', $contract['orientation'] );
		}

		$blockContent = $processor->get_updated_html();

		return $this->applySubElements( $blockContent, $contract );
	}

	/**
	 * @param array<string, mixed> $contract
	 */
	private function applyPart( string $blockContent, array $contract ): string {
		$processor = new WP_HTML_Tag_Processor( $blockContent );

		if ( ! $processor->next_tag() ) {
			return $blockContent;
		}

		$processor->add_class( $contract['base_class'] );
		$processor->add_class( $contract['type_class'] );
		$processor->set_attribute( 'data-cet-part', $contract['type'] );
		$processor->set_attribute( 'data-cet-role', 'part' );

		$blockContent = $processor->get_updated_html();

		return $this->applySubElements( $blockContent, $contract );
	}

	private function applyWrapper( string $blockContent ): string {
		$processor = new WP_HTML_Tag_Processor( $blockContent );

		if ( ! $processor->next_tag() ) {
			return $blockContent;
		}

		$processor->add_class( 'cet-wrap' );
		$processor->set_attribute( 'data-cet-role', 'wrapper' );

		return $processor->get_updated_html();
	}

	/**
	 * Stamp sub-element contracts onto matching class nodes inside the block.
	 *
	 * Values starting with 'cet-' are added as direct classes.
	 * All other values are treated as part type names: add cet-part, cet-part-{type}, data-cet-part.
	 *
	 * @param array<string, mixed> $contract
	 */
	private function applySubElements( string $blockContent, array $contract ): string {
		if ( empty( $contract['sub_elements'] ) || ! is_array( $contract['sub_elements'] ) ) {
			return $blockContent;
		}

		foreach ( $contract['sub_elements'] as $elementClass => $cetValue ) {
			if ( ! is_string( $elementClass ) || ! is_string( $cetValue ) ||
				empty( $elementClass ) || empty( $cetValue ) ) {
				continue;
			}

			$processor = new WP_HTML_Tag_Processor( $blockContent );

			while ( $processor->next_tag( [ 'class_name' => $elementClass ] ) ) {
				if ( str_starts_with( $cetValue, 'cet-' ) ) {
					// Direct class (e.g. cet-block-background, cet-block-inner-container).
					$processor->add_class( $cetValue );
				} else {
					// Part type name — stamp as cet-part-{type}.
					$processor->add_class( 'cet-part' );
					$processor->add_class( 'cet-part-' . $cetValue );
					$processor->set_attribute( 'data-cet-part', $cetValue );
				}
			}

			$blockContent = $processor->get_updated_html();
		}

		return $blockContent;
	}
}
