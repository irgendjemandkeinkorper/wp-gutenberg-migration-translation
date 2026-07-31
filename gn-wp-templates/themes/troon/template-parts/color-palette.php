<?php
/**
 * GolfNow - Basic.
 *
 * This file adds a color palette template part
 *
 * @package GolfNow - Basic
 * @author  NBCU Sports Next
 * @license GPL-2.0-or-later
 * @link    https://business.golfnow.com/Website-Theme-Library/
 */

$appearance = genesis_get_config( 'appearance' );

$theme_font         = get_theme_mod( 'theme_appearance_font_selection', $appearance['default-font'] );
$theme_appearance   = 'theme-appearance-';

$css = '
.palette {
';

// Allows for the theme or plugin to add additional colors easily
foreach ( $appearance[ 'default-colors' ] as $color_name => $color_details ) {
    $color_theme = get_theme_mod( 'theme_appearance_' . $color_name . '_color', $color_details[ 'color' ] );
    if ( $color_details[ 'color' ] !== $color_theme ) {
        $css .= sprintf(
            '
            --%1$s-%2$s: %3$s;
            --%1$s-link-color: %3$s;
            --%1$s-%2$s-contrast: %4$s;
            --%1$s-%2$s-darker: %5$s;
            --%1$s-%2$s-brighter: %6$s;
            --%1$s-%2$s-rgb: %7$s;
            ',
            $theme_appearance,
            $color_name,
            $color_theme,
            $appearance[ $color_name . '-color-contrast' ],
            $appearance[ $color_name . '-color-darker' ],
            $appearance[ $color_name . '-color-brighter' ],
            trim( $appearance[ $color_name . '-color-rgb' ], 'rgb()' ),
        );
    }
}

$css .= ( $appearance[ 'promo-grid-height' ] !== $appearance[ 'default-promo-grid-height' ] ) ? sprintf(
    '
        --%1$s-box-height: %2$spx;
    ',
    $theme_appearance,
    $appearance[ 'promo-grid-height' ],
) : '';

$css .= ( $appearance[ 'default-font' ] !== $theme_font ) ? sprintf(
    '
        --%1$s-header-font: %2$s;
    ',
    $theme_appearance,
    $appearance[ 'fonts' ][ $theme_font ][ 'css' ],
) : '';

$css .= '
}
';

// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- We print html on purpose to render the page
echo sprintf( '%s', $css );