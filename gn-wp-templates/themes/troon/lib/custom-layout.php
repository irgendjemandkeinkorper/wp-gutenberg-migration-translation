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

add_action( 'after_setup_theme', 'troon_dequeue_frameworks_layout_actions' );

function troon_dequeue_frameworks_layout_actions() {
    remove_action( 'genesis_entry_header', 'genesis_do_singular_image', 14 );
    remove_action( 'genesis_entry_header', 'nbcsn_basic_frameworks_custom_entry_header_markup_open', 9 );
    remove_action( 'genesis_entry_header', 'nbcsn_basic_frameworks_custom_entry_header_markup_close', 13 );

    // Removing default GN-Basic Sidebar framing
    remove_filter( 'genesis_attr_sidebar-primary', 'nbcsn_basic_frameworks_sidebar_primary' );
    remove_action( 'genesis_before_sidebar_widget_area', 'nbcsn_basic_frameworks_offcanvas_button', 7 );    
    remove_action( 'genesis_before_sidebar_widget_area', 'nbcsn_basic_frameworks_sidebar_wrap', 10 );
    remove_action( 'genesis_after_sidebar_widget_area', 'nbcsn_basic_frameworks_sidebar_wrap_end', 12 );
    remove_action( 'genesis_after_header', 'nbcsn_basic_frameworks_custom_layout_open' );
    remove_action( 'genesis_before_footer', 'nbcsn_basic_frameworks_custom_layout_close', 19 );
}

remove_action( 'genesis_entry_header', 'genesis_do_post_format_image', 4 );
remove_action( 'genesis_entry_header', 'genesis_entry_header_markup_open', 5 );
remove_action( 'genesis_entry_header', 'genesis_entry_header_markup_close', 15 );
remove_action( 'genesis_entry_header', 'genesis_do_post_title' );
remove_action( 'genesis_entry_header', 'genesis_post_info', 12 );
remove_action( 'genesis_before_loop', 'genesis_do_posts_page_heading' );

add_action( 'troon_entry_header', 'genesis_do_post_format_image', 4 );
add_action( 'troon_entry_header', 'genesis_do_post_title' );
add_action( 'troon_entry_header', 'genesis_post_info', 12 );
add_action( 'troon_entry_contents_header', 'genesis_do_posts_page_heading' );

add_action( 'troon_after_entry_contents_header', 'troon_do_singular_image', 14 );
add_action( 'troon_after_entry_header', 'troon_do_singular_image', 14 );

add_action( 'genesis_after_header', 'troon_make_singular_heading', 13 );

function troon_make_singular_heading() {
    if ( is_singular() && ! genesis_singular_image_hidden_on_current_page() ) {
        
        genesis_markup( [
            'open'      => '<div %s>',
            'context'   => 'troon-entry-header',
            'atts'      => [
                'class' => 'entry-header-custom entry-header',
            ],
        ] );

        do_action( 'troon_before_entry_header' );

        genesis_markup( [
            'open'      => '<div %s>',
            'context'   => 'troon-entry-header-wrap',
            'atts'      => [
                'class' => 'site-inner text-center',
            ],
        ] );

        do_action( 'troon_entry_header' );

        genesis_markup( [
            'close'     => '</div>',
            'context'   => 'troon-entry-header-wrap',
        ] );
        
        do_action( 'troon_after_entry_header' );

        genesis_markup( [
            'close'      => '</div>',
            'context'   => 'troon-entry-header',
        ] );
    } else {
        if ( ! genesis_singular_image_hidden_on_current_page() ) {
            add_action( 'genesis_entry_header', 'troon_make_headings', 11 );

            genesis_markup( [
                'open'      => '<div %s>',
                'context'   => 'troon-entry-header',
                'atts'      => [
                    'class' => 'entry-header-custom entry-header',
                ],
            ] );
    
            do_action( 'troon_before_entry_contents_header' );
    
            genesis_markup( [
                'open'      => '<div %s>',
                'context'   => 'troon-entry-header-wrap',
                'atts'      => [
                    'class' => 'site-inner text-center',
                ],
            ] );
    
            do_action( 'troon_entry_contents_header' );
    
            genesis_markup( [
                'close'     => '</div>',
                'context'   => 'troon-entry-header-wrap',
            ] );
            
            do_action( 'troon_after_entry_contents_header' );
    
            genesis_markup( [
                'close'      => '</div>',
                'context'   => 'troon-entry-header',
            ] );
        }
    }
}

function troon_make_headings() {
    if ( ! genesis_entry_header_hidden_on_current_page() ) {
        genesis_markup( [
            'open'      => '<div %s>',
            'context'   => 'troon-entries-headings',
            'atts'      => [
                'class' => 'card-header',
            ],
        ] );

        do_action( 'troon_entry_header' );
        
        genesis_markup( [
            'close'      => '</div>',
            'context'   => 'troon-entries-headings',
        ] );
    }
}

add_filter( 'genesis_attr_entry', 'troon_entry_card' );

function troon_entry_card( $attr ) {
    if ( ! is_single() && ! is_page() ) {
        $attr['class'] .= " card bg-white text-dark";
    }

    return $attr;
}

function troon_do_singular_image() {
    if ( genesis_singular_image_hidden_on_current_page() ) {
        return;
    }

    $img = genesis_get_singular_image();

    if ( ! empty( $img ) ) {
        genesis_markup(
            [
                'content' => $img,
                'context' => 'singular-entry-image',
            ]
        );
    }
}

add_filter( 'genesis_get_image_default_args', 'troon_header_image_fallback', 2, 2 );

function troon_header_image_fallback( $defaults, $args ) {
    if ( array_key_exists( 'attr' , $args ) && array_key_exists( 'class', $args['attr'] ) && ( $args['attr']['class'] === 'singular-image entry-image' ) ) {
        $appearance = genesis_get_config( 'appearance' );
        $defaults['fallback']       = get_theme_mod( 'troon_default_header_image' );

        if ( doing_action( 'troon_after_entry_contents_header' ) ) {
            $defaults['post_id']    = get_queried_object_id();
        }

        if ( ! is_int( $defaults['fallback'] ) ) {
            $defaults['format']     = 'url';
            $args['format']         = 'url';
            $defaults['fallback']   = [
                'html'              => wp_kses_post( '<img alt="Troon North Golf Arizona facilities during the golden hour seen from the nearby green." src="' . $appearance['default-header-image'] . '" class="' . $args['attr']['class'] . '"/>' ),
                'url'               => $appearance['default-header-image'],
            ];
        }
    }

    return $defaults;
}

add_action( 'genesis_after_header', 'troon_custom_layout_open' );

function troon_custom_layout_open() {
    $appearance     = genesis_get_config( 'appearance' );
    $body_bg        = get_theme_mod( 'theme_appearance_body_color', $appearance['body-color'] );
    $body_text      = nbcsn_basic_frameworks_get_contrasting_color( $body_bg );

    genesis_markup( [
        'open'      => '<main %s>',
        'context'   => 'slide-container',
        'atts'      => [
            'class' => 'slide-container bg-' . $body_bg . ' text-' . $body_text,
        ]
    ] );
}

add_action( 'genesis_before_footer', 'troon_custom_layout_close', 19 );

function troon_custom_layout_close() {
    genesis_markup( [
        'close'         => '</main>',
        'context'       => 'slide-container',
    ] );
}

// We're reworking the default GN-Basic Sidebar here
add_filter( 'genesis_attr_sidebar-primary', 'troon_sidebar_primary' );

function troon_sidebar_primary( $attr ) {
    $attr['class']          .= " accordion";
    $attr['tabindex']        = '-1';
    $attr['data-bs-scroll']  = 'true';

    return $attr;
}

add_action( 'genesis_before_sidebar_widget_area', 'troon_sidebar_toggle', 7 );

function troon_sidebar_toggle() {
    $sidebar_toggle = 'genesis-sidebar-primary-toggle';

    genesis_markup( [
        'open'      => '<button %s>',
        'close'     => '</button>',
        'context'   => 'sidebar-button',
        'content'   => '<span class="closed-message">Open Menu</span><span class="opened-message">Close</span>',
        'atts'      => [
            'data-bs-toggle'    => 'collapse',
            'data-bs-target'    => '#' . $sidebar_toggle,
            'type'              => 'button',
            'class'             => 'btn btn-primary accordion-button collapsed',
            'aria-controls'     => $sidebar_toggle,
            'aria-expanded'     => 'false',
        ],
    ] );
}

add_action( 'genesis_before_sidebar_widget_area', 'troon_sidebar_wrap', 10 );

function troon_sidebar_wrap() {
    $sidebar_toggle = 'genesis-sidebar-primary-toggle';

    genesis_markup( [
        'open'      => '<div %s>',
        'context'   => 'sidebar-wrap',
        'atts'      => [
            'class'             => 'sidebar-wrap accordion-collapse collapse',
            'id'                => $sidebar_toggle,
            'data-bs-toggle'    => 'genesis-sidebar-primary',
        ]
    ] );
}

add_action( 'genesis_after_sidebar_widget_area', 'troon_sidebar_wrap_end', 12 );

function troon_sidebar_wrap_end() {
    genesis_markup( [
        'close'     => '</div>',
        'context'   => 'sidebar-wrap',
    ] );
}

// Remove default sidebar functionality of always being loaded on the right side
remove_action( 'genesis_after_content', 'genesis_get_sidebar' );

// Load sidebar on the correct side if its supposed to be loaded on that side
add_action( 'genesis_before_content', 'troon_get_sidebar_before' );

function troon_get_sidebar_before() {
    $site_layout = genesis_site_layout();
    $sidebar_position = strpos( $site_layout, 'sidebar' );
    $string_length = strlen( $site_layout );

    if ( 'full-width-content' === $site_layout || $sidebar_position === false || ! ( $sidebar_position < ( $string_length / 3 ) ) ) {
        return;
    }

    get_sidebar();

}

add_action( 'genesis_after_content', 'troon_get_sidebar_after' );

function troon_get_sidebar_after() {
    $site_layout = genesis_site_layout();
    $sidebar_position = strpos( $site_layout, 'sidebar' );
    $string_length = strlen( $site_layout );

    if ( 'full-width-content' === $site_layout || $sidebar_position === false || ! ( $sidebar_position > ( $string_length / 3 ) ) ) {
        return;
    }

    get_sidebar();
}