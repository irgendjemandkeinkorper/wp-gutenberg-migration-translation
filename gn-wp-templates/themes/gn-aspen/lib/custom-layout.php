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


add_action( 'after_setup_theme', 'golfnow_aspen_dequeue_frameworks_layout_actions' );

function golfnow_aspen_dequeue_frameworks_layout_actions() {
    remove_action( 'genesis_entry_header', 'genesis_do_singular_image', 14 );
    remove_action( 'genesis_entry_header', 'nbcsn_basic_frameworks_custom_entry_header_markup_open', 9 );
    remove_action( 'genesis_entry_header', 'nbcsn_basic_frameworks_custom_entry_header_markup_close', 13 );
    remove_filter( 'genesis_attr_entry', 'nbcsn_basic_frameworks_entry_card' );
}

remove_action( 'genesis_entry_header', 'genesis_do_post_format_image', 4 );
remove_action( 'genesis_entry_header', 'genesis_entry_header_markup_open', 5 );
remove_action( 'genesis_entry_header', 'genesis_entry_header_markup_close', 15 );
remove_action( 'genesis_entry_header', 'genesis_do_post_title' );
remove_action( 'genesis_entry_header', 'genesis_post_info', 12 );
remove_action( 'genesis_before_loop', 'genesis_do_posts_page_heading' );

add_action( 'golfnow_aspen_entry_header', 'genesis_do_post_format_image', 4 );
add_action( 'golfnow_aspen_entry_header', 'genesis_do_post_title' );
add_action( 'golfnow_aspen_entry_header', 'genesis_post_info', 12 );
add_action( 'golfnow_aspen_entry_contents_header', 'genesis_do_posts_page_heading' );

add_action( 'golfnow_aspen_after_entry_contents_header', 'golfnow_aspen_do_singular_image', 14 );
add_action( 'golfnow_aspen_after_entry_header', 'golfnow_aspen_do_singular_image', 14 );

add_action( 'genesis_after_header', 'golfnow_aspen_make_entry_heading', 13 );
add_action( 'genesis_after', 'golfnow_aspen_page_loader' );

function golfnow_aspen_page_loader() {
    genesis_markup( [
        'open'      => '<div %s>',
        'close'     => '</div>',
        'context'   => 'preloader',
        'content'   => '<div class="aspen--loading"><span class="aspen--loading-percent"><span>0</span> %</span><div class="aspen--loading-bar"></div></div>'
    ] );
}

function golfnow_aspen_make_entry_heading() {
    if ( is_singular() && ! genesis_singular_image_hidden_on_current_page() ) {
        genesis_markup( [
            'open'      => '<div %s>',
            'context'   => 'aspen-entry-header',
            'atts'      => [
                'class' => 'entry-header-custom entry-header alignfull',
            ],
        ] );

        do_action( 'golfnow_aspen_before_entry_header' );

        genesis_markup( [
            'open'      => '<div %s>',
            'context'   => 'aspen-entry-header-wrap',
            'atts'      => [
                'class' => 'site-inner text-center',
            ],
        ] );

        do_action( 'golfnow_aspen_entry_header' );

        genesis_markup( [
            'close'     => '</div>',
            'context'   => 'aspen-entry-header-wrap',
        ] );
        
        do_action( 'golfnow_aspen_after_entry_header' );

        genesis_markup( [
            'close'      => '</div>',
            'context'   => 'aspen-entry-header',
        ] );
    } else {
        add_action( 'genesis_entry_header', 'golfnow_aspen_make_headings', 11 );
        if ( ! genesis_singular_image_hidden_on_current_page() ) {
            genesis_markup( [
                'open'      => '<div %s>',
                'context'   => 'aspen-entry-header',
                'atts'      => [
                    'class' => 'entry-header-custom entry-header',
                ],
            ] );

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

            genesis_markup( [
                'close'      => '</div>',
                'context'   => 'aspen-entry-header',
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

function golfnow_aspen_make_headings() {
    if ( ! genesis_entry_header_hidden_on_current_page() ) {
        genesis_markup( [
            'open'      => '<div %s>',
            'context'   => 'aspen-entries-headings',
            'atts'      => [
                'class' => is_singular() ? 'entry-header' : 'card-header',
            ],
        ] );

        do_action( 'golfnow_aspen_entry_header' );
        
        genesis_markup( [
            'close'      => '</div>',
            'context'   => 'aspen-entries-headings',
        ] );
    }
}

add_filter( 'genesis_attr_entry', 'golfnow_aspen_entry_card' );

function golfnow_aspen_entry_card( $attr ) {
    if ( ! is_single() && ! is_page() ) {
        $appearance     = genesis_get_config( 'appearance' );
        $card           = get_theme_mod( 'theme_appearance_entry_card', $appearance['entry-card-color'] );
        $card_contrast  = nbcsn_basic_frameworks_get_contrasting_color( $card );

        $attr['class'] .= " card bg-{$card} text-{$card_contrast}";
    }

    return $attr;
}

function golfnow_aspen_do_singular_image() {
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

add_filter( 'genesis_get_image_default_args', 'golfnow_aspen_header_image_fallback', 2, 2 );

function golfnow_aspen_header_image_fallback( $defaults, $args ) {
    if ( array_key_exists( 'attr' , $args ) && array_key_exists( 'class', $args['attr'] ) && ( $args['attr']['class'] === 'singular-image entry-image' ) ) {
        $appearance = genesis_get_config( 'appearance' );
        $defaults['fallback'] = get_theme_mod( 'golfnow_aspen_default_header_image' );

        if ( doing_action( 'golfnow_aspen_after_entry_contents_header' ) ) {
        $defaults['post_id'] = get_queried_object_id();
    }

        if ( ! is_int( $defaults['fallback'] ) )  {
            $defaults['format']   = 'url';
            $args['format']   = 'url';
            $defaults['fallback'] = [
                'html'  => wp_kses_post( '<img alt="Image of golf greens." src="' . $appearance['default-header-image'] . '" class="' . $args['attr']['class'] . '"/>' ),
                'url'   => $appearance['default-header-image'],
            ];
        }
    }

    return $defaults;
}