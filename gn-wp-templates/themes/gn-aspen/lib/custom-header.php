<?php
/**
 * GolfNow - Aspen.
 *
 * This file adds the default theme settings to the GolfNow - Aspen Theme.
 *
 * @package GolfNow - Aspen
 * @author  NBCU Sports Next
 * @license GPL-2.0-or-later
 * @link    https://business.golfnow.com/Website-Theme-Library/
 */

add_filter( 'genesis_attr_site-header', 'golfnow_aspen_site_header' );

function golfnow_aspen_site_header( $output ) {
    if ( golfnow_aspen_is_home() ) {
        $output['class'] .= ' floating';
    }

    return $output;
}

add_filter( 'genesis_structural_wrap-header', 'golfnow_aspen_header_structural_wrap', 11 );

function golfnow_aspen_header_structural_wrap( $output ) {
    $appearance     = genesis_get_config( 'appearance' );
    $navbar_float   = get_theme_mod( 'theme_appearance_navbar_float_color', $appearance['navbar-float-color'] );
    $navbar_text    = nbcsn_basic_frameworks_get_contrasting_color( $navbar_float, true );

    if ( golfnow_aspen_is_home() && strpos( $output, "wrap" ) ) {
        $class_finder = "class=\"";
        $start = strpos( $output, $class_finder ) + strlen( $class_finder );
        $end = strpos( $output, "\">" ) - $start;
        $classes = explode( " ", substr( $output, $start, $end ) );
        $navbar_dark_light = "";
        $navbar_bg = "";

        foreach ( $classes as $key => $class ) {
            if ( strlen( $navbar_dark_light ) > 0 && strlen( $navbar_bg ) > 0 ) {
                break;
            }

            if ( $class === "navbar-dark" || $class === "navbar-light" ) {
                $navbar_dark_light = $class;
                $classes[$key] = 'navbar-' . $navbar_text;
            }

            if ( str_contains( $class, "bg-" ) ) {
                $navbar_bg = $class;
                $classes[$key] = 'bg-' . $navbar_float;
            }
        }

        array_push( $classes, 'navbar-translucent-10' );
        

        $behavior_data = [
            'navbar'        => [
                'stuck'     => 'navbar-' . $navbar_text,
                'sticky'    => $navbar_dark_light,
            ],
            'bg'            => [
                'stuck'     => 'bg-' . $navbar_float,
                'sticky'    => $navbar_bg,
            ],
            'translucent'   => [
                'stuck'     => 'navbar-translucent-10',
                'sticky'    => 'navbar-translucent',
            ]
        ];

        $output = '<div class="' . implode( " ", $classes ) . '" data-theme-header=\'' . wp_json_encode( $behavior_data ) . '\'>';
    }

    return $output;
}

remove_filter( 'genesis_markup_nav-primary_open', 'nbcsn_basic_framework_nav_opening_markup' );
remove_filter( 'genesis_structural_wrap-menu-primary', 'nbcsn_basic_framework_nav_structural_wrap' );

add_filter( 'genesis_markup_nav-primary_open', 'golfnow_aspen_nav_opening_markup', 11 );

function golfnow_aspen_nav_opening_markup( $output ) {
    $appearance     = genesis_get_config( 'appearance' );
    $navbar         = get_theme_mod( 'theme_appearance_navbar_color', $appearance['navbar-color'] );
    $navbar_text    = nbcsn_basic_frameworks_get_contrasting_color( $navbar );

    $output = "<button class=\"navbar-toggler d-lg-none\" type=\"button\" data-bs-toggle=\"offcanvas\" data-bs-target=\"#genesis-nav-primary\" aria-controls=\"genesis-nav-primary\" aria-expanded=\"false\" aria-label=\"Toggle Main Navigation\">";
    $output .= "<span class=\"navbar-toggler-icon\"></span>";
    $output .= "</button>";
    $output .= "<nav class=\"nav-primary offcanvas-lg offcanvas-end bg-{$navbar} text-{$navbar_text} bg-lg-transparent\" aria-label=\"Main\" id=\"genesis-nav-primary\">";
    $output .= "<div class=\"offcanvas-header\">";
    $output .= "<button type=\"button\" class=\"ms-auto btn-close btn-close-{$navbar_text} text-reset\" data-bs-dismiss=\"offcanvas\" data-bs-target=\"#genesis-nav-primary\" aria-label=\"Close\">";
    $output .= "</button>";
    $output .= "</div>";

    return $output;
}

add_filter( 'nav_menu_submenu_css_class', 'golfnow_aspen_submenu_css_options' );

function golfnow_aspen_submenu_css_options( $classes ) {
    $appearance         = genesis_get_config( 'appearance' );
    $dropdown           = get_theme_mod( 'theme_appearance_dropdown_color', $appearance['dropdown-color'] );
    $dropdown_link      = get_theme_mod( 'theme_appearance_dropdown_link_color', $appearance['dropdown-link-color'] );
    $dropdown_contrast  = nbcsn_basic_frameworks_get_contrasting_color( $dropdown, true );

    $classes[]          = 'bg-' . $dropdown;
    $classes[]          = 'dropdown-menu-' . $dropdown_contrast;
    $classes[]          = 'text-' . $dropdown_link;

    return $classes;
}

add_filter( 'genesis_structural_wrap-menu-primary', 'golfnow_aspen_nav_structural_wrap', 11 );

function golfnow_aspen_nav_structural_wrap( $output ) {

    if ( $output === "<div class=\"wrap ms-auto\">" ) {
        $output = "<div class=\"wrap ms-0 ms-lg-auto offcanvas-body\">";
    }

    return $output;
}
