<?php
/**
 * Troon.
 *
 * This file adds the default theme settings to the Troon Theme.
 *
 * @package Troon
 * @author  NBCU Sports Next
 * @license GPL-2.0-or-later
 * @link    https://business.golfnow.com/Website-Theme-Library/
 */

add_action( 'after_setup_theme', 'troon_remove_footer_actions' );

function troon_remove_footer_actions() {
    remove_action( 'genesis_footer', 'nbcsn_basic_frameworks_return_to_top_button', 7 );
}

add_action( 'genesis_before_footer', 'nbcsn_basic_frameworks_return_to_top_button', 18 );

add_action( 'genesis_footer', 'troon_hr_above_branding_footer', 9 );

function troon_hr_above_branding_footer() {
    genesis_markup( [
        'open'      => '<div %s>',
        'close'     => '</div>',
        'context'   => 'hr-container-for-footer',
        'content'   => '<hr />',
    ] );

    $logo_color = get_option( 'child_override_logo_color' );
    $logo_url   = get_stylesheet_directory_uri() . '/images/troon-logo.png';

    if ( $logo_color === 'white' ) {
        $logo_url   = get_stylesheet_directory_uri() . '/images/troon-logo-white.png';
    }

    genesis_markup( [
        'open'      => '<div %s>',
        'close'     => '</div>',
        'context'   => 'troon-logo',
        'content'   => '<a href="' . sanitize_url( 'https://www.troon.com/' ) . '" target="_blank" rel="noreferrer nofollower"><img src="' . sanitize_url( $logo_url ) . '" alt="Troon Golf"/></a>',
    ] );
}