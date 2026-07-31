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
	'id'          => 'footer-widget-1',
	'name'        => __( 'Footer Widget 1', 'zilker' ),
	'description' => __( 'Footer section 1.', 'zilker' ),
) );

genesis_register_sidebar( array(
	'id'          => 'footer-widget-2',
	'name'        => __( 'Footer Widget 2', 'zilker' ),
	'description' => __( 'Footer section 2.', 'zilker' ),
) );

genesis_register_sidebar( array(
	'id'          => 'footer-widget-3',
	'name'        => __( 'Footer Widget 3', 'zilker' ),
	'description' => __( 'Footer section 3.', 'zilker' ),
) );

add_action( 'genesis_footer', 'zilker_footer_widgets', 8 );

function zilker_footer_widgets() {

    genesis_markup(
		[
			'open'		=> '<div %s>',
			'context'	=> 'footer-widgets',
            'atts'      => [
                'class'   => 'footer-widgets site-inner',
            ],
		]
	);

    genesis_markup(
		[
			'open'		=> '<div %s>',
			'context'	=> 'footer-row',
            'atts'      => [
                'class' => 'row',
            ],
		]
	);

    $widget_areas = array(
        'footer-widget-1',
        'footer-widget-2',
        'footer-widget-3',
    );

    foreach( $widget_areas as $widget_area ) {
        if ( is_active_sidebar( $widget_area ) ) {
            genesis_widget_area( $widget_area, array(
                'before'    => '<div id="' . $widget_area . '" class="widget-area ' . $widget_area . '">',
                'after'     => '</div>'
            ) );
        }
    }

    genesis_markup(
		[
			'close'		=> '</div>',
			'context'	=> 'footer-row',
		]
	);

    genesis_markup(
		[
			'close'		=> '</div>',
			'context'	=> 'footer-widgets',
		]
	);
}

add_action( 'genesis_footer', 'zilker_return_to_top_button' );

function zilker_return_to_top_button() {
    genesis_markup(
		[
			'open'		=> '<div %s>',
			'close'		=> '</div>',
			'context'	=> 'return-to-top-button__container',
		]
	);
}

// Repositions the secondary navigation menu.
remove_action( 'genesis_after_header', 'genesis_do_subnav' );
add_action( 'genesis_footer', 'genesis_do_subnav', 9 );

add_filter( 'wp_nav_menu_args', 'zilker_secondary_menu_args' );
/**
 * Reduces secondary navigation menu to one level depth.
 *
 * @since 2.2.3
 *
 * @param array $args Original menu options.
 * @return array Menu options with depth set to 1.
 */
function zilker_secondary_menu_args( $args ) {

	if ( 'secondary' === $args['theme_location'] ) {
		$args['depth'] = 1;
	}

	return $args;

}