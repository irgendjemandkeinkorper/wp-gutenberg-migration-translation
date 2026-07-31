<?php

namespace Cet\Theme\Troon2\Blocks\Contracts;

/**
 * Block Contract Configuration Resolver
 *
 * Interprets the block-contracts config array to determine whether a given
 * block matches a section or nested content contract. Handles style-based
 * matching for multi-style block configurations.
 *
 * @package cet-wp-theme-troon-2
 */
class ConfigResolver {

	/**
	 * Full configuration array.
	 *
	 * @var array<string, mixed>
	 */
	private array $config;

	/**
	 * @param array<string, mixed> $config Configuration from inc/block-contracts.php.
	 */
	public function __construct( array $config ) {
		$this->config = $config;
	}

	/**
	 * Whether content contracts are enabled for nested blocks.
	 */
	public function nestedContentEnabled(): bool {
		return $this->config['defaults']['content']['enabled'] ?? false;
	}

	/**
	 * Get the nested/content config for a block, if registered.
	 *
	 * @param string $blockName Block name (e.g. 'core/heading').
	 * @return array<string, mixed>
	 */
	public function getNestedConfig( string $blockName ): array {
		$config = $this->config['nested_blocks'][ $blockName ] ?? [];

		if ( empty( $config ) || empty( $config['enabled'] ) ) {
			return [];
		}

		return $config;
	}

	/**
	 * Get matching section config for a block.
	 *
	 * Supports both a single config and multiple style-based configs
	 * for the same block name.
	 *
	 * @param array<string, mixed> $parsed_block The parsed block data.
	 * @return array<string, mixed>
	 */
	public function getSectionConfig( array $parsed_block ): array {
		$blockName = $parsed_block['blockName'] ?? '';

		if ( empty( $blockName ) || empty( $this->config['section_blocks'][ $blockName ] ) ) {
			return [];
		}

		$sectionConfig = $this->config['section_blocks'][ $blockName ];

		if ( isset( $sectionConfig['enabled'] ) ) {
			return ( $sectionConfig['enabled'] ?? false ) && $this->matchesConfiguredStyle( $parsed_block ) ? $sectionConfig : [];
		}

		foreach ( $sectionConfig as $config ) {
			if ( ! is_array( $config ) || empty( $config['enabled'] ) ) {
				continue;
			}

			if ( $this->matchesConfiguredStyleConfig( $parsed_block, $config ) ) {
				return $config;
			}
		}

		return [];
	}

	/**
	 * Check whether block matches configured Gutenberg style limitation.
	 *
	 * If no style is configured, the contract is applied normally.
	 *
	 * @param array<string, mixed> $parsed_block The parsed block data.
	 * @return bool
	 */
	private function matchesConfiguredStyle( array $parsed_block ): bool {
		$blockName = $parsed_block['blockName'] ?? '';

		if ( empty( $blockName ) ) {
			return false;
		}

		$sectionConfig = $this->config['section_blocks'][ $blockName ] ?? [];
		$style         = $sectionConfig['style'] ?? '';

		if ( empty( $style ) ) {
			return true;
		}

		$className = $parsed_block['attrs']['className'] ?? '';

		if ( ! is_string( $className ) || empty( $className ) ) {
			return false;
		}

		return in_array(
			'is-style-' . $style,
			preg_split( '/\s+/', $className ),
			true
		);
	}

	/**
	 * Check whether block matches a provided Gutenberg style limitation.
	 *
	 * If no style is configured, the contract is applied normally.
	 *
	 * @param array<string, mixed> $parsed_block  The parsed block data.
	 * @param array<string, mixed> $sectionConfig Section configuration.
	 * @return bool
	 */
	private function matchesConfiguredStyleConfig( array $parsed_block, array $sectionConfig ): bool {
		$style = $sectionConfig['style'] ?? '';

		if ( empty( $style ) ) {
			return true;
		}

		$className = $parsed_block['attrs']['className'] ?? '';

		if ( ! is_string( $className ) || empty( $className ) ) {
			return false;
		}

		return in_array(
			'is-style-' . $style,
			preg_split( '/\s+/', $className ),
			true
		);
	}
}
