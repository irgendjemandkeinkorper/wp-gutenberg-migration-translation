<?php

/**
 * Diamond.
 *
 * This file adds the required helper functions used in the Diamond Theme.
 *
 * @package Diamond
 * @author  NBCU Sports Next
 * @license GPL-2.0-or-later
 * @link    https://business.golfnow.com/Website-Theme-Library/
 */

// Removes After Entry sidebar.
unregister_sidebar( 'after-entry' );

// Removes Primary sidebar.
unregister_sidebar( 'sidebar' );

// Removes secondary sidebar.
unregister_sidebar( 'sidebar-alt' );

// Removes site layouts.
genesis_unregister_layout( 'content-sidebar-sidebar' );
genesis_unregister_layout( 'sidebar-content-sidebar' );
genesis_unregister_layout( 'sidebar-sidebar-content' );
genesis_unregister_layout( 'content-sidebar' );
genesis_unregister_layout( 'sidebar-content' );

// Use full width layout 
add_filter( 'genesis_pre_get_option_site_layout', '__genesis_return_full_width_content' );

add_action( 'genesis_entry_header', 'zilker_content_separator', 12 );

remove_action( 'genesis_before_loop', 'genesis_do_breadcrumbs' );
add_action( 'genesis_entry_header', 'genesis_do_breadcrumbs', 11 );

// Adds separator under the header if it is there.
function zilker_content_separator() {
    if (!genesis_entry_header_hidden_on_current_page()) {
        genesis_markup( [
            'open' => '<div %s>', 
            'context' => 'separator-2', 
            'close' => '</div>'
        ] );    
    }
}


add_filter( 'genesis_breadcrumb_args', 'zilker_breadcrumb_modifications' );
/**
 * Add additional classes to the body element.
 *
 * @since 1.0.0
 *
 * @param array $args WordPress breadcrumbs argument array.
 */
function zilker_breadcrumb_modifications( $args ) {
	$args['labels']['prefix'] 		= '';
	$args['home'] 					= '<span class="dashicons dashicons-admin-home"></span>'. __( 'Home', 'zilker' );
	$args['sep'] 					= '<span class="sep">/</span>';
	$args['list_sep'] 				= ', ';
	$args['prefix'] 				= '<div class="breadcrumb"><div class="site-inner">';
	$args['suffix'] 				= '</div></div>';
	$args['labels']['post_type'] 	= '';


	return $args;
}