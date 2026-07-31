<?php

namespace Cet\Theme\Troon2\Blocks\Contracts;

/**
 * Block Contract Builder
 *
 * Constructs the contract payload arrays (section and content) that are
 * stored in block attrs and later consumed by HtmlApplicator.
 *
 * @package cet-wp-theme-troon-2
 */
class ContractBuilder {

	/**
	 * Default contract settings.
	 *
	 * @var array<string, mixed>
	 */
	private array $defaults;

	/**
	 * @param array<string, mixed> $defaults The 'defaults' portion of the config
	 *                                       (contains 'section' and 'content' keys).
	 */
	public function __construct( array $defaults ) {
		$this->defaults = $defaults;
	}

	/**
	 * Build a section contract payload.
	 *
	 * @param string               $blockName     Block name.
	 * @param array<string, mixed> $sectionConfig Section configuration.
	 * @param array<string, mixed> $parsed_block  The parsed block data.
	 * @return array<string, mixed>
	 */
	public function buildSectionContract( string $blockName, array $sectionConfig = [], array $parsed_block = [] ): array {
		$sectionDefaults = $this->defaults['section'];

		// Get explicit type from config or derive from block name.
		$blockType = $sectionConfig['type'] ?? $this->deriveBlockType( $blockName );

		$contract = [
			'type'              => 'section',
			'block_type'        => $blockType,
			'base_class'        => $sectionDefaults['base_class'] ?? 'cet-block',
			'type_class_prefix' => $sectionDefaults['type_class_prefix'] ?? 'cet-block-type-',
			'modifier_prefix'   => $sectionDefaults['modifier_prefix'] ?? '-has-',
			'container'         => $sectionConfig['container'] ?? $sectionDefaults['container'] ?? 'container',
			'spacing'           => $sectionConfig['spacing'] ?? $sectionDefaults['spacing'] ?? 'md',
		];

		if ( $blockType === 'text-carousel' ) {
			$contract['orientation'] = $this->resolveTextCarouselOrientation( $parsed_block );
		}

		if ( ! empty( $sectionConfig['sub_elements'] ) ) {
			$contract['sub_elements'] = $sectionConfig['sub_elements'];
		}

		return $contract;
	}

	/**
	 * Build a content contract payload.
	 *
	 * @param string               $blockName      Block name.
	 * @param array<string, mixed> $contentConfig  Content configuration (from nested_blocks
	 *                                             or overridden from section config).
	 * @return array<string, mixed>
	 */
	public function buildContentContract( string $blockName, array $contentConfig = [] ): array {
		$contentDefaults = $this->defaults['content'];

		// Get explicit type from config or derive from block name.
		$blockType = $contentConfig['type'] ?? $this->deriveBlockType( $blockName );

		$contract = [
			'type'              => 'content',
			'block_type'        => $blockType,
			'base_class'        => $contentDefaults['base_class'] ?? 'cet-block-part',
			'type_class_prefix' => $contentDefaults['type_class_prefix'] ?? 'cet-block-part-type-',
		];

		if ( ! empty( $contentConfig['sub_elements'] ) ) {
			$contract['sub_elements'] = $contentConfig['sub_elements'];
		}

		return $contract;
	}

	/**
	 * Derive block type from block name.
	 *
	 * Removes namespace prefixes (core/, acf/, etc.) from block name.
	 * Used as fallback when explicit type is not configured.
	 *
	 * @param string $blockName Block name.
	 * @return string
	 */
	public function deriveBlockType( string $blockName ): string {
		// Remove namespace prefix (core/, acf/, etc.).
		$type = preg_replace( '~^[^/]+/~', '', $blockName );

		// Sanitize type.
		$type = preg_replace( '~[^a-zA-Z0-9_-]+~', '', $type );

		// Fallback to 'unknown' if empty.
		return $type ?: 'unknown';
	}

	/**
	 * Resolve text carousel media orientation.
	 *
	 * @param array<string, mixed> $parsed_block The parsed block data.
	 * @return string
	 */
	private function resolveTextCarouselOrientation( array $parsed_block ): string {
		$innerBlocks = $parsed_block['innerBlocks'] ?? [];

		if ( empty( $innerBlocks ) || ! is_array( $innerBlocks ) ) {
			return 'media-right';
		}

		foreach ( $innerBlocks as $index => $innerBlock ) {
			if ( ! is_array( $innerBlock ) || ( $innerBlock['blockName'] ?? '' ) !== 'core/column' ) {
				continue;
			}

			if ( $this->blockContainsMedia( $innerBlock ) ) {
				return $index === 0 ? 'media-left' : 'media-right';
			}
		}

		return 'media-right';
	}

	/**
	 * Check whether a block contains carousel media.
	 *
	 * @param array<string, mixed> $block The parsed block data.
	 * @return bool
	 */
	private function blockContainsMedia( array $block ): bool {
		if ( in_array( $block['blockName'] ?? '', [ 'core/image', 'core/gallery', 'ghostkit/carousel' ], true ) ) {
			return true;
		}

		$innerBlocks = $block['innerBlocks'] ?? [];

		if ( empty( $innerBlocks ) || ! is_array( $innerBlocks ) ) {
			return false;
		}

		foreach ( $innerBlocks as $innerBlock ) {
			if ( is_array( $innerBlock ) && $this->blockContainsMedia( $innerBlock ) ) {
				return true;
			}
		}

		return false;
	}
}
