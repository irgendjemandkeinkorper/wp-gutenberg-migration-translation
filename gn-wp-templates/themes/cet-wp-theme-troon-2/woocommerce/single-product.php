<?php
/**
 * WooCommerce single product template.
 *
 * Thin override to call get_header() / get_footer() directly rather than
 * the get_header('shop') / get_footer('shop') in WooCommerce's bundled
 * default, which silently falls back to the same partials when no
 * shop-specific header/footer exists. All product content is delegated
 * to WooCommerce hooks.
 *
 * @package cet-wp-theme-troon-2
 * @version 9.4.0
 */

defined( 'ABSPATH' ) || exit;

get_header();

if ( \Cet\Theme\Troon2\Layout\HeroRenderer::isEnabled() ) {
	// Hero section replaces breadcrumbs on single product pages.
	remove_action( 'woocommerce_before_main_content', 'woocommerce_breadcrumb', 20 );
}

/**
 * Hook: woocommerce_before_main_content.
 *
 * @hooked woocommerce_output_content_wrapper - 10
 * @hooked woocommerce_breadcrumb - 20
 * @hooked WC_Structured_Data::generate_website_data() - 30
 */
do_action( 'woocommerce_before_main_content' );

$shop_page_id = function_exists( 'wc_get_page_id' ) ? (int) wc_get_page_id( 'shop' ) : 0;
$woo_data     = new \Cet\Theme\Troon2\Layout\WooCommerce\WooData();
?>
<div class="cet-container cet-woocommerce--default cet-woocommerce--single">
	<?php \Cet\Theme\Troon2\Layout\HeroRenderer::render( $woo_data->getShopHeroData( $shop_page_id ) ); ?>
	<div class="cet-container cet-wc-container">
	<?php

	while ( have_posts() ) :
		the_post();
		wc_get_template_part( 'content', 'single-product' );
	endwhile;

	?>
	</div>
</div>
<?php

/**
 * Hook: woocommerce_after_main_content.
 *
 * @hooked woocommerce_output_content_wrapper_end - 10
 */
do_action( 'woocommerce_after_main_content' );

get_footer();
