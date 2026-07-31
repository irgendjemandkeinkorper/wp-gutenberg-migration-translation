<?php
/**
 * GolfNow - Pine.
 *
 * This file adds the default theme settings to the GolfNow - Pine Theme.
 *
 * @package GolfNow - Pine
 * @author  NBCU Sports Next
 * @license GPL-2.0-or-later
 * @link    https://business.golfnow.com/Website-Theme-Library/
 */

require_once get_stylesheet_directory() . '/classes/WalkerNavAccordion.php';
require_once get_stylesheet_directory() . '/classes/WalkerNavMenu.php';

// Everything under NBCSN Basic Frameworks is executed during the 'after_setup_theme' action
// So to remove actions, we have to dequeue during the same action.

add_action( 'after_setup_theme', 'pine_dequeue_frameworks_header_actions' );

function pine_dequeue_frameworks_header_actions() {
	remove_action( 'genesis_before_header', 'nbcsn_basic_framework_top_bar' );
    remove_action( 'genesis_header', 'nbcsn_basic_framework_do_header' );
    remove_filter( 'genesis_structural_wrap-header', 'nbcsn_basic_framework_header_structural_wrap' );
}

add_action( 'genesis_header', 'golfnow_pine_do_header' );

function golfnow_pine_do_header() {

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

	$class = 'menu genesis-nav-menu menu-primary navbar-nav accordion';

    genesis_nav_menu(
        [
            'theme_location' => 'primary',
            'menu_class'     => $class,
            'walker'         => new \GnPine\Walker_Nav_Accordion(),
        ]
    );

	if ( get_theme_mod( 'pine_header_expand_on_lg', false ) ) {
        do_action( 'pine_header_expand_nav' );
    }

	genesis_markup(
		[
			'close'   => '</div>',
			'context' => 'site-inner',
		]
	);
}

add_action( 'pine_header_expand_nav', 'pine_header_do_expand_nav' );

function pine_header_do_expand_nav() {
    $class = 'menu genesis-nav-menu menu-primary navbar-nav';

    genesis_nav_menu(
        [
            'theme_location' => 'primary',
            'menu_class'     => $class,
            'walker'         => new \GnPine\Walker_Nav_Menu(),
        ]
    );
}

if ( function_exists( 'nbcsn_basic_frameworks_get_contrasting_color' ) ) {
    add_filter( 'genesis_structural_wrap-header', 'pine_header_structural_wrap' );
    
    function pine_header_structural_wrap( $output ) {
        $appearance     = genesis_get_config( 'appearance' );
        $navbar_theme   = get_theme_mod( 'theme_appearance_navbar_color', $appearance['navbar-color'] );
        $navbar_text    = nbcsn_basic_frameworks_get_contrasting_color( $navbar_theme, true );
    
        if ( $output === "<div class=\"wrap\">" ) {
            $output = "<div class=\"wrap navbar bg-{$navbar_theme}\">";

            if ( get_theme_mod( 'pine_header_expand_on_lg', false ) ) {
                $output = "<div class=\"wrap navbar navbar-expand-xl bg-{$navbar_theme}\">";
            }
        }
    
        return $output;
    }

	add_filter( 'genesis_markup_nav-primary_open', 'pine_nav_opening_markup', 11 );

	function pine_nav_opening_markup( $output ) {
		$appearance 	= genesis_get_config( 'appearance' );
		$nav_canvas_theme   = get_theme_mod( 'theme_appearance_navbar_color', $appearance['nav-color'] ?? '' );
		$nav_canvas_text    = nbcsn_basic_frameworks_get_contrasting_color( $nav_canvas_theme, true );

		$output = "<button class=\"navbar-toggler d-lg-none\" type=\"button\" data-bs-toggle=\"offcanvas\" data-bs-target=\"#genesis-nav-primary\" aria-controls=\"genesis-nav-primary\" aria-expanded=\"false\" aria-label=\"Toggle Main Navigation\">";
		$output .= "<span class=\"navbar-toggler-icon\"></span>";
		$output .= "</button>";
		$output .= "<nav class=\"nav-primary offcanvas-lg offcanvas-start bg-{$nav_canvas_theme} text-bg-{$nav_canvas_text} navbar-{$nav_canvas_text}\" data-bs-scroll=\"true\" tab-index=\"-1\" aria-label=\"Main\" id=\"genesis-nav-primary\">";
		$output .= "<div class=\"offcanvas-header\">";
		$output .= "<button type=\"button\" class=\"btn-close\" data-bs-dismiss=\"offcanvas\" data-bs-target=\"#genesis-nav-primary\" aria-label=\"Close\"></button>";
		$output .= "</div>";

		return $output;
	}
}



add_filter( 'genesis_structural_wrap-menu-primary', 'pine_nav_structural_wrap', 11 );

function pine_nav_structural_wrap( $output ) {

	if ( $output === "<div class=\"wrap\">" ) {
		$output = "<div class=\"wrap offcanvas-body\">";
	}

	return $output;
}

add_filter( 'wp_nav_menu_args', 'golfnow_pine_menu_args' );

function golfnow_pine_menu_args( $args ) {
	if ( $args['menu_class'] === 'menu genesis-nav-menu menu-primary' ) {
		$args['menu_class'] .= ' navbar-nav accordion';
	}

	return $args;
}


/* Update structure for Top Bar */

add_action( 'genesis_before_header', 'pine_top_bar' );

function pine_top_bar() {
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