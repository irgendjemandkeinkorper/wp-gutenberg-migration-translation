<?php

/**
 * Zilker.
 *
 * This file adds the required helper functions used in the Zilker Theme.
 *
 * @package Zilker
 * @author  NBCU Sports Next
 * @license GPL-2.0-or-later
 * @link    https://business.golfnow.com/Website-Theme-Library/
 */

genesis_register_sidebar( array(
    'id'            => 'top-bar',
    'name'          => __( 'Top Bar', 'zilker' ),
    'description'   => __( 'Top bar before navigation', 'zilker' ),
) );

add_action( 'genesis_before_header', 'zilker_top_bar' );

function zilker_top_bar() {
    if ( is_active_sidebar( 'top-bar' ) ) {
        genesis_markup(
            [
                'open'      => '<div %s>',
                'context'   => 'top-bar',
            ]
        );

        genesis_widget_area( 'top-bar', array(
            'before'    => '<div class="site-inner"><div id="top-bar-widgets" class="widget-area top-bar-widgets">',
            'after'     => '</div></div>',
        ) );

        genesis_markup(
            [
                'close'      => '</div>',
                'context'   => 'top-bar',
            ]
        );
    }
}

 // Repositions primary navigation menu.
remove_action( 'genesis_after_header', 'genesis_do_nav' );
remove_action( 'genesis_header', 'genesis_do_header' );
add_action( 'genesis_header', 'zilker_do_header' );

function zilker_do_header() {

	genesis_markup(
		[
			'open'    => '<div %s>',
			'context' => 'site-inner',
		]
	);

	genesis_markup(
		[
			'open'    => '<div %s>',
			'context' => 'title-area',
		]
	);
	
	do_action( 'genesis_site_title' );
	do_action( 'genesis_site_description' );

	genesis_markup(
		[
			'close'   => '</div>',
			'context' => 'title-area',
		]
	);

	$class = 'menu genesis-nav-menu menu-primary';

	genesis_nav_menu(
		[
			'theme_location' => 'primary',
			'menu_class'     => $class,
		]
	);

	genesis_markup(
		[
			'close'   => '</div>',
			'context' => 'site-inner',
		]
	);
}