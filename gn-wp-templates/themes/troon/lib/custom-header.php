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

require_once get_stylesheet_directory() . '/classes/WalkerNavMenu.php';
require_once get_stylesheet_directory() . '/classes/WalkerNavAccordion.php';

// Everything under NBCSN Basic Frameworks is executed during the 'after_setup_theme' action
// So to remove actions, we have to dequeue during the same action.
add_action( 'after_setup_theme', 'troon_dequeue_frameworks_header_actions' );

function troon_dequeue_frameworks_header_actions() {
    remove_action( 'genesis_before_header', 'nbcsn_basic_framework_top_bar' );
    remove_action( 'genesis_header', 'nbcsn_basic_framework_do_header' );
    remove_filter( 'genesis_structural_wrap-header', 'nbcsn_basic_framework_header_structural_wrap' );
}

genesis_register_sidebar( array(
    'id'            => 'offcanvas-widget',
    'name'          => __( 'Side Navigation Widget', 'nbcsn-frameworks' ),
    'description'   => __( 'Shows up below the navigation list when toggled', 'nbcsn-frameworks' ),
) );

add_action( 'genesis_before_header', 'troon_loading_bubble' );

function troon_loading_bubble() {
    genesis_markup( [
        'open'          => '<div %s>',
        'close'         => '</div>',
        'context'       => 'loading-screen',
        'content'       => genesis_markup( [
            'open'      => '<div %s>',
            'close'     => '</div>',
            'context'   => 'loader',
            'content'   => '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#999" class="bi bi-circle-fill" viewBox="0 0 16 16"><circle cx="8" cy="8" r="8"/></svg>',
            'echo'      => false,
        ] ),
    ] );
}

add_action( 'genesis_header', 'nbcsn_basic_framework_top_bar', 8 );
add_action( 'genesis_header', 'troon_do_header' );

function troon_do_header() {

    global $wp_registered_sidebars;

    if ( doing_action( 'genesis_after_header' ) ) {
        genesis_markup(
            [
                'open'    => '<div %s>',
                'context' => 'header-row',
                'atts'    => [
                    'class' => 'container-fluid header-row',
                ],
            ],
        );
    } else {
        genesis_markup(
            [
                'open'    => '<div %s>',
                'context' => 'header-row',
                'atts'    => [
                    'class' => 'container header-row',
                ],
            ],
        );
    }

    $menu_icon = genesis_markup(
        [
            'open'          => '<span %s>',
            'close'         => '</span>',
            'context'       => 'menu-icon',
            'echo'          => false,
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

    $class = 'menu genesis-nav-menu menu-primary navbar-nav';

    genesis_nav_menu(
        [
            'theme_location' => 'primary',
            'menu_class'     => $class,
            'walker'         => new \Troon\Walker_Nav_Menu(),
        ]
    );

    genesis_markup( [
        'open'       => '<div %s>',
        'context'    => 'toggle-button-container',
    ] );

    genesis_markup(
        [
            'open'    => '<button %s>',
            'close'   => '</button>',
            'context' => 'navbar-toggler',
            'content' => 'Menu',
            'atts'    => [
                'class'             => 'navbar-toggler',
                'type'              => 'button',
                'data-bs-toggle'    => 'offcanvas',
                'data-bs-target'    => '#genesis-nav-primary-offcanvas',
                'aria-controls'     => 'genesis-nav-primary-offcanvas',
                'aria-expanded'     => 'false',
                'aria-label'        => 'Toggle Main Navigation',
            ],
        ]
    );

    genesis_markup( [
        'close'       => '</div>',
        'context'    => 'toggle-button-container',
    ] );

    genesis_markup(
        [
            'close'   => '</div>',
            'context' => 'header-row',
        ]
    );
}

add_action( 'genesis_after_header', 'troon_offcanvas_navigation' );

function troon_offcanvas_navigation() {
    $class = 'menu genesis-nav-menu menu-primary navbar-nav navbar-nav accordion';

    genesis_nav_menu(
        [
            'theme_location' => 'primary',
            'menu_id'        => 'menu-accordion-primary',
            'menu_class'     => $class,
            'walker'         => new \Troon\Walker_Nav_Accordion(),
        ]
    );
}

if ( function_exists( 'nbcsn_basic_frameworks_get_contrasting_color' ) ) {
    add_filter( 'genesis_structural_wrap-header', 'troon_header_structural_wrap' );
    
    function troon_header_structural_wrap( $output ) {
        $appearance     = genesis_get_config( 'appearance' );
        $navbar_theme   = get_theme_mod( 'theme_appearance_navbar_color', $appearance['navbar-color'] );
        $navbar_text    = nbcsn_basic_frameworks_get_contrasting_color( $navbar_theme, true );
    
        if ( $output === "<div class=\"wrap\">" ) {

            $output = "<div class=\"wrap navbar navbar-expand-lg navbar-{$navbar_text} bg-{$navbar_theme}\">";
        }
    
        return $output;
    }
}

add_filter( 'genesis_markup_nav-primary_open', 'troon_nav_opening_markup', 11 );

function troon_nav_opening_markup( $output ) {
    $appearance         = genesis_get_config( 'appearance' );
    $nav_canvas_theme   = get_theme_mod( 'theme_appearance_nav_canvas_color', $appearance['nav-canvas-color'] );
    $nav_canvas_text    = nbcsn_basic_frameworks_get_contrasting_color( $nav_canvas_theme, true );
    $nav_attributes     = [
        'id'            => 'genesis-nav-primary',
        'class'         => 'nav-primary collapse navbar-collapse',
        'aria-label'    => 'Primary Menu',
    ];

    if ( doing_action( 'genesis_after_header' ) ) {
        $nav_attributes['id']               = 'genesis-nav-primary-offcanvas';
        $nav_attributes['class']            = "nav-primary offcanvas offcanvas-end bg-{$nav_canvas_theme} text-bg-{$nav_canvas_text} navbar-{$nav_canvas_text}";
        $nav_attributes['data-bs-scroll']   = 'true';
        $nav_attributes['data-bs-backdrop'] = 'false';
        $nav_attributes['tabindex']         = '-1';
        $nav_attributes['aria-label']       = 'Primary Mobile Menu';
    }

    $nav_attributes_strings = array_map( function( $value, $attribute ) {
        return sprintf( '%s="%s"', $attribute, $value );
    }, $nav_attributes, array_keys( $nav_attributes ) );

    $output  = "<nav " . implode( "", $nav_attributes_strings ) . ">";
    if ( doing_action( 'genesis_after_header' ) ) {
        $output .= "<div class=\"offcanvas-header\">";
        $output .= "<button type=\"button\" class=\"ms-auto btn-close btn-close-white text-reset\" data-bs-dismiss=\"offcanvas\" data-bs-target=\"#genesis-nav-primary-offcanvas\" aria-label=\"Close\">";
        $output .= "</button>";
        $output .= "</div>";
    }

    return $output;
}

add_filter( 'genesis_structural_wrap-menu-primary', 'troon_nav_structural_wrap', 11 );

function troon_nav_structural_wrap( $output ) {

    if ( doing_action( 'genesis_after_header' ) ) {
        if ( $output === "<div class=\"wrap ms-auto\">" ) {
            $output = "<div class=\"wrap ms-0 offcanvas-body\">";
        }

        if ( $output === "</div>" ) {
            ob_start();
            genesis_widget_area( 'offcanvas-widget', array(
                'before'    => '<div id="offcanvas-widgets" class="widget-area offcanvas-widgets">',
                'after'     => '</div>',
            ) );
            $sidebar = ob_get_clean();

            $output = "{$sidebar}</div>";
        }
    }

    return $output;
}