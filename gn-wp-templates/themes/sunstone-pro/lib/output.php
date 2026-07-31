<?php
/**
 * Sunstone Pro.
 *
 * This file adds the required CSS to the front end to the Sunstone Pro Theme.
 *
 * @package Sunstone Pro
 */

add_action( 'wp_head', 'rkv_overwrite_theme_variables', PHP_INT_MAX );
add_action( 'admin_head', 'rkv_overwrite_theme_variables', PHP_INT_MAX );
/**
 * Overrides default theme.json variables with equivalent color palette from customizer.
 */
function rkv_overwrite_theme_variables() {
	get_template_part( 'template-parts/colors' );
}

add_action( 'wp_enqueue_scripts', 'sunstone_pro_css' );
/**
 * Checks the settings for the link color, and accent color.
 * If any of these value are set the appropriate CSS is output.
 *
 * @since 2.2.3
 */
function sunstone_pro_css() {
	$logo = wp_get_attachment_image_src( get_theme_mod( 'custom_logo' ), 'full' );

	if ( $logo ) {
		$logo_height           = absint( $logo[2] );
		$logo_max_width        = get_theme_mod( 'sunstone_pro_logo_width', 350 );
		$logo_width            = absint( $logo[1] );
		$logo_ratio            = $logo_width / max( $logo_height, 1 );
		$logo_effective_height = min( $logo_width, $logo_max_width ) / max( $logo_ratio, 1 );
		$logo_padding          = max( 0, ( 60 - $logo_effective_height ) / 2 );
	}

	$css = '';

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

/**
 * Wraps the header.
 */
function sunstone_pro_entry_header_markup_open() {
	if ( ! is_page() || genesis_entry_header_hidden_on_current_page() ) {
		return;
	}
	echo '<div class="entry-header-wrap alignfull">';
}
add_action( 'genesis_entry_header', 'sunstone_pro_entry_header_markup_open', 1 );

/**
 * Outputs additional elements for the page header.
 *
 * @return void
 */
function sunstone_pro_page_header() {
	if ( ! is_page() || genesis_entry_header_hidden_on_current_page() ) {
		return;
	}
	get_template_part( 'template-parts/page-header', 'cta' );
}
add_action( 'genesis_entry_header', 'sunstone_pro_page_header', 12 );

/**
 * Closes the header.
 */
function sunstone_pro_entry_header_markup_close() {
	if ( ! is_page() || genesis_entry_header_hidden_on_current_page() ) {
		return;
	}
	echo '</div>';
}
add_action( 'genesis_entry_header', 'sunstone_pro_entry_header_markup_close', 20 );

/**
 * Add local dev refresh script.
 */
function sunstone_pro_dev_footer() {
	// phpcs:disable
	if ( ! defined( 'VIP_GO_APP_ENVIRONMENT' ) || 'local' === VIP_GO_APP_ENVIRONMENT ) {
		echo '<script id="__bs_script__">//<![CDATA[
			document.write("<script async src=\'http://HOST:3000/browser-sync/browser-sync-client.js?v=2.27.10\'><\/script>".replace("HOST", location.hostname));
		//]]></script>';
	}
	// phpcs:enable
}
add_action( 'wp_footer', 'sunstone_pro_dev_footer', PHP_INT_MAX );

remove_action( 'genesis_footer', 'genesis_footer_markup_open', 5 );

/**
 * Echo the opening div tag for the footer.
 */
function sunstone_pro_footer_markup_open() {
	genesis_markup(
		[
			'open'    => '<footer %s>',
			'context' => 'site-footer',
		]
	);
}
add_action( 'genesis_before_footer', 'sunstone_pro_footer_markup_open', 9 );

/**
 * Echo the opening div tag for the footer wrap.
 */
function sunstone_pro_footer_wrap_markup_open() {
	genesis_structural_wrap( 'footer', 'open' );
}
add_action( 'genesis_footer', 'sunstone_pro_footer_wrap_markup_open', 5 );

/**
 * Outputs prefooter to bottom of all pages.
 */
function sunstone_pro_prefooter_template() {
	get_template_part( 'page-templates/prefooter' );
}
add_action( 'genesis_before_footer', 'sunstone_pro_prefooter_template', 5 );

/**
 * Outputs prefooter to bottom of all pages.
 */
function sunstone_pro_app_store_icons() {
	get_template_part( 'template-parts/apps-links' );
}
add_action( 'genesis_before_footer', 'sunstone_pro_app_store_icons', 10 );

/**
 * Outputs social menu in footer.
 */
function sunstone_pro_footer_social_menu() {
	if ( has_nav_menu( 'footer-social-menu' ) ) {
		echo '<nav aria-label="' . esc_attr__( 'Social Links', 'rkv' ) . '" class="rkv-app-layout__footer__secondary__right__social-menu">';
			wp_nav_menu(
				array(
					'theme_location' => 'footer-social-menu',
					'container'      => false,
					'menu_class'     => 'social-nav',
					'depth'          => 1,
				)
			);
		echo '</nav>';
	}
}
add_action( 'genesis_footer', 'sunstone_pro_footer_social_menu', 11 );

/**
 * Outputs social menu in header.
 */
function sunstone_pro_header_social_menu() {
	return get_template_part( 'template-parts/social-menu' );
}
add_action( 'genesis_before_header', 'sunstone_pro_header_social_menu', 11 );

/**
 * Remove Genesis breadcrumb wrapper (<div class="breadcrumb">).
 */
remove_action( 'genesis_before_loop', 'genesis_do_breadcrumbs' );

/**
 * Output Yoast breadcrumbs in semantic breadcrumb landmark.
 */
function sunstone_pro_yoast_breadcrumbs() {
	if ( is_front_page() || ! function_exists( 'yoast_breadcrumb' ) ) {
		return;
	}

	yoast_breadcrumb(
		'<nav class="breadcrumb" aria-label="Breadcrumb"><ol class="breadcrumb__list">',
		'</ol></nav>'
	);
}
add_action( 'genesis_before_loop', 'sunstone_pro_yoast_breadcrumbs' );

/**
 * Changes the breadcrumb output wrapper element.
 *
 * @param string $wrapper Wrapper tag.
 * @return string
 */
function sunstone_pro_breadcrumb_single_link_wrapper( string $wrapper ): string {
	return 'li';
}
add_filter( 'wpseo_breadcrumb_single_link_wrapper', 'sunstone_pro_breadcrumb_single_link_wrapper' );

/**
 * Remove visual separator from HTML.
 * Separator should be added via CSS.
 *
 * @param string $separator Breadcrumb separator.
 * @return string
 */
function sunstone_pro_breadcrumb_separator( string $separator ): string {
	return '';
}
add_filter( 'wpseo_breadcrumb_separator', 'sunstone_pro_breadcrumb_separator' );

/**
 * Use wrapper passed via yoast_breadcrumb().
 *
 * @param string $wrapper Wrapper tag.
 * @return string
 */
function sunstone_pro_breadcrumb_output_wrapper( string $wrapper ): string {
	return 'span';
}
add_filter( 'wpseo_breadcrumb_output_wrapper', 'sunstone_pro_breadcrumb_output_wrapper' );

/**
 * Remove outer Yoast wrapper from final output.
 *
 * @param string $output Breadcrumb HTML output.
 * @return string
 */
function sunstone_pro_breadcrumb_output( string $output ): string {
	if ( '' === trim( $output ) ) {
		return $output;
	}

	$output = preg_replace( '/^<span[^>]*>/', '', $output );
	$output = preg_replace( '/<\/span>$/', '', $output );

	return $output;
}
add_filter( 'wpseo_breadcrumb_output', 'sunstone_pro_breadcrumb_output' );

/**
 * Show the search form label on 404 page.
 *
 * @param  array $atts
 * @return array
 */
function sunstone_pro_attributes_search_form_label( array $atts ): array {
	if ( is_404() && did_action( 'genesis_before_content' ) && ! did_action( 'genesis_after_content' ) ) {
		$atts['class'] = 'search-form-label floating-label';
	}
	return $atts;
}
add_filter( 'genesis_attr_search-form-label', 'sunstone_pro_attributes_search_form_label', 11 );