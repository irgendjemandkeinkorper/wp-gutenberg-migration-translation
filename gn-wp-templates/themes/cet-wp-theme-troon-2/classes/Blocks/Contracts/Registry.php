<?php

namespace Cet\Theme\Troon2\Blocks\Contracts;

use Cet\Theme\Troon2\Blocks\Contracts\Definitions\EntityDefinition;
use Cet\Theme\Troon2\Blocks\Contracts\Definitions\PartDefinition;
use Cet\Theme\Troon2\Blocks\Contracts\Definitions\WrapperDefinition;

/**
 * Block Contracts v2 Registry
 *
 * Stores Entity, Part, and Wrapper definitions registered via the facade.
 * Consumed by ContractEngineV2 during block resolution.
 *
 * @package cet-wp-theme-troon-2
 */
class Registry {

	/** @var array<string, EntityDefinition[]> Keyed by block name. */
	private array $entities = [];

	/** @var array<string, PartDefinition> Keyed by block name. */
	private array $parts = [];

	/** @var array<string, WrapperDefinition> Keyed by block name. */
	private array $wrappers = [];

	/**
	 * Register an Entity definition.
	 *
	 * Accepts either a single block name (`block`) or multiple (`blocks`).
	 * When `blocks` is given, one EntityDefinition is registered per block name,
	 * each sharing the same type, style, container, spacing, and sub_elements.
	 *
	 * @param string               $type   Unique entity type identifier.
	 * @param array<string, mixed> $config Keys: block|blocks (required), style, container, spacing, sub_elements, orientation_attr.
	 */
	public function entity( string $type, array $config ): void {
		if ( empty( $type ) ) {
			return;
		}

		$blocks = isset( $config['blocks'] )
			? (array) $config['blocks']
			: [ $config['block'] ?? '' ];

		foreach ( $blocks as $block ) {
			if ( empty( $block ) || ! is_string( $block ) ) {
				continue;
			}

			$this->entities[ $block ][] = new EntityDefinition(
				block:             $block,
				type:              $type,
				style:             $config['style'] ?? null,
				container:         $config['container'] ?? 'container',
				spacing:           $config['spacing'] ?? 'md',
				subElements:       $config['sub_elements'] ?? [],
				orientationAttr:   is_string( $config['orientation_attr'] ?? null ) ? $config['orientation_attr'] : null,
			);
		}
	}

	/**
	 * Register a Part definition.
	 *
	 * Accepts either a single block name (`block`) or multiple (`blocks`).
	 * When `blocks` is given, one PartDefinition is registered per block name,
	 * each sharing the same type.
	 *
	 * @param string               $type   Unique part type identifier.
	 * @param array<string, mixed> $config Keys: block|blocks (required).
	 */
	public function part( string $type, array $config ): void {
		if ( empty( $type ) ) {
			return;
		}

		$blocks = isset( $config['blocks'] )
			? (array) $config['blocks']
			: [ $config['block'] ?? '' ];

		foreach ( $blocks as $block ) {
			if ( empty( $block ) || ! is_string( $block ) ) {
				continue;
			}

			$this->parts[ $block ] = new PartDefinition(
				block: $block,
				type:  $type,
			);
		}
	}

	/**
	 * Register one or more Wrapper blocks (structural containers with no visual identity).
	 *
	 * Accepts any number of block names. Existing single-arg call sites are unchanged.
	 *
	 * @param string ...$blocks Block names to register as wrappers.
	 */
	public function wrapper( string ...$blocks ): void {
		foreach ( $blocks as $block ) {
			if ( empty( $block ) ) {
				continue;
			}

			$this->wrappers[ $block ] = new WrapperDefinition( block: $block );
		}
	}

	/**
	 * Match an Entity definition for a parsed block.
	 *
	 * Checks block name first, then style-gate if the definition requires one.
	 *
	 * @param array<string, mixed> $parsed_block Parsed block data.
	 * @return EntityDefinition|null
	 */
	public function matchEntity( array $parsed_block ): ?EntityDefinition {
		$blockName  = $parsed_block['blockName'] ?? '';
		$candidates = $this->entities[ $blockName ] ?? [];

		if ( empty( $candidates ) ) {
			return null;
		}

		$className = $parsed_block['attrs']['className'] ?? '';
		$classes   = ( is_string( $className ) && ! empty( $className ) )
			? preg_split( '/\s+/', trim( $className ) )
			: [];

		foreach ( $candidates as $definition ) {
			if ( $definition->style === null ) {
				return $definition;
			}

			if ( in_array( 'is-style-' . $definition->style, $classes, true ) ) {
				return $definition;
			}
		}

		return null;
	}

	/**
	 * Match a Part definition by block name.
	 *
	 * @param string $blockName Block name.
	 * @return PartDefinition|null
	 */
	public function matchPart( string $blockName ): ?PartDefinition {
		return $this->parts[ $blockName ] ?? null;
	}

	/**
	 * Check if a block is registered as a Wrapper.
	 *
	 * @param string $blockName Block name.
	 * @return bool
	 */
	public function isWrapper( string $blockName ): bool {
		return isset( $this->wrappers[ $blockName ] );
	}
}
