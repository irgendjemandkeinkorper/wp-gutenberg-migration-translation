<?php
/**
 * GolfNow - Mulberry.
 *
 * This file adds the default theme settings to the GolfNow - Mulberry Theme.
 *
 * @package GolfNow - Mulberry
 * @author  NBCU Sports Next
 * @license GPL-2.0-or-later
 * @link    https://business.golfnow.com/Website-Theme-Library/
 */

add_action( 'after_setup_theme', 'mulberry_dequeue_frameworks_header_actions' );

function mulberry_dequeue_frameworks_header_actions() {
    remove_action( 'genesis_before_header', 'nbcsn_basic_framework_top_bar' );
}

add_action( 'genesis_before_header', 'mulberry_top_bar' );

function mulberry_top_bar() {
    $appearance     = genesis_get_config( 'appearance' );
    $top_bar_theme  = get_theme_mod( 'theme_appearance_top_bar_color', $appearance['top-bar-color'] );
    $top_bar_text   = nbcsn_basic_frameworks_get_contrasting_color( $top_bar_theme );

    if ( is_active_sidebar( 'top-bar' ) ) {
        genesis_markup(
            [
                'open'      => '<div %s>',
                'context'   => 'top-bar',
                'atts'      => [
                    'class' => 'top-bar' . ' bg-' . $top_bar_theme . ' text-' . $top_bar_text,
                ],
            ]
        );

        genesis_widget_area( 'top-bar', array(
            'before'    => '<div class="wrap"><div class="site-inner"><div id="top-bar-widgets" class="widget-area top-bar-widgets">',
            'after'     => '</div></div></div>',
        ) );

        genesis_markup(
            [
                'close'      => '</div>',
                'context'   => 'top-bar',
            ]
        );
    }
}