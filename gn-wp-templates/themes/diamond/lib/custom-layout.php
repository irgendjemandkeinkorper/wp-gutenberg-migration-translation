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

add_action( 'genesis_entry_header', 'diamond_content_separator' );

// Adds separator under the header if it is there.

function diamond_content_separator() {
    if (!genesis_entry_header_hidden_on_current_page()) {
        genesis_markup( [
            'open' => '<div %s>', 
            'context' => 'separator-2', 
            'close' => '</div>'
        ] );    
    }
}