<?php

namespace Cet\Theme\Troon2\Blocks\Contracts;

use \WP_HTML_Tag_Processor;

/**
 * Block Contract HTML Applicator
 *
 * Stamps contract classes and data attributes onto rendered block markup
 * using WP_HTML_Tag_Processor. Stateless — receives HTML and contract,
 * returns mutated HTML.
 *
 * @package cet-wp-theme-troon-2
 */
class HtmlApplicator {

	/**
	 * Content defaults for sub-element contract-part resolution.
	 *
	 * @var array<string, mixed>
	 */
	private array $contentDefaults;

	/**
	 * @param array<string, mixed> $contentDefaults The 'content' portion of config defaults.
	 */
	public function __construct( array $contentDefaults = [] ) {
		$this->contentDefaults = $contentDefaults;
	}

	/**
	 * Apply section contract to markup.
	 *
	 * @param string               $blockContent Rendered block content.
	 * @param array<string, mixed> $contract     Resolved contract.
	 * @return string
	 */
	public function applySection( string $blockContent, array $contract ): string {
		// Safety: Skip if no valid block type.
		if ( empty( $contract['block_type'] ) ) {
			return $blockContent;
		}

		$processor = new WP_HTML_Tag_Processor( $blockContent );

		if ( ! $processor->next_tag() ) {
			return $blockContent;
		}

		$blockType      = $contract['block_type'];
		$baseClass      = $contract['base_class'];
		$typePrefix     = $contract['type_class_prefix'];
		$modifierPrefix = $contract['modifier_prefix'];
		$container      = $contract['container'] ?? '';
		$spacing        = $contract['spacing'] ?? '';
		$orientation    = $contract['orientation'] ?? '';

		// Add base identity classes.
		$processor->add_class( $baseClass );
		$processor->add_class( $typePrefix . $blockType );

		// Add data attributes.
		$processor->set_attribute( 'data-cet-block', $blockType );

		// Container/spacing are absent when the editor has set a WP alignment — skip modifiers.
		if ( $container !== '' ) {
			$processor->add_class( $modifierPrefix . $container );
			$processor->add_class( $modifierPrefix . 'section-spacing-' . $spacing );
			$processor->set_attribute( 'data-cet-block-container', $container );
			$processor->set_attribute( 'data-cet-block-spacing', $spacing );
		}

		if ( ! empty( $orientation ) ) {
			$processor->set_attribute( 'data-cet-block-orientation', $orientation );
		}

		$blockContent = $processor->get_updated_html();

		return $this->applySubElementContracts( $blockContent, $contract );
	}

	/**
	 * Apply content contract to markup.
	 *
	 * @param string               $blockContent Rendered block content.
	 * @param array<string, mixed> $contract     Resolved contract.
	 * @return string
	 */
	public function applyContent( string $blockContent, array $contract ): string {
		// Safety: Skip if no valid block type.
		if ( empty( $contract['block_type'] ) ) {
			return $blockContent;
		}

		$processor = new WP_HTML_Tag_Processor( $blockContent );

		if ( ! $processor->next_tag() ) {
			return $blockContent;
		}

		$blockType  = $contract['block_type'];
		$baseClass  = $contract['base_class'];
		$typePrefix = $contract['type_class_prefix'];

		// Add classes.
		$processor->add_class( $baseClass );
		$processor->add_class( $typePrefix . $blockType );

		// Add data attribute.
		$processor->set_attribute( 'data-cet-block-part', $blockType );

		$blockContent = $processor->get_updated_html();

		return $this->applySubElementContracts( $blockContent, $contract );
	}

	/**
	 * Apply configured sub-element contracts to rendered markup.
	 *
	 * Supports two formats:
	 * - Existing direct class format: 'source-class' => 'cet-block-background'
	 * - Contract part format: 'source-class' => 'accordion-heading'
	 *
	 * Contract part format adds:
	 * - cet-block-part
	 * - cet-block-part-type-{type}
	 * - data-cet-block-part="{type}"
	 *
	 * @param string               $blockContent Rendered block content.
	 * @param array<string, mixed> $contract     Resolved contract.
	 * @return string
	 */
	private function applySubElementContracts( string $blockContent, array $contract ): string {
		if ( empty( $contract['sub_elements'] ) || ! is_array( $contract['sub_elements'] ) ) {
			return $blockContent;
		}

		foreach ( $contract['sub_elements'] as $elementClass => $cetClass ) {
			if ( ! is_string( $elementClass ) || ! is_string( $cetClass ) || empty( $elementClass ) || empty( $cetClass ) ) {
				continue;
			}

			$processor = new WP_HTML_Tag_Processor( $blockContent );

			while ( $processor->next_tag( [ 'class_name' => $elementClass ] ) ) {
				if ( $this->isContractPartType( $cetClass ) ) {
					$processor->add_class( $this->contentDefaults['base_class'] ?? 'cet-block-part' );
					$processor->add_class( ( $this->contentDefaults['type_class_prefix'] ?? 'cet-block-part-type-' ) . $cetClass );
					$processor->set_attribute( 'data-cet-block-part', $cetClass );
				} else {
					$processor->add_class( $cetClass );
				}
			}

			$blockContent = $processor->get_updated_html();
		}

		return $blockContent;
	}

	/**
	 * Determine whether sub-element value should be treated as a contract part type.
	 *
	 * Existing legacy classes like "cet-block-background" should stay as direct classes.
	 * Short semantic names like "accordion-heading" become contract part types.
	 *
	 * @param string $value Sub-element config value.
	 * @return bool
	 */
	private function isContractPartType( string $value ): bool {
		return ! str_starts_with( $value, 'cet-' );
	}
}
