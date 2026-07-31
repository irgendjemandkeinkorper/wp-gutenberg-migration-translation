<?php
/**
 * Sunstone Pro.
 *
 * This file adds functions to the Sunstone Pro Theme.
 *
 * @package Sunstone Pro
 */

// Starts the engine.
require_once get_template_directory() . '/lib/init.php';

// Sets up the Theme.
require_once get_stylesheet_directory() . '/lib/theme-defaults.php';

add_action( 'after_setup_theme', 'sunstone_pro_localization_setup' );
/**
 * Sets localization (do not remove).
 *
 * @since 1.0.0
 */
function sunstone_pro_localization_setup() {
	load_child_theme_textdomain( genesis_get_theme_handle(), get_stylesheet_directory() . '/languages' );
}

// Adds helper functions.
require_once get_stylesheet_directory() . '/lib/helper-functions.php';

// Adds image upload and color select to Customizer.
require_once get_stylesheet_directory() . '/lib/customize.php';

// Includes Customizer CSS.
require_once get_stylesheet_directory() . '/lib/output.php';

// WPForms accessibility.
require_once get_stylesheet_directory() . '/lib/wpforms-accessibility.php';

// Adds WooCommerce support.
require_once get_stylesheet_directory() . '/lib/woocommerce/woocommerce-setup.php';

// Adds the required WooCommerce styles and Customizer CSS.
require_once get_stylesheet_directory() . '/lib/woocommerce/woocommerce-output.php';

// Adds the Genesis Connect WooCommerce notice.
require_once get_stylesheet_directory() . '/lib/woocommerce/woocommerce-notice.php';

add_action( 'after_setup_theme', 'genesis_child_gutenberg_support' );
/**
 * Adds Gutenberg opt-in features and styling.
 *
 * @since 2.7.0
 */
function genesis_child_gutenberg_support() { // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedFunctionFound -- using same in all child themes to allow action to be unhooked.
	require_once get_stylesheet_directory() . '/lib/gutenberg/init.php';
}

add_action( 'wp_enqueue_scripts', 'sunstone_pro_enqueue_scripts_styles' );
/**
 * Enqueues scripts and styles.
 *
 * @since 1.0.0
 */
function sunstone_pro_enqueue_scripts_styles() {
	$appearance = genesis_get_config( 'appearance' );

	wp_enqueue_style( 'dashicons' );

	if ( genesis_is_amp() ) {
		wp_enqueue_style(
			genesis_get_theme_handle() . '-amp',
			get_stylesheet_directory_uri() . '/lib/amp/amp.css',
			[ genesis_get_theme_handle() ],
			genesis_get_theme_version()
		);
	}

	wp_enqueue_style(
		'sunstone-pro-styles',
		get_stylesheet_directory_uri() . '/assets/dist/main.css',
		[],
		filemtime( get_stylesheet_directory() . '/assets/dist/main.css' ),
		false
	);

	wp_enqueue_script(
		'sunstone-pro-scripts',
		get_stylesheet_directory_uri() . '/assets/dist/index.js',
		array(),
		filemtime( get_stylesheet_directory() . '/assets/dist/main.css' ),
		true
	);
}

add_action( 'customize_preview_init', 'sunstone_pro_frameworks_preview' );
/**
 * Enqueues customizer preview scripts.
 *
 * @since 1.0.0
 */
function sunstone_pro_frameworks_preview() {
	wp_enqueue_script(
		'nbcsn_preview_toggle_scripts',
		get_stylesheet_directory_uri() . '/assets/dist/preview.js',
		[],
		filemtime( get_stylesheet_directory() . '/assets/dist/preview.js' ),
		true
	);
}

add_filter( 'body_class', 'sunstone_pro_body_classes' );
/**
 * Add additional classes to the body element.
 *
 * @since 3.4.1
 *
 * @param array $classes Classes array.
 * @return array $classes Updated class array.
 */
function sunstone_pro_body_classes( $classes ) {
	if ( ! genesis_is_amp() ) {
		// Add 'no-js' class to the body class values.
		$classes[] = 'no-js';
	}

	$logo_toggle = get_theme_mod( 'sunstone_pro_logo_toggle', false );

	if ( ! $logo_toggle && in_array( 'home', $classes, true ) ) {
		$classes[] = 'logo-hidden';
	}

	return $classes;
}

add_action( 'genesis_before', 'sunstone_pro_js_nojs_script', 1 );
/**
 * Echo the script that changes 'no-js' class to 'js'.
 *
 * @since 3.4.1
 */
function sunstone_pro_js_nojs_script() {
	if ( genesis_is_amp() ) {
		return;
	}

	?>
	<script>
	//<![CDATA[
	(function(){
		var c = document.body.classList;
		c.remove( 'no-js' );
		c.add( 'js' );
	})();
	//]]>
	</script>
	<?php
}

/**
 * Add preconnect for Google Fonts.
 *
 * @since 3.4.1
 *
 * @param array  $urls          URLs to print for resource hints.
 * @param string $relation_type The relation type the URLs are printed.
 * @return array URLs to print for resource hints.
 */
function sunstone_pro_resource_hints( $urls, $relation_type ) {
	if ( wp_style_is( genesis_get_theme_handle() . '-fonts', 'queue' ) && 'preconnect' === $relation_type ) {
		$urls[] = [
			'href' => 'https://fonts.gstatic.com',
			'crossorigin',
		];
	}

	return $urls;
}

add_filter( 'wp_resource_hints', 'sunstone_pro_resource_hints', 10, 2 );

add_action( 'after_setup_theme', 'sunstone_pro_theme_support', 9 );
/**
 * Add desired theme supports.
 *
 * See config file at `config/theme-supports.php`.
 *
 * @since 3.0.0
 */
function sunstone_pro_theme_support() {
	$theme_supports = genesis_get_config( 'theme-supports' );

	foreach ( $theme_supports as $feature => $args ) {
		add_theme_support( $feature, $args );
	}
}

add_action( 'after_setup_theme', 'sunstone_pro_post_type_support', 9 );
/**
 * Add desired post type supports.
 *
 * See config file at `config/post-type-supports.php`.
 *
 * @since 3.0.0
 */
function sunstone_pro_post_type_support() {
	$post_type_supports = genesis_get_config( 'post-type-supports' );

	foreach ( $post_type_supports as $post_type => $args ) {
		add_post_type_support( $post_type, $args );
	}
}

// Force full width content layout.
add_filter( 'genesis_site_layout', '__genesis_return_full_width_content' );

// Adds image sizes.
add_image_size( 'genesis-singular-images', 702, 526, true );

// Removes header right widget area.
unregister_sidebar( 'header-right' );

// Removes secondary sidebar.
unregister_sidebar( 'sidebar-alt' );
unregister_sidebar( 'sidebar' );

// Removes site layouts.
genesis_unregister_layout( 'content-sidebar-sidebar' );
genesis_unregister_layout( 'sidebar-content-sidebar' );
genesis_unregister_layout( 'sidebar-sidebar-content' );
genesis_unregister_layout( 'sidebar-content' );
genesis_unregister_layout( 'content-sidebar' );

// Repositions primary navigation menu.
remove_action( 'genesis_after_header', 'genesis_do_nav' );

// Reworking the navigation menu.
/**
 * Outputs the primary navigation menu via template part.
 *
 * @since 1.0.0
 */
function sunstone_pro_do_nav() {
	get_template_part( 'template-parts/header-nav' );
}

add_action( 'genesis_header', 'sunstone_pro_do_nav', 12 );

// Adding Navbar Toggle.
/**
 * Replaces the primary nav opening markup with Bootstrap-compatible markup.
 *
 * @since 1.0.0
 *
 * @param string $output Original opening markup.
 * @return string Modified opening markup.
 */
function sunstone_pro_nav_opening_markup( $output ) {
	$output  = '<button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#genesis-nav-primary" aria-controls="genesis-nav-primary" aria-expanded="false" aria-label="Toggle Main Navigation">';
	$output .= '<span class="navbar-toggler-icon"></span>';
	$output .= '</button>';
	$output .= '<nav class="nav-primary collapse navbar-collapse" aria-label="Main" id="genesis-nav-primary">';

	return $output;
}

add_filter( 'genesis_markup_nav-primary_open', 'sunstone_pro_nav_opening_markup' );

// Adding navbar container for responsiveness.
/**
 * Wraps the header in Bootstrap navbar markup.
 *
 * @since 1.0.0
 *
 * @param string $output Original structural wrap output.
 * @return string Modified structural wrap output.
 */
function sunstone_pro_header_structural_wrap( $output ) {
	if ( '<div class="wrap">' === $output ) {
		$output = '<div class="wrap navbar navbar-expand-lg">';
	}

	return $output;
}

add_filter( 'genesis_structural_wrap-header', 'sunstone_pro_header_structural_wrap' );

// Repositions the secondary navigation menu.
remove_action( 'genesis_after_header', 'genesis_do_subnav' );
add_action( 'genesis_footer', 'genesis_do_subnav', 10 );

add_filter( 'wp_nav_menu_args', 'sunstone_pro_secondary_menu_args' );
/**
 * Reduces secondary navigation menu to one level depth.
 *
 * @since 2.2.3
 *
 * @param array $args Original menu options.
 * @return array Menu options with depth set to 1.
 */
function sunstone_pro_secondary_menu_args( $args ) {
	if ( 'secondary' === $args['theme_location'] ) {
		$args['depth'] = 1;
	}

	return $args;
}

add_filter( 'genesis_author_box_gravatar_size', 'sunstone_pro_author_box_gravatar' );
/**
 * Modifies size of the Gravatar in the author box.
 *
 * @since 2.2.3
 *
 * @return int Modified icon size.
 */
function sunstone_pro_author_box_gravatar() {
	return 90;
}

add_filter( 'genesis_comment_list_args', 'sunstone_pro_comments_gravatar' );
/**
 * Modifies size of the Gravatar in the entry comments.
 *
 * @since 2.2.3
 *
 * @param array $args Gravatar settings.
 * @return array Gravatar settings with modified size.
 */
function sunstone_pro_comments_gravatar( $args ) {
	$args['avatar_size'] = 60;
	return $args;
}

add_action( 'wpforms_display_fields_before', 'sunstone_pro_indicate_required_fields' );
/**
 * Modifies the form output to indicate that required fields are marked with an asterisk.
 */
function sunstone_pro_indicate_required_fields() {
	echo '<p class="wpforms-required-label">' . esc_html__( 'Required fields are marked with an asterisk (*).', 'sunstone-pro' ) . '</p>';
}

add_action( 'after_setup_theme', 'sunstone_pro_social_menu_setup' );
/**
 * Creates header social menu.
 */
function sunstone_pro_social_menu_setup() {
	register_nav_menus(
		array(
			'header-social-menu' => esc_html__( 'Social Menu', 'rkv' ),
		)
	);
}

// Entry markup customizations for pages.
require_once get_stylesheet_directory() . '/classes/WordPressHooks.php';
require_once get_stylesheet_directory() . '/classes/EntryMarkup.php';

$hooks = new \SunstonePro\WordPressHooks();
( new \SunstonePro\EntryMarkup( $hooks ) )->register_hooks();

// Moving Footer stuff to custom footer file.
require_once get_stylesheet_directory() . '/lib/custom-footer.php';
