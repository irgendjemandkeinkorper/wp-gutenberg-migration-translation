<?php
/**
 * WooCommerce product archive template.
 *
 * Renders the custom Shop page layout only when is_shop() is true.
 * For product category, tag, and other taxonomy archives, falls back
 * to the standard WooCommerce archive loop.
 *
 * @package cet-wp-theme-troon-2
 * @version 9.4.0
 */

defined( 'ABSPATH' ) || exit;

get_header();

// Product archives should render breadcrumbs after the hero, not above it.
remove_action( 'woocommerce_before_main_content', 'woocommerce_breadcrumb', 20 );

/**
 * Hook: woocommerce_before_main_content.
 *
 * @hooked woocommerce_output_content_wrapper - 10 (outputs opening divs for the content)
 * @hooked WC_Structured_Data::generate_website_data() - 30
 */
do_action( 'woocommerce_before_main_content' );

$shop_page_id = function_exists( 'wc_get_page_id' ) ? (int) wc_get_page_id( 'shop' ) : 0;
$woo_data     = new \Cet\Theme\Troon2\Layout\WooCommerce\WooData();

if ( is_shop() ) :
	// Custom Shop page layout.
	?>
	<div class="cet-woocommerce">
		<?php
		\Cet\Theme\Troon2\Layout\HeroRenderer::render( $woo_data->getShopHeroData( $shop_page_id ) );
		get_template_part( 'template-parts/shop/categories-carousel', null, [ 'categories' => $woo_data->getShopCategories() ] );
		get_template_part( 'template-parts/shop/featured-products', null, [ 'products' => $woo_data->getFeaturedProducts() ] );
		get_template_part( 'template-parts/shop/dynamic-content', null, [ 'page_id' => $shop_page_id ] );
		get_template_part( 'template-parts/shop/featured-brands', null, [ 'brands' => $woo_data->getFeaturedBrands() ] );
		?>
	</div>
	<?php
else :
	// Standard WooCommerce archive (product categories, tags, etc.).
	?>
	<div class="cet-woocommerce cet-woocommerce--default">
		<?php \Cet\Theme\Troon2\Layout\HeroRenderer::render( $woo_data->getShopHeroData( $shop_page_id ) ); ?>
		<div class="cet-container cet-wc-container">
            <?php woocommerce_breadcrumb(); ?>
            <header class="woocommerce-products-header">
                <?php if ( ! \Cet\Theme\Troon2\Layout\HeroRenderer::isEnabled() && apply_filters( 'woocommerce_show_page_title', true ) ) : ?>
                    <h1 class="woocommerce-products-header__title page-title"><?php woocommerce_page_title(); ?></h1>
                <?php endif; ?>

                <?php
                /**
                 * Hook: woocommerce_archive_description.
                 *
                 * @hooked woocommerce_taxonomy_archive_description - 10
                 * @hooked woocommerce_product_archive_description - 10
                 */
                do_action( 'woocommerce_archive_description' );
                ?>
            </header>
            <?php

            if ( woocommerce_product_loop() ) {
                /**
                 * Hook: woocommerce_before_shop_loop.
                 *
                 * @hooked woocommerce_output_all_notices - 10
                 * @hooked woocommerce_result_count - 20
                 * @hooked woocommerce_catalog_ordering - 30
                 */
                do_action( 'woocommerce_before_shop_loop' );

                woocommerce_product_loop_start();

                if ( wc_get_loop_prop( 'total' ) ) {
                    while ( have_posts() ) {
                        the_post();

                        /**
                         * Hook: woocommerce_shop_loop.
                         */
                        do_action( 'woocommerce_shop_loop' );

                        wc_get_template_part( 'content', 'product' );
                    }
                }

                woocommerce_product_loop_end();

                /**
                 * Hook: woocommerce_after_shop_loop.
                 *
                 * @hooked woocommerce_pagination - 10
                 */
                do_action( 'woocommerce_after_shop_loop' );
            } else {
                /**
                 * Hook: woocommerce_no_products_found.
                 *
                 * @hooked wc_no_products_found - 10
                 */
                do_action( 'woocommerce_no_products_found' );
            }
            ?>
		</div>
	</div>
	<?php

endif;

/**
 * Hook: woocommerce_after_main_content.
 *
 * @hooked woocommerce_output_content_wrapper_end - 10 (outputs closing divs for the content)
 */
do_action( 'woocommerce_after_main_content' );

get_footer();
