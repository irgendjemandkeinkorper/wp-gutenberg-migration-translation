<?php
/**
 * Transparent header block registry.
 *
 * @package cet-wp-theme-troon-2
 */

namespace Cet\Theme\Troon2\Layout\State;

/**
 * Holds block names that intentionally slide under the fixed header.
 * Injected into PageData so callers interact with it via PageData::isTransparentHeaderBlock().
 */
class TransparentHeaderRegistry {

	/** @var string[] */
	private array $blocks;

	public function __construct( string ...$blocks ) {
		$this->blocks = $blocks;
	}

	public function register( string ...$blocks ): void {
		$this->blocks = array_merge( $this->blocks, $blocks );
	}

	public function contains( string $blockName ): bool {
		return in_array( $blockName, $this->blocks, true );
	}

	/**
	 * Match a parsed block against exact block names or block.className patterns.
	 *
	 * Wildcard suffixes such as `alignfull` may come from the rendered class list
	 * or from structured block attrs like `align => full`, so we check both.
	 *
	 * @param array<string,mixed> $block Parsed block array from parse_blocks().
	 */
	public function matchesBlock( array $block ): bool {
		$block_name = $block['blockName'] ?? '';

		if ( ! is_string( $block_name ) || '' === $block_name ) {
			return false;
		}

		foreach ( $this->blocks as $entry ) {
			if ( $entry === $block_name ) {
				return true;
			}

			if ( ! str_starts_with( $entry, $block_name . '.' ) ) {
				continue;
			}

			$required_class = substr( $entry, strlen( $block_name ) + 1 );
			if ( '' !== $required_class && $this->matchesWildcard( $block, $required_class ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Match a wildcard suffix against either className tokens or structured attrs.
	 *
	 * @param array<string,mixed> $block Parsed block array from parse_blocks().
	 */
	private function matchesWildcard( array $block, string $required_class ): bool {
		$class_name = $block['attrs']['className'] ?? '';
		$classes    = is_string( $class_name ) ? ( preg_split( '/\s+/', trim( $class_name ) ) ?: [] ) : [];

		if ( in_array( $required_class, $classes, true ) ) {
			return true;
		}

		if ( str_starts_with( $required_class, 'align' ) ) {
			$align = $block['attrs']['align'] ?? '';

			if ( is_string( $align ) && 'align' . $align === $required_class ) {
				return true;
			}
		}

		return false;
	}
}
