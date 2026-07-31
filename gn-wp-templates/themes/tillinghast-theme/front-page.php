<?php
/**
 * This file adds the Home Page to the Tillinghast Theme.
 *
 * @author StudioPress
 * @package Tillinghast
 * @subpackage Customizations
 */
 
 
add_action( 'genesis_meta', 'tillinghast_home_genesis_meta' );
/**
 * Add widget support for homepage. If no widgets active, display the default loop.
 *
 */
function tillinghast_home_genesis_meta() {

	if ( is_active_sidebar( 'home-widgets-1' ) || is_active_sidebar( 'home-widgets-2' ) || is_active_sidebar( 'home-widgets-3' ) || is_active_sidebar( 'home-widgets-4' ) || is_active_sidebar( 'home-widgets-5' ) || is_active_sidebar( 'home-widgets-6' ) ) {
		
		add_action( 'wp_enqueue_scripts', 'tillinghast_enqueue_tillinghast_script' );
		function tillinghast_enqueue_tillinghast_script() {

			wp_enqueue_script( 'home-script', get_bloginfo( 'stylesheet_directory' ) . '/js/home.js', array( 'jquery' ), '1.0.0' );

		}

		//* Force full width content layout
		add_filter( 'genesis_pre_get_option_site_layout', '__genesis_return_full_width_content' );

		//* Add tillinghast-pro-home body class
		add_filter( 'body_class', 'tillinghast_body_class' );
		
		//* Remove breadcrumbs
		remove_action( 'genesis_before_loop', 'genesis_do_breadcrumbs' );

		//* Remove the default Genesis loop
		remove_action( 'genesis_loop', 'genesis_do_loop' );
		
		//* Add home widgets
		add_action( 'genesis_after_content_sidebar_wrap', 'tillinghast_home_widgets', 5 );
		
		function tillinghast_body_class( $classes ) {

			$classes[] = 'tillinghast-pro-home';
			return $classes;
			
		}
	}
}


function tillinghast_home_widgets() {
	
	echo '<div id="home-widgets" class="home-widgets">';
	
	genesis_widget_area( 'home-widgets-1', array(
		'before' => '<div id="home-widgets-1" class="home-widgets-1 image-section"><div class="widget-area ' . tillinghast_widget_area_class( 'home-widgets-1' ) . '"><div class="wrap">',
		'after'  => '</div></div></div>',
	) );
	
	genesis_widget_area( 'home-widgets-2', array(
		'before' => '<div id="home-widgets-2" class="home-widgets-2 color-section"><div class="widget-area ' . tillinghast_widget_area_class( 'home-widgets-2' ) . '"><div class="wrap">',
		'after'  => '</div></div></div>',
	) );
	
	genesis_widget_area( 'home-widgets-3', array(
		'before' => '<div id="home-widgets-3" class="home-widgets-3 image-section"><div class="widget-area ' . tillinghast_widget_area_class( 'home-widgets-3' ) . '"><div class="wrap">',
		'after'  => '</div></div></div>',
	) );
	
	genesis_widget_area( 'home-widgets-4', array(
		'before' => '<div id="home-widgets-4" class="home-widgets-4 color-section"><div class="widget-area ' . tillinghast_widget_area_class( 'home-widgets-4' ) . '"><div class="wrap">',
		'after'  => '</div></div></div>',
	) );
	
	genesis_widget_area( 'home-widgets-5', array(
		'before' => '<div id="home-widgets-5" class="home-widgets-5 image-section"><div class="widget-area ' . tillinghast_widget_area_class( 'home-widgets-5' ) . '"><div class="wrap">',
		'after'  => '</div></div></div>',
	) );
	
	genesis_widget_area( 'home-widgets-6', array(
		'before' => '<div id="home-widgets-6" class="home-widgets-6 color-section"><div class="widget-area ' . tillinghast_widget_area_class( 'home-widgets-6' ) . '"><div class="wrap">',
		'after'  => '</div></div></div>',
	) );
	
	echo '</div>';

}

genesis();