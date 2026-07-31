<?php
/**
 * Editor color tokens.
 *
 * @package cet-wp-theme-troon-2
 */

/**
 * Expose generated theme color tokens to the block editor UI.
 */
function cet_troon_2_enqueue_block_editor_color_tokens() {
	$file_path = get_template_directory() . '/inc/generated/editor-color-tokens.css';

	if ( ! file_exists( $file_path ) || ! is_readable( $file_path ) ) {
		return;
	}

	$css = file_get_contents( $file_path );

	if ( false === $css || '' === trim( $css ) ) {
		return;
	}

	wp_add_inline_style( 'wp-edit-blocks', $css );
}
add_action( 'enqueue_block_editor_assets', 'cet_troon_2_enqueue_block_editor_color_tokens' );
