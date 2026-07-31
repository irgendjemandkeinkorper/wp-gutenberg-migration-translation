<?php

namespace Cet\Theme\Troon2\Blocks;

use Cet\Theme\Troon2\Svg\SpriteManager;

/**
 * Icon Renderer
 *
 * Handles icon replacement in block content.
 * Replaces data-cet-icon spans with proper SVG from sprite.
 *
 * @package cet-wp-theme-troon-2
 */
class IconRenderer {

	/**
	 * Initialize hooks.
	 */
	public function init(): void {
		add_filter( 'render_block', [ $this, 'renderIcons' ], 5, 2 );
	}

	/**
	 * Render icon replacements in blocks.
	 *
	 * Registered via js/toolbar/rich-text-insert-icon-format-toolbar.js
	 *
	 * @param string              $blockContent Rendered block content.
	 * @param array<string, mixed> $block       Block data.
	 * @return string
	 */
	public function renderIcons( string $blockContent, array $block ): string {
		// Remove spacer (needed for editor only)
		$blockContent = preg_replace(
			'~<span\b[^>]*\bdata-cet-icon-space\b[^>]*>.*?</span>~si',
			'',
			$blockContent
		);

		// Replace icon signal span with proper SVG from the sprite
		$blockContent = preg_replace_callback(
			'~<span\b([^>]*?)\bdata-cet-icon="([^"]+)"([^>]*)>(.*?)</span>~si',
			[ $this, 'replaceIconSpan' ],
			$blockContent
		);

		return $blockContent;
	}

	/**
	 * Replace icon span callback.
	 *
	 * @param array<int, string> $matches Regex matches.
	 * @return string
	 */
	protected function replaceIconSpan( array $matches ): string {
		$before  = $matches[1];
		$iconId  = $matches[2];
		$after   = $matches[3];

		$attrs = $before . $after;
		$attrs = preg_replace( '~\s*data-cet-icon="[^"]*"~i', '', $attrs );
		$attrs = preg_replace( '~\s*contenteditable="false"~i', '', $attrs );
		$attrs = trim( $attrs );

		if ( ! str_starts_with( $iconId, 'icon-' ) ) {
			$iconId = 'icon-' . $iconId;
		}

		if ( ! str_ends_with( $iconId, '-icon' ) ) {
			$iconId = $iconId . '-icon';
		}

		$iconIdSafe = preg_replace( '~[^a-zA-Z0-9_.:-]+~', '', $iconId );

		return sprintf(
			'<span class="cet-icon -inline" %s>%s</span>',
			$attrs,
			SpriteManager::getRenderedSvg( $iconIdSafe )
		);
	}
}
