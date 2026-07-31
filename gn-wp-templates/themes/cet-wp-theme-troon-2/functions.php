<?php
/**
 * Troon 2.0 Theme Functions
 *
 * @package cet-wp-theme-troon-2
 */

define( 'CET_TROON_2_CAROUSEL_STYLES', [ 'small-cards', 'big-cards' ] );

/**
 * Load Composer autoloader.
 */
require get_template_directory() . '/bootstrap.php';

/**
 * Get theme version.
 *
 * @return string
 */
function cet_troon_2_get_theme_version() {
	return wp_get_theme()->get( 'Version' );
}

/**
 * Theme setup.
 */
function cet_troon_2_setup() {
	// Translations.
	load_theme_textdomain( 'cet-wp-theme-troon-2', get_template_directory() . '/languages' );

	// Core theme supports.
	add_theme_support( 'automatic-feed-links' );
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'woocommerce' );

	// HTML5 support.
	add_theme_support(
		'html5',
		array(
			'search-form',
			'comment-form',
			'comment-list',
			'gallery',
			'caption',
			'style',
			'script',
		)
	);

	// Custom logo.
	add_theme_support(
		'custom-logo',
		array(
			'height'      => 250,
			'width'       => 250,
			'flex-width'  => true,
			'flex-height' => true,
		)
	);

	// Editor styles.
	add_theme_support( 'editor-styles' );
	add_editor_style( 'editor.css' );

	// Wide and full alignment.
	add_theme_support( 'align-wide' );
}
add_action( 'after_setup_theme', 'cet_troon_2_setup' );

/**
 * Enqueue styles and scripts.
 */
function cet_troon_2_scripts() {
	$theme_version = cet_troon_2_get_theme_version();

	wp_enqueue_style(
		'cet-troon-2-style',
		get_stylesheet_uri(),
		array(),
		$theme_version
	);

	wp_style_add_data( 'cet-troon-2-style', 'rtl', 'replace' );

	// Enqueue frontend script with asset file for dependencies and version.
	$frontend_asset = array(
		'dependencies' => array(),
		'version'      => $theme_version,
	);

	if ( file_exists( get_template_directory() . '/build/js/cet-theme-frontend.min.asset.php' ) ) {
		$frontend_asset = include get_template_directory() . '/build/js/cet-theme-frontend.min.asset.php';
	}

	wp_enqueue_script(
		'cet-troon-2-frontend',
		get_template_directory_uri() . '/build/js/cet-theme-frontend.min.js',
		$frontend_asset['dependencies'],
		$frontend_asset['version'],
		true
	);

	wp_localize_script(
		'cet-troon-2-frontend',
		'cetTroon2Settings',
		[
			'carouselStyles' => CET_TROON_2_CAROUSEL_STYLES,
		]
	);
}
add_action( 'wp_enqueue_scripts', 'cet_troon_2_scripts' );

// UI fixes for widgets.php admin page.
// TODO: Can be removed after WP core update to 7.0.

add_action(
	'admin_enqueue_scripts',
	function ( $hook ) {
		if ( 'widgets.php' !== $hook ) {
			return;
		}

		wp_enqueue_style(
			'cet-admin-widgets',
			get_stylesheet_directory_uri() . '/admin-widgets.css',
			[],
			cet_troon_2_get_theme_version()
		);
	}
);

/**
 * Enqueue block editor scripts.
 */
function cet_troon_2_enqueue_block_editor_assets() {
	$theme_path = get_template_directory();
	$theme_uri  = get_template_directory_uri();

	$asset_path = $theme_path . '/build/js/cet-theme-editor.min.asset.php';

	$asset = file_exists( $asset_path )
		? include $asset_path
		: array(
			'dependencies' => array( 'wp-blocks', 'wp-hooks' ),
			'version'      => cet_troon_2_get_theme_version(),
		);

	wp_enqueue_script(
		'cet-troon-2-editor',
		$theme_uri . '/build/js/cet-theme-editor.min.js',
		$asset['dependencies'],
		$asset['version'],
		true
	);

	// Pass feature flag and icon IDs to JS.
	$icon_ids = array();
	if ( defined( 'CET_TROON_2_ENABLE_ICONS' ) && CET_TROON_2_ENABLE_ICONS ) {
		if ( class_exists( '\Cet\Theme\Troon2\Svg\SpriteManager' ) ) {
			$sprite_manager = \Cet\Theme\Troon2\Svg\SpriteManager::getInstance();
			if ( $sprite_manager ) {
				$icon_ids = $sprite_manager->getIds();
			}
		}
	}

	$editor_settings = [
		'enableIcons'    => defined( 'CET_TROON_2_ENABLE_ICONS' ) && CET_TROON_2_ENABLE_ICONS,
		'carouselStyles' => CET_TROON_2_CAROUSEL_STYLES,
	];

	if ( ! empty( $icon_ids ) ) {
		$editor_settings['iconIds'] = $icon_ids;

		wp_localize_script(
			'cet-troon-2-editor',
			'cetIcons',
			array(
				'ids' => $icon_ids,
			)
		);
	}

	wp_localize_script(
		'cet-troon-2-editor',
		'cetTroon2Settings',
		$editor_settings
	);
}
add_action( 'enqueue_block_editor_assets', 'cet_troon_2_enqueue_block_editor_assets' );

/**
 * Enqueue Customizer controls JS.
 */
function cet_troon_2_customize_controls_scripts() {
	$theme_path = get_template_directory();
	$theme_uri  = get_template_directory_uri();

	$asset_path = $theme_path . '/build/js/cet-customizer-controls.min.asset.php';

	$asset = [
		'dependencies' => [],
		'version'      => cet_troon_2_get_theme_version(),
	];

	if ( file_exists( $asset_path ) ) {
		// phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.UsingVariable -- Generated build asset within theme directory.
		$asset = include $asset_path;
	}

	$dependencies = array_values(
		array_unique(
			array_merge(
				$asset['dependencies'] ?? [],
				[ 'customize-controls' ]
			)
		)
	);

	wp_enqueue_script(
		'cet-troon-2-customizer-controls',
		$theme_uri . '/build/js/cet-customizer-controls.min.js',
		$dependencies,
		$asset['version'],
		true
	);
}
add_action( 'customize_controls_enqueue_scripts', 'cet_troon_2_customize_controls_scripts' );

add_action(
	'init',
	function () {
		register_block_pattern_category(
			'troon-components',
			[ 'label' => __( 'Troon Components', 'cet-wp-theme-troon-2' ) ]
		);
		register_block_pattern_category(
			'troon-pages',
			[ 'label' => __( 'Troon Pages', 'cet-wp-theme-troon-2' ) ]
		);
	}
);

/**
 * Set up custom header support.
 */
function cet_wp_theme_troon_custom_header_setup() {
	add_theme_support(
		'custom-header',
		array(
			'default-image' => get_stylesheet_directory_uri() . '/images/Header-Hero.png',
			'width'         => 1920,
			'height'        => 500,
			'header-text'   => false,
		)
	);
}
add_action( 'after_setup_theme', 'cet_wp_theme_troon_custom_header_setup' );

/**
 * Load required files.
 */
require get_template_directory() . '/inc/editor-color-tokens.php';
require get_template_directory() . '/inc/block_styles.php';
require get_template_directory() . '/inc/block_supports.php';
require get_template_directory() . '/inc/enqueue-fonts.php';
require get_template_directory() . '/inc/enqueue-slider.php';
require get_stylesheet_directory() . '/inc/customizer.php';
require get_stylesheet_directory() . '/inc/inline-css.php';
require get_template_directory() . '/inc/woocommerce-classes.php';
