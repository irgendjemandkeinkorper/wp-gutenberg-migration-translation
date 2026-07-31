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

add_action( 'after_setup_theme', 'mulberry_dequeue_frameworks_layout_actions' );

function mulberry_dequeue_frameworks_layout_actions() {
    remove_action( 'genesis_entry_header', 'genesis_do_singular_image', 14 );
    remove_action( 'genesis_entry_header', 'nbcsn_basic_frameworks_custom_entry_header_markup_open', 9 );
    remove_action( 'genesis_entry_header', 'nbcsn_basic_frameworks_custom_entry_header_markup_close', 13 );
}

remove_action( 'genesis_entry_header', 'genesis_do_post_format_image', 4 );
remove_action( 'genesis_entry_header', 'genesis_entry_header_markup_open', 5 );
remove_action( 'genesis_entry_header', 'genesis_entry_header_markup_close', 15 );
remove_action( 'genesis_entry_header', 'genesis_do_post_title' );
remove_action( 'genesis_entry_header', 'genesis_post_info', 12 );
remove_action( 'genesis_before_loop', 'genesis_do_posts_page_heading' );

add_action( 'mulberry_entry_header', 'genesis_do_post_format_image', 4 );
add_action( 'mulberry_entry_header', 'genesis_do_post_title' );
add_action( 'mulberry_entry_header', 'genesis_post_info', 12 );
add_action( 'mulberry_entry_contents_header', 'genesis_do_posts_page_heading' );

add_action( 'mulberry_after_entry_contents_header', 'mulberry_do_singular_image', 14 );
add_action( 'mulberry_after_entry_header', 'mulberry_do_singular_image', 14 );

add_action( 'genesis_after_header', 'mulberry_make_entry_heading', 13 );

function mulberry_make_entry_heading() {
    if ( is_singular() && ! genesis_singular_image_hidden_on_current_page() ) {
        
        genesis_markup( [
            'open'      => '<div %s>',
            'context'   => 'mulberry-entry-header',
            'atts'      => [
                'class' => 'entry-header-custom entry-header alignfull',
            ],
        ] );

        do_action( 'mulberry_before_entry_header' );

        genesis_markup( [
            'open'      => '<div %s>',
            'context'   => 'mulberry-entry-header-wrap',
            'atts'      => [
                'class' => 'site-inner text-center',
            ],
        ] );

        do_action( 'mulberry_entry_header' );

        genesis_markup( [
            'close'     => '</div>',
            'context'   => 'mulberry-entry-header-wrap',
        ] );
        
        do_action( 'mulberry_after_entry_header' );

        genesis_markup( [
            'close'      => '</div>',
            'context'   => 'mulberry-entry-header',
        ] );
    } else {
        add_action( 'genesis_entry_header', 'mulberry_make_headings', 11 );
        if ( ! genesis_singular_image_hidden_on_current_page() ) {
            genesis_markup( [
                'open'      => '<div %s>',
                'context'   => 'mulberry-entry-header',
                'atts'      => [
                    'class' => 'entry-header-custom entry-header',
                ],
            ] );

            do_action( 'mulberry_before_entry_contents_header' );

            genesis_markup( [
                'open'      => '<div %s>',
                'context'   => 'mulberry-entry-header-wrap',
                'atts'      => [
                    'class' => 'site-inner text-center',
                ],
            ] );
    
            do_action( 'mulberry_entry_contents_header' );
    
            genesis_markup( [
                'close'     => '</div>',
                'context'   => 'mulberry-entry-header-wrap',
            ] );
            
            do_action( 'mulberry_after_entry_contents_header' );
    
            genesis_markup( [
                'close'      => '</div>',
                'context'   => 'mulberry-entry-header',
            ] );
        } else {
            do_action( 'golfnow_aspen_before_entry_contents_header' );

            genesis_markup( [
                'open'      => '<div %s>',
                'context'   => 'aspen-entry-header-wrap',
                'atts'      => [
                    'class' => 'site-inner text-center',
                ],
            ] );

            do_action( 'golfnow_aspen_entry_contents_header' );

            genesis_markup( [
                'close'     => '</div>',
                'context'   => 'aspen-entry-header-wrap',
            ] );

            do_action( 'golfnow_aspen_after_entry_contents_header' );
        }
    }
}

function mulberry_make_headings() {
    if ( ! genesis_entry_header_hidden_on_current_page() ) {
        genesis_markup( [
            'open'      => '<div %s>',
            'context'   => 'mulberry-entries-headings',
            'atts'      => [
                'class' => is_singular() ? 'entry-header' : 'card-header',
            ],
        ] );

        do_action( 'mulberry_entry_header' );
        
        genesis_markup( [
            'close'      => '</div>',
            'context'   => 'mulberry-entries-headings',
        ] );
    }
}

add_filter( 'genesis_attr_entry', 'mulberry_entry_card' );

function mulberry_entry_card( $attr ) {
    if ( ! is_single() && ! is_page() ) {
        $attr['class'] .= " card bg-light text-dark";
    }

    return $attr;
}
 
function mulberry_do_singular_image() {
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
 
add_filter( 'genesis_get_image_default_args', 'mulberry_header_image_fallback', 2, 2 );

function mulberry_header_image_fallback( $defaults, $args ) {
    if ( array_key_exists( 'attr' , $args ) && array_key_exists( 'class', $args['attr'] ) && ( $args['attr']['class'] === 'singular-image entry-image' ) ) {
        $appearance = genesis_get_config( 'appearance' );
        $defaults['fallback']       = get_theme_mod( 'mulberry_default_header_image' );

        if ( doing_action( 'mulberry_after_entry_contents_header' ) ) {
            $defaults['post_id']    = get_queried_object_id();
        }

        if ( ! is_int( $defaults['fallback'] ) ) {
            $defaults['format']     = 'url';
            $args['format']         = 'url';
            $defaults['fallback']   = [
                'html'  => wp_kses_post( '<img alt="Image of golf greens." src="' . $appearance['default-header-image'] . '" class="' . $args['attr']['class'] . '"/>' ),
                'url'   => $appearance['default-header-image'],
            ];
        }
    }

    return $defaults;
}