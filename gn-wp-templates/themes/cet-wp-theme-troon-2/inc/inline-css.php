<?php
/**
 * Inline CSS output for color tokens.
 *
 * @package cet-wp-theme-troon-2
 */

use Cet\Theme\Troon2\Colors\ColorTokensController;

$color_controller = new ColorTokensController();

/**
 * Get color tokens CSS (cached).
 *
 * @param string $selector CSS selector to scope tokens to.
 * @return string CSS string with color tokens.
 */
function cet_troon_2_get_color_tokens_css( string $selector = ':root' ): string {
	global $color_controller;
	return $color_controller->getColorTokensCss( $selector );
}

/**
 * Output color tokens as inline CSS in the frontend head.
 */
function cet_troon_2_frontend_inline_css(): void {
	// CSS is already sanitized at generation time, no need to escape.
	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	echo '<style id="cet-troon-2-inline-css">' . cet_troon_2_get_color_tokens_css() . '</style>';
}
add_action( 'wp_head', 'cet_troon_2_frontend_inline_css' );

/**
 * Enqueue color tokens as inline CSS for the block editor.
 */
function cet_troon_2_editor_inline_css(): void {
	$css = cet_troon_2_get_color_tokens_css() . cet_troon_2_get_color_tokens_css( ':root :where(.editor-styles-wrapper)' );
	wp_add_inline_style( 'wp-edit-blocks', $css );
}
add_action( 'enqueue_block_editor_assets', 'cet_troon_2_editor_inline_css', 20 );

/**
 * Clear color tokens cache when customizer settings are saved.
 */
function cet_troon_2_clear_color_cache(): void {
	global $color_controller;
	$color_controller->clearCache();
}
add_action( 'customize_save_after', 'cet_troon_2_clear_color_cache' );
