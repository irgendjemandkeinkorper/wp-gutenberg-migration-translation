<?php
//* Start the engine
include_once( get_template_directory() . '/lib/init.php' );

//* Add Image upload to WordPress Theme Customizer
require_once( get_stylesheet_directory() . '/lib/customize.php' );

//* Include Section Image and Color CSS
include_once( get_stylesheet_directory() . '/lib/output.php' );

//* Child theme (do not remove)
define( 'CHILD_THEME_NAME', __( 'Tillinghast Theme', 'tillinghast' ) );
define( 'CHILD_THEME_URL', 'https://www.teeitupmarketing.com/tillinghast/' );
define( 'CHILD_THEME_VERSION', '1.0.0' );

//* Add HTML5 markup structure
add_theme_support( 'html5', array( 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption' ) );

//* Add viewport meta tag for mobile browsers
add_theme_support( 'genesis-responsive-viewport' );

//* Enqueue Playfair Display and Roboto family of Google fonts
add_action( 'wp_enqueue_scripts', 'tillinghast_google_fonts' );
function tillinghast_google_fonts() {

	wp_enqueue_style( 'dashicons' );
	wp_enqueue_style( 'google-font', '//fonts.googleapis.com/css?family=Playfair+Display:300italic|Roboto:300,700|Roboto+Condensed:300,700|Roboto+Slab:300', array(), PARENT_THEME_VERSION );

}

//* Enqueue Scripts
add_action( 'wp_enqueue_scripts', 'tillinghast_enqueue_scripts' );
function tillinghast_enqueue_scripts() {

	wp_enqueue_script( 'tillinghast-responsive-menu', get_bloginfo( 'stylesheet_directory' ) . '/js/responsive-menu.js', array( 'jquery' ), '1.0.0' );
	
	wp_enqueue_script( 'tillinghast-global-js', get_bloginfo( 'stylesheet_directory' ) . '/js/global.js', array( 'jquery' ), '1.0.0' );
	
}

//* Add support for custom header
add_theme_support( 'custom-header', array(
	'default-text-color'     => 'ffffff',
	'header-selector'        => '.site-title a',
	'height'                 => 175,
	'width'                  => 175,
	'header-text'            => false,
) );

//* Unregister layout settings
genesis_unregister_layout( 'content-sidebar' );
genesis_unregister_layout( 'sidebar-content' );
genesis_unregister_layout( 'content-sidebar-sidebar' );
genesis_unregister_layout( 'sidebar-sidebar-content' );
genesis_unregister_layout( 'sidebar-content-sidebar' );


//* Unregister sidebars
unregister_sidebar( 'sidebar' );
unregister_sidebar( 'sidebar-alt' );

//* Force full-width-content layout setting
add_filter( 'genesis_site_layout', '__genesis_return_full_width_content' );



//* Remove comment form allowed tags
add_filter( 'comment_form_defaults', 'tillinghast_remove_comment_form_allowed_tags' );
function tillinghast_remove_comment_form_allowed_tags( $defaults ) {
	
	$defaults['comment_notes_after'] = '';
	return $defaults;

}

//* Scroll to Top
function scroll_to_top() {
	echo '<div id="stop" class="scrollTop">
    <span><a href=""></a></span>
  </div>';
}
add_action( 'wp_footer', 'scroll_to_top' );

//* Reposition the footer
remove_action( 'genesis_footer', 'genesis_footer_markup_open', 5 );
remove_action( 'genesis_footer', 'genesis_do_footer' );
remove_action( 'genesis_footer', 'genesis_footer_markup_close', 15 );
add_action( 'genesis_header', 'genesis_footer_markup_open', 11 );
add_action( 'genesis_header', 'genesis_footer_markup_close', 13 );


//* Add support for after entry widget
add_theme_support( 'genesis-after-entry-widget-area' );

//* Relocate after entry widget
remove_action( 'genesis_after_entry', 'genesis_after_entry_widget_area' );
add_action( 'genesis_after_entry', 'genesis_after_entry_widget_area', 5 );

//* Add support for 2-column footer widgets
add_theme_support( 'genesis-footer-widgets', 2 );

//* Setup widget counts
function tillinghast_count_widgets( $id ) {
	global $sidebars_widgets;

	if ( isset( $sidebars_widgets[ $id ] ) ) {
		return count( $sidebars_widgets[ $id ] );
	}

}

function tillinghast_widget_area_class( $id ) {
	$count = tillinghast_count_widgets( $id );

	$class = '';

	if( $count == 1 || $count < 9 ) {

		$classes = array(
			'zero',
			'one',
			'two',
			'three',
			'four',
			'five',
			'six',
			'seven',
			'eight',
		);

		$class = $classes[ $count ] . '-widget';
		$class = $count == 1 ? $class : $class . 's';

		return $class;

	} else {

		$class = 'widget-thirds';
		
		return $class;

	}

}

// *homepage widgets
genesis_register_sidebar( array(
	'id'          => 'home-widgets-1',
	'name'        => __( 'Home 1', 'tillinghast' ),
	'description' => __( 'This is the Home 1 section.', 'tillinghast' ),
) );
genesis_register_sidebar( array(
	'id'          => 'home-widgets-2',
	'name'        => __( 'Home 2', 'tillinghast' ),
	'description' => __( 'This is the Home 2 section.', 'tillinghast' ),
) );
genesis_register_sidebar( array(
	'id'          => 'home-widgets-3',
	'name'        => __( 'Home 3', 'tillinghast' ),
	'description' => __( 'This is the Home 3 section.', 'tillinghast' ),
) );
genesis_register_sidebar( array(
	'id'          => 'home-widgets-4',
	'name'        => __( 'Home 4', 'tillinghast' ),
	'description' => __( 'This is the Home 4 section.', 'tillinghast' ),
) );
genesis_register_sidebar( array(
	'id'          => 'home-widgets-5',
	'name'        => __( 'Home 5', 'tillinghast' ),
	'description' => __( 'This is the Home 5 section.', 'tillinghast' ),
) );
genesis_register_sidebar( array(
	'id'          => 'home-widgets-6',
	'name'        => __( 'Home 6', 'tillinghast' ),
	'description' => __( 'This is the Home 6 section.', 'tillinghast' ),
) );