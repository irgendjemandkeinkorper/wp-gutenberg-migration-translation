<?php
/**
 * Diamond.
 *
 * This file adds the required CSS to the front end to the Diamond Theme.
 *
 * @package Diamond
 * @author  NBCU Sports Next
 * @license GPL-2.0-or-later
 * @link    hhttps://business.golfnow.com/Website-Theme-Library/
 */

add_action( 'wp_enqueue_scripts', 'genesis_sample_css' );
/**
 * Checks the settings for the link color, and accent color.
 * If any of these value are set the appropriate CSS is output.
 *
 * @since 2.2.3
 */
function genesis_sample_css() {

	$appearance = genesis_get_config( 'appearance' );

	$color_primary   = get_theme_mod( 'diamond_primary_color', $appearance['default-colors']['primary'] );

	$css = '
		.palette {
		';

	$css .= ( $appearance['default-colors']['primary'] !== $color_primary ) ? sprintf(
		'
			--theme-primary: %s;
		}

		',
		$color_primary
	) : '';

	$css .= '
		}
	';

	if ( $css ) {
		wp_add_inline_style( genesis_get_theme_handle(), $css );
	}

}
