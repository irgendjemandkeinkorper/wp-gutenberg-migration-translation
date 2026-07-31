<?php
/**
 * Conditionally enqueue Splide slider assets.
 *
 * @package cet-wp-theme-troon-2
 */

/**
 * Enqueue slider JS and CSS only when the current page contains a block that needs it.
 *
 * @return void
 */
function cet_troon_2_enqueue_slider(): void {
	$post = get_post();

	if ( ! $post ) {
		return;
	}

    if ( ! str_contains( $post->post_content, 'is-style-testimonials' ) ) {
        return;
    }

    $theme_path = get_template_directory();
    $theme_uri  = get_template_directory_uri();

    $asset_path = $theme_path . '/build/js/cet-theme-slider.min.asset.php';

    $asset = file_exists($asset_path)
        ? include $asset_path
        : array(
            'dependencies' => array('wp-dom-ready'),
            'version'      => cet_troon_2_get_theme_version(),
        );

    wp_enqueue_script(
        'cet-troon-2-slider',
        $theme_uri . '/build/js/cet-theme-slider.min.js',
        $asset['dependencies'],
        $asset['version'],
        true
    );

	wp_enqueue_style(
		'cet-troon-2-slider',
        $theme_uri . '/build/js/cet-theme-slider.css',
		[],
        $asset['version'],
	);
}
add_action( 'wp_enqueue_scripts', 'cet_troon_2_enqueue_slider' );
