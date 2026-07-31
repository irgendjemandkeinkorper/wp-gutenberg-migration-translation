<?php
/* 
 * Adds the required CSS to the front end.
 */

add_action( 'wp_enqueue_scripts', 'tillinghast_css' );
/**
* Checks the settings for the images and background colors for each image
* If any of these value are set the appropriate CSS is output
*
* @since 1.0
*/
function tillinghast_css() {

	$handle  = defined( 'CHILD_THEME_NAME' ) && CHILD_THEME_NAME ? sanitize_title_with_dashes( CHILD_THEME_NAME ) : 'child-theme';
	
	$color = get_theme_mod( 'tillinghast_accent_color', tillinghast_customizer_get_default_accent_color() );
	
	$opts = apply_filters( 'tillinghast_images', array( '1', '3', '5' ) );

	$settings = array();

	foreach( $opts as $opt ){
		$settings[$opt]['image'] = preg_replace( '/^https?:/', '', get_option( $opt .'-image', sprintf( '%s/images/bg-%s.jpg', get_stylesheet_directory_uri(), $opt ) ) );
	}

	$css = '';

	foreach ( $settings as $section => $value ) { 

		$background = $value['image'] ? sprintf( 'background-image: url(%s);', $value['image'] ) : '';

		$css .= ( ! empty( $section ) && ! empty( $background ) ) ? sprintf( '
		.home-widgets-%s {
			%s
		}
		', $section, $background ) : '';

	}

	$css .= ( tillinghast_customizer_get_default_accent_color() !== $color ) ? sprintf( '
		a,
		.front-page-3 .featured-content .entry-title a:hover,
		.entry-title a:hover,
		.footer-widgets a:hover,
		.genesis-nav-menu a:hover,
		.genesis-nav-menu a:hover,
		.nav-primary .genesis-nav-menu .sub-menu a:hover,
		.nav-primary .genesis-nav-menu .sub-menu a:hover,
		.site-footer .wrap a:hover {
			color: %1$s;
		}

		button:hover,
		input:hover[type="button"],
		input:hover[type="reset"],
		input:hover[type="submit"],
		.archive-pagination .active a,
		.archive-pagination li a:hover,
		.button:hover,
		.footer-widgets .button,
		.footer-widgets button,
		.footer-widgets input[type="button"],
		.footer-widgets input[type="reset"],
		.footer-widgets input[type="submit"],
		.front-page-3 {
			background-color: %1$s;
		}

		button:hover,
		input:hover[type="button"],
		input:hover[type="reset"],
		input:hover[type="submit"],
		.button:hover,
		.footer-widgets .button,
		.footer-widgets button,
		.footer-widgets input[type="button"],
		.footer-widgets input[type="reset"],
		.footer-widgets input[type="submit"] {
			box-shadow: 0px 0px 0px 10px %1$s;
			color: #fff;
		}
		', $color ) : '';

	if( $css ){
		wp_add_inline_style( $handle, $css );
	}

}
