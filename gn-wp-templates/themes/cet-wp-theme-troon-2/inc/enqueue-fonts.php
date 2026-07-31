<?php
/**
 * Enqueue Google Fonts.
 *
 * @package cet-wp-theme-troon-2
 */

/**
 * Load theme fonts.
 *
 * @return void
 */
function cet_troon_2_enqueue_fonts() {
	wp_enqueue_style(
		'cet-troon-2-fonts',
		'https://fonts.googleapis.com/css2?family=Urbanist:wght@400;500;600;700&family=Libre+Baskerville:wght@400;700&display=swap',
		array(),
		null
	);
}
add_action( 'wp_enqueue_scripts', 'cet_troon_2_enqueue_fonts' );
add_action( 'enqueue_block_editor_assets', 'cet_troon_2_enqueue_fonts' );