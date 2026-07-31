<?php
/**
 * GolfNow - Dogwood.
 *
 * This file adds the Customizer additions to the GolfNow - Dogwood Theme.
 *
 * @package GolfNow - Dogwood
 * @author  NBCU Sports Next
 * @license GPL-2.0-or-later
 * @link    https://business.golfnow.com/Website-Theme-Library/
 */

add_action( 'customize_register', 'golfnow_dogwood_customizer_register' );
/**
 * Registers settings and controls with the Customizer.
 *
 * @since 2.2.3
 *
 * @param WP_Customize_Manager $wp_customize Customizer object.
 */
function golfnow_dogwood_customizer_register( $wp_customize ) {

    $appearance = genesis_get_config( 'appearance' );

    $wp_customize->add_setting(
        'dogwood_default_header_image',
        [
            'default'           => $appearance['default-header-image'],
        ]
    );

    $wp_customize->add_control(
        new WP_Customize_Media_Control(
            $wp_customize,
            'dogwood_default_header_image',
            [
                'label'       => __( 'Header Image', 'gn-dogwood' ),
                'settings'    => 'dogwood_default_header_image',
                'section'     => 'colors',
            ]
        )
    );

    $wp_customize->add_setting(
        'theme_appearance_font_selection',
        [
            'default'           => $appearance['font-selection'],
            'validate_callback' => 'golfnow_dogwood_validate_font_selection',
        ]
    );

    $wp_customize->add_control(
        'theme_appearance_font_selection',
        [
            'description' => __( 'The font used for headers, navigation, and buttons', 'gn-dogwood' ),
            'label'       => __( 'Header Font', 'gn-dogwood' ),
            'type'        => 'select',
            'section'     => 'title_tagline',
            'priority'    => 11,
            'settings'    => 'theme_appearance_font_selection',
            'choices'     => golfnow_dogwood_available_fonts(),
        ]
    );

    foreach( $appearance['default-colors'] as $color_name => $color_details ) {
        $wp_customize->add_setting(
            'theme_appearance_' . $color_name . '_color',
            [
                'default'           => $color_details['color'],
                'sanitize_callback' => 'sanitize_hex_color',
            ]
        );
    
        $wp_customize->add_control(
            new WP_Customize_Color_Control(
                $wp_customize,
                'theme_appearance_' . $color_name . '_color',
                [
                    'description' => $color_details['description'],
                    'label'       => $color_details['label'],
                    'section'     => 'colors',
                    'settings'    => 'theme_appearance_' . $color_name . '_color',
                ]
            )
        );
    }

    foreach( $appearance['color_selection_keys'] as $color_selection ) {
        $selection_id   = str_replace( '-', '_', $color_selection );
        $selection_name = __( ucwords( str_replace( '-', ' ', $color_selection ) ), 'gn-dogwood' );

        $wp_customize->add_setting(
            'theme_appearance_' . $selection_id,
            [
                'default'           => $appearance[$color_selection],
                'validate_callback' => 'golfnow_dogwood_validate_color_selection',
            ]
        );
    
        $wp_customize->add_control(
            'theme_appearance_' . $selection_id,
            [
                'label'       => $selection_name,
                'type'        => 'select',
                'section'     => 'colors',
                'settings'    => 'theme_appearance_' . $selection_id,
                'choices'     => golfnow_dogwood_available_color_selections(),
            ]
        );
    }

    // Couldn't get this to work for some reason, but I'll leave it here in case it eventually does?
    $wp_customize->selective_refresh->add_partial( 
        'theme_appearance_palette', 
        [
            'selector'        => '#' . genesis_get_theme_handle() . '-inline-css',
            'settings'        => array_merge(
                array_map( 
                    function( $color ) {
                        return 'theme_appearance_' . $color . '_color';
                    }, array_keys( $appearance['default-colors'] ) 
                ),
                [ 'theme_appearance_font_selection' ],
            ),
            'render_callback' => function() {
                get_template_part( 'template-parts/color-palette' );
            },
        ]
    );
}

/**
 * Displays a message if the entered width is not numeric or greater than 100.
 *
 * @param object $validity The validity status.
 * @param int    $width The width entered by the user.
 * @return int The new width.
 */
function golfnow_dogwood_validate_logo_width( $validity, $width ) {

    if ( empty( $width ) || ! is_numeric( $width ) ) {
        $validity->add( 'required', __( 'You must supply a valid number.', 'gn-dogwood' ) );
    } elseif ( $width < 100 ) {
        $validity->add( 'logo_too_small', __( 'The logo width cannot be less than 100.', 'gn-dogwood' ) );
    }

    return $validity;

}

/**
 * Displays message that font cannot be selected if someone tries to edit the available fonts
 *
 * @param object    WP_Error $validity The validity status.
 * @param str       $selection The font selected by the user.
 * @return object   if this font is actually available or not.
 */
function golfnow_dogwood_validate_font_selection( $validity, $selection ) {

    $available_fonts = golfnow_dogwood_available_fonts();

    if ( empty( $selection ) || ! array_key_exists( $selection, $available_fonts ) ) {
        $validity->add( 'golfnow_dogwood_theme_font_mismatch', __( 'You must select from available fonts', 'gn-dogwood' ) );
    }

    return $validity;
}

/**
 * This makes it so that we can easily get the font from one location,
 * and we'd just have to enter it into the appearance config file.
 */
function golfnow_dogwood_available_fonts() {
    $appearance = genesis_get_config( 'appearance' );
    $fonts = $appearance['fonts'];
    $selector_fonts = [];

    foreach ( $appearance['fonts'] as $font_id => $font_names ) {
        $selector_fonts[ $font_id ] = $font_names['name'];
    }

    return $selector_fonts;
}

/**
 * Displays message that color cannot be selected if someone tries to edit the available colors
 *
 * @param object    WP_Error $validity The validity status.
 * @param str       $selection The color selected by the user.
 * @return object   if this color is actually available or not.
 */
function golfnow_dogwood_validate_color_selection( $validity, $selection ) {

    $available_color_selections = golfnow_dogwood_available_color_selections();

    if ( empty( $selection ) || ! array_key_exists( $selection, $available_color_selections ) ) {
        $validity->add( 'golfnow_dogwood_theme_color_selection_mismatch', __( 'You must select from available colors', 'gn-dogwood' ) );
    }

    return $validity;
}

/**
 * This makes it so that we can easily get the font from one location,
 * and we'd just have to enter it into the appearance config file.
 */
function golfnow_dogwood_available_color_selections() {
    $appearance = genesis_get_config( 'appearance' );

    $available_colors = [];

    foreach (
        array_merge( 
            array_keys( $appearance[ 'default-colors' ] ),
            array_keys( $appearance[ 'default-contrasts' ] ),
        ) as $color
    ) {
        $available_colors[$color] = ucwords( $color );
    }

    return $available_colors;
}