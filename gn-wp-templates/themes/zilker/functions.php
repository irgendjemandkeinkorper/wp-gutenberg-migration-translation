<?php
/**
 * zilker.
 *
 * This file adds functions to the zilker Theme.
 *
 * @package zilker
 * @author  NBCU Sports Next
 * @license GPL-2.0-or-later
 * @link    https://business.golfnow.com/Website-Theme-Library/
 */

// Starts the engine.
require_once get_template_directory() . '/lib/init.php';

// Sets up the Theme.
require_once get_stylesheet_directory() . '/lib/theme-defaults.php';

add_action( 'after_setup_theme', 'zilker_localization_setup' );
/**
 * Sets localization (do not remove).
 *
 * @since 1.0.0
 */
function zilker_localization_setup() {

	load_child_theme_textdomain( genesis_get_theme_handle(), get_stylesheet_directory() . '/languages' );

}

// Adds helper functions.
require_once get_stylesheet_directory() . '/lib/helper-functions.php';

// Adds image upload and color select to Customizer.
require_once get_stylesheet_directory() . '/lib/customize.php';

// Includes Customizer CSS.
require_once get_stylesheet_directory() . '/lib/output.php';

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

// Registers the responsive menus.
if ( function_exists( 'genesis_register_responsive_menus' ) ) {
	genesis_register_responsive_menus( genesis_get_config( 'responsive-menus' ) );
}

add_action( 'wp_enqueue_scripts', 'zilker_enqueue_scripts_styles' );
/**
 * Enqueues scripts and styles.
 *
 * @since 1.0.0
 */
function zilker_enqueue_scripts_styles() {

	$appearance = genesis_get_config( 'appearance' );

	if ( key_exists( 'fonts', $appearance ) && is_array( $appearance['fonts'] ) ) {

		$theme_font = get_theme_mod( 'zilker_theme_font', 'roboto' );

		wp_enqueue_style(
			genesis_get_theme_handle() . '-theme-font',
			$appearance['fonts'][$theme_font],
			[],
			null
		);
		
	}

	wp_enqueue_style(
		genesis_get_theme_handle() . '-body-font',
		$appearance['fonts-url'],
		[],
		null
	);
	
	wp_enqueue_style(
		genesis_get_theme_handle() . '-base-styles',
		get_stylesheet_directory_uri() . '/lib/css/style.css',
		[ genesis_get_theme_handle() ],
		genesis_get_theme_version()
	);

	wp_enqueue_style( 'dashicons' );

	if ( genesis_is_amp() ) {
		wp_enqueue_style(
			genesis_get_theme_handle() . '-amp',
			get_stylesheet_directory_uri() . '/lib/amp/amp.css',
			[ genesis_get_theme_handle() ],
			genesis_get_theme_version()
		);
	}
	
	wp_enqueue_script(
		'usl_sportsengine-custom-js',
		get_stylesheet_directory_uri() . '/lib/js/custom.js',
		[],
		genesis_get_theme_version(),
	);

}

add_filter( 'body_class', 'zilker_body_classes' );
/**
 * Add additional classes to the body element.
 *
 * @since 3.4.1
 *
 * @param array $classes Classes array.
 * @return array $classes Updated class array.
 */
function zilker_body_classes( $classes ) {

	if ( ! genesis_is_amp() ) {
		// Add 'no-js' class to the body class values.
		$classes[] = 'no-js';
	}

	$classes[] = 'palette';

	return $classes;
}



add_action( 'genesis_before', 'zilker_js_nojs_script', 1 );
/**
 * Echo the script that changes 'no-js' class to 'js'.
 *
 * @since 3.4.1
 */
function zilker_js_nojs_script() {

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

add_filter( 'wp_resource_hints', 'zilker_resource_hints', 10, 2 );
/**
 * Add preconnect for Google Fonts.
 *
 * @since 3.4.1
 *
 * @param array  $urls          URLs to print for resource hints.
 * @param string $relation_type The relation type the URLs are printed.
 * @return array URLs to print for resource hints.
 */
function zilker_resource_hints( $urls, $relation_type ) {

	if ( wp_style_is( genesis_get_theme_handle() . '-fonts', 'queue' ) && 'preconnect' === $relation_type ) {
		$urls[] = [
			'href' => 'https://fonts.googleapis.com/css2?family=Open+Sans',
			'crossorigin',
		];
	}

	return $urls;
}

add_action( 'after_setup_theme', 'zilker_theme_support', 9 );
/**
 * Add desired theme supports.
 *
 * See config file at `config/theme-supports.php`.
 *
 * @since 3.0.0
 */
function zilker_theme_support() {

	$theme_supports = genesis_get_config( 'theme-supports' );

	foreach ( $theme_supports as $feature => $args ) {
		add_theme_support( $feature, $args );
	}

}

add_action( 'after_setup_theme', 'zilker_post_type_support', 9 );
/**
 * Add desired post type supports.
 *
 * See config file at `config/post-type-supports.php`.
 *
 * @since 3.0.0
 */
function zilker_post_type_support() {

	$post_type_supports = genesis_get_config( 'post-type-supports' );

	foreach ( $post_type_supports as $post_type => $args ) {
		add_post_type_support( $post_type, $args );
	}

}

// Adds image sizes.
add_image_size( 'sidebar-featured', 75, 75, true );
add_image_size( 'genesis-singular-images', 702, 526, true );

// Add custom header
require_once get_stylesheet_directory() . '/lib/custom-header.php';

// Add custom layout adjustments
require_once get_stylesheet_directory() . '/lib/custom-layout.php';

// Add custom footer
require_once get_stylesheet_directory() . '/lib/custom-footer.php';

add_filter( 'genesis_author_box_gravatar_size', 'zilker_author_box_gravatar' );
/**
 * Modifies size of the Gravatar in the author box.
 *
 * @since 2.2.3
 *
 * @param int $size Original icon size.
 * @return int Modified icon size.
 */
function zilker_author_box_gravatar( $size ) {

	return 90;

}

add_filter( 'genesis_comment_list_args', 'zilker_comments_gravatar' );
/**
 * Modifies size of the Gravatar in the entry comments.
 *
 * @since 2.2.3
 *
 * @param array $args Gravatar settings.
 * @return array Gravatar settings with modified size.
 */
function zilker_comments_gravatar( $args ) {

	$args['avatar_size'] = 60;
	return $args;

}

// Fixing widget titles for accessibility
add_filter( 'genesis_register_sidebar_defaults', 'zilker_change_all_widget_titles_to_h2' );

function zilker_change_all_widget_titles_to_h2( $defaults ) {
	$defaults['before_title'] = '<h2 class="widget-title widgettitle">';
	$defaults['after_title'] = "</h2>\n";

	return $defaults;
}

add_filter( 'dynamic_sidebar_params' , 'zilker_change_widget_titles_to_h2' );
function zilker_change_widget_titles_to_h2( $params ) {

    $params[0]['before_title'] = '<h2 class="widget-title widgettitle">' ;
    $params[0]['after_title']  = '</h2>' ;

    return $params;

}

