<?php

namespace Cet\Theme\Troon2\Integrations;

/**
 * Ghostkit Assets Adapter
 *
 * Intercepts Ghostkit per-block CSS output and replaces Bootstrap Icons
 * font-icon patterns with native Unicode equivalents, avoiding a Bootstrap Icons
 * font dependency for content authored with the old theme.
 *
 * Exit condition: remove once all stored Ghostkit custom CSS no longer
 * references font-family: bootstrap-icons (Axis C of group-block migration).
 *
 * @package cet-wp-theme-troon-2
 */
class GhostkitAssetsAdapter {

	/**
	 * Bootstrap Icons private-use codepoint → Unicode equivalent.
	 *
	 * Add entries here as new glyphs are discovered in stored block CSS.
	 *
	 * @var array<string, string>
	 */
	private const GLYPH_MAP = [
		'\F138' => '\2192', // arrow-right → →
	];

	public function __construct() {
		add_filter( 'gkt_block_custom_styles', [ $this, 'replaceBootstrapIcons' ], 999, 2 );
	}

	/**
	 * Strip bootstrap-icons font-family and remap glyphs to Unicode equivalents.
	 *
	 * @param string               $css   Block custom CSS string.
	 * @param array<string, mixed> $block Parsed block data.
	 * @return string
	 */
	public function replaceBootstrapIcons( string $css, array $block ): string {
		if ( ! str_contains( $css, 'bootstrap-icons' ) ) {
			return $css;
		}

		// Remove font-family: bootstrap-icons declarations so the element
		// inherits the page font, which can render standard Unicode code points.
		$css = preg_replace( '/\bfont-family\s*:\s*bootstrap-icons[^;]*;/', '', $css );

		// Remap known private-use codepoints to Unicode equivalents.
		foreach ( self::GLYPH_MAP as $from => $to ) {
			$css = str_replace(
				[ 'content:"' . $from . '"', 'content: "' . $from . '"' ],
				[ 'content:"' . $to . '"', 'content: "' . $to . '"' ],
				$css
			);
		}

		return $css;
	}
}
