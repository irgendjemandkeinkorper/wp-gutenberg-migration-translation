<?php

/**
 * GolfNow - Dogwood.
 *
 * This file adds the required helper functions used in the GolfNow - Dogwood Theme.
 *
 * @package GolfNow - Dogwood
 * @author  NBCU Sports Next
 * @license GPL-2.0-or-later
 * @link    https://business.golfnow.com/Website-Theme-Library/
 */

require_once get_stylesheet_directory() . '/classes/WalkerNavMenu.php';

// Everything under NBCSN Basic Frameworks is executed during the 'after_setup_theme' action
// So to remove actions, we have to dequeue during the same action.
add_action( 'after_setup_theme', 'dogwood_dequeue_frameworks_header_actions' );

function dogwood_dequeue_frameworks_header_actions() {
    remove_action( 'genesis_before_header', 'nbcsn_basic_framework_top_bar' );
    remove_action( 'genesis_header', 'nbcsn_basic_framework_do_header' );
    remove_filter( 'genesis_structural_wrap-header', 'nbcsn_basic_framework_header_structural_wrap' );
}

// Repositions and restructures primary navigation menu
add_action( 'genesis_header', 'golfnow_dogwood_do_header' );

function golfnow_dogwood_do_header() {

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
            'walker'         => new \GnDogWood\Walker_Nav_Menu(),
        ]
    );

    genesis_markup(
        [
            'close'   => '</div>',
            'context' => 'site-inner',
        ]
    );
}

// splitting dogwood menu in half and repositioning logo
add_filter( 'wp_nav_menu_items', 'golfnow_dogwood_split_nav', 10, 2);

/**
 * Split the primary navigation menu in half and reposition the logo.
 * 
 * @param string $output The menu HTML output.
 * @param object $args The menu arguments.
 * 
 * @return string The modified menu HTML output.
 */
function golfnow_dogwood_split_nav( $output, $args ) {

    if ( $args->theme_location === 'primary' ) {
        // Get array for all top level nav items
        $links_pos = strposa( $output, 'nav-link' );
    
        // Find the halfway point and add a bias to fix some of the weird display balancing issues
        $halved = array_chunk( $links_pos, floor( count( $links_pos ) / 2 ) + 1 );
        $center = count( $halved[0] ) - 1;
        $center_link = $halved[0][$center];

        // Find all <li openings, since we already filtered for nav links
        $li_pos = strposa( $output, '<li' );

        // Find the <li closest to the centerermost link
        $closest_pos = findcloseststr( $li_pos, $center_link );

        // Put the logo in a box
        ob_start();

        do_action( 'genesis_site_title' );
        do_action( 'genesis_site_description' );

        $logo_contents = ob_get_clean();

        // Reformatting the output to make insertion position more clear
        // No matter what tags we use we are committing <ul blasphamy
        $logo = genesis_markup(
            [
                'open'    => '<div %s>',
                'close'   => '</div>',
                'context' => 'title-area',
                'content' => $logo_contents,
                'echo'    => false,
            ]
        );

        $output_left = genesis_markup( [
            'open'      => '<div %s>',
            'close'     => '</div>',
            'context'   => 'nav-wrap-left',
            'atts'      => [
                'class' => 'nav-wrap left',
            ],
            'content'   => substr( $output, 0, $closest_pos ),  // Everything before the halfway point
            'echo'      => false,
        ] );

        $output_right = genesis_markup( [
            'open'      => '<div %s>',
            'close'     => '</div>',
            'context'   => 'nav-wrap-right',
            'atts'      => [
                'class' => 'nav-wrap right',
            ],
            'content'   => substr( $output, $closest_pos ), // Everything after the midpoint
            'echo'      => false,
        ] );

        $output = $output_left . $logo . $output_right;
    }

    return $output;
}

// Adding Bootstrap classes to menu
if ( function_exists( 'nbcsn_basic_frameworks_get_contrasting_color' ) ) {
    add_filter( 'genesis_structural_wrap-header', 'dogwood_header_structural_wrap' );
    
    function dogwood_header_structural_wrap( $output ) {
        $appearance     = genesis_get_config( 'appearance' );
        $navbar_theme   = get_theme_mod( 'theme_appearance_navbar_color', $appearance['navbar-color'] );
        $navbar_link    = nbcsn_basic_frameworks_get_contrasting_color( $navbar_theme, true );
        $navbar_text    = nbcsn_basic_frameworks_get_contrasting_color( $navbar_theme );

        if ( $output === "<div class=\"wrap\">" ) {
            $output = "<div class=\"wrap navbar navbar-expand-lg navbar-{$navbar_link} bg-{$navbar_theme} text-{$navbar_text}\">";
        }

        return $output;
    }
}

add_filter( 'genesis_markup_nav-primary_open', 'dogwood_nav_opening_markup' );

function dogwood_nav_opening_markup( $output ) {

    $output = "<button class=\"navbar-toggler\" type=\"button\" data-bs-toggle=\"collapse\" data-bs-target=\"#genesis-nav-primary\" aria-controls=\"genesis-nav-primary\" aria-expanded=\"false\" aria-label=\"Toggle Main Navigation\">";
    $output .= "<span class=\"navbar-toggler-icon\"></span>";
    $output .= "</button>";
    $output .= "<nav class=\"nav-primary collapse navbar-collapse\" aria-label=\"Main\" id=\"genesis-nav-primary\">";

    return $output;
}

add_filter( 'wp_nav_menu_args', 'golfnow_dogwood_menu_args' );

function golfnow_dogwood_menu_args( $args ) {
    if ( $args['menu_class'] === 'menu genesis-nav-menu menu-primary' ) {
        $args['menu_class'] .= ' navbar-nav';
    }

    return $args;
}

add_action( 'genesis_before_header', 'dogwood_top_bar' );

function dogwood_top_bar() {
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

add_filter( 'genesis_structural_wrap-menu-primary', 'golfnow_dogwood_nav_structural_wrap' );

function golfnow_dogwood_nav_structural_wrap( $output ) {

    if ( $output === "<div class=\"wrap\">" || $output === "<div class=\"wrap ms-auto\">" ) {
        $output = "<div class=\"wrap ms-auto me-auto\">";
    }

    return $output;
}