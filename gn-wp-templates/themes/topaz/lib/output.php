<?php
/**
 * Topaz.
 *
 * This file adds the required CSS to the front end to the Genesis Sample Theme.
 *
 * @package Topaz
 * @author  Golfnow
 * @license GPL-2.0-or-later
 * @link    https://www.golfnow.com/
 */

add_action( 'wp_enqueue_scripts', 'topaz_css' );
/**
 * Checks the settings for the link color, and accent color.
 * If any of these value are set the appropriate CSS is output.
 *
 * @since 2.2.3
 */
function topaz_css() {

	$appearance = genesis_get_config( 'appearance' );

	$color_link   = get_theme_mod( 'topaz_primary_color', $appearance['default-colors']['primary'] );
	$color_accent = get_theme_mod( 'topaz_secondary_color', $appearance['default-colors']['secondary'] );
	$logo         = wp_get_attachment_image_src( get_theme_mod( 'custom_logo' ), 'full' );

	if ( $logo ) {
		$logo_height           = absint( $logo[2] );
		$logo_max_width        = get_theme_mod( 'topaz_logo_width', 350 );
		$logo_width            = absint( $logo[1] );
		$logo_ratio            = $logo_width / max( $logo_height, 1 );
		$logo_effective_height = min( $logo_width, $logo_max_width ) / max( $logo_ratio, 1 );
		$logo_padding          = max( 0, ( 60 - $logo_effective_height ) / 2 );
	}

	$css = ':root {';

	$css .= ( $appearance['default-colors']['primary'] !== $color_link ) ? sprintf(
		'
			--primary-color: %s;
		',
		$color_link
	) : '';

	$css .= ( $appearance['default-colors']['secondary'] !== $color_accent ) ? sprintf(
		'
			--secondary-color: %2$s;
			--secondary-contrast: %1$s;
		',
		$color_accent,
		topaz_color_contrast( $color_accent )
	) : '';

	$css .= '}';

	$css .= ( has_custom_logo() && ( 200 <= $logo_effective_height ) ) ?
		'
		.site-header {
			position: static;
		}
		'
	: '';

	if ( ! is_customize_preview() ) {
		$css .= has_custom_logo() ? sprintf(
			'
		.wp-custom-logo .site-container .custom-logo-link {
			aspect-ratio: %1$s/%2$s;
		}
		',
			$logo_max_width,
			$logo_effective_height
		) : '';
	}

	$css .= ( has_custom_logo() && ( 350 !== $logo_max_width ) ) ? sprintf(
		'
		.wp-custom-logo .site-container .title-area {
			max-width: %spx;
		}
		',
		$logo_max_width
	) : '';

	// Place menu below logo and center logo once it gets big.
	$css .= ( has_custom_logo() && ( 600 <= $logo_max_width ) ) ?
		'
		.wp-custom-logo .title-area,
		.wp-custom-logo .menu-toggle,
		.wp-custom-logo .nav-primary {
			float: none;
		}

		.wp-custom-logo .title-area {
			margin: 0 auto;
			text-align: center;
		}

		@media only screen and (min-width: 960px) {
			.wp-custom-logo .nav-primary {
				text-align: center;
			}

			.wp-custom-logo .nav-primary .sub-menu {
				text-align: left;
			}
		}
		'
	: '';

	$css .= ( has_custom_logo() && $logo_padding && ( 1 < $logo_effective_height ) ) ? sprintf(
		'
		.wp-custom-logo .title-area {
			padding-top: %spx;
		}
		',
		$logo_padding + 5
	) : '';

	if ( $css ) {
		wp_add_inline_style( genesis_get_theme_handle(), $css );
	}

}
