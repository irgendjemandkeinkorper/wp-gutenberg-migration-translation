<?php
/**
 * The Template for displaying product archives, including the main shop page which is a post type archive
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/archive-product.php.
 *
 * HOWEVER, on occasion WooCommerce will need to update template files and you
 * (the theme developer) will need to copy the new files to your theme to
 * maintain compatibility. We try to do this as little as possible, but it does
 * happen. When this occurs the version of the template file will be bumped and
 * the readme will list any important changes.
 *
 * @see https://docs.woocommerce.com/document/template-structure/
 * @package WooCommerce\Templates
 * @version 3.4.0
 */

defined( 'ABSPATH' ) || exit;

get_header( 'shop' );

// remove_action( 'woocommerce_before_main_content', 'woocommerce_output_content_wrapper', 10 );

/**
 * Hook: woocommerce_before_main_content.
 *
 * @hooked woocommerce_output_content_wrapper - 10 (outputs opening divs for the content)
 * @hooked woocommerce_breadcrumb - 20
 * @hooked WC_Structured_Data::generate_website_data() - 30
 */

// moving breadcrumbs
remove_action( 'woocommerce_before_main_content', 'woocommerce_breadcrumb', 20 );
add_action( 'troon_woocommerce_before_main_content', 'woocommerce_breadcrumb', 20 );

do_action( 'woocommerce_before_main_content' );
?>
<header class="woocommerce-products-header">
	<?php if ( apply_filters( 'woocommerce_show_page_title', true ) ) : 
    $appearance = genesis_get_config( 'appearance' );
    genesis_markup( [
        'open'      => '<div %s>',
        'context'   => 'troon-entry-header',
        'atts'      => [
            'class' => 'entry-header-custom entry-header alignfull',
        ],
    ] );

    do_action( 'troon_before_entry_header' );

    genesis_markup( [
        'open'      => '<div %s>',
        'context'   => 'troon-entry-header-wrap',
        'atts'      => [
            'class' => 'site-inner text-center',
        ],
    ] );

    genesis_markup( [
        'open'      => '<h1 %s>',
        'close'     => '</h1>',
        'context'   => 'troon-woocommerce-title',
        'content'   => woocommerce_page_title( false ),
        'atts'      => [
            'class' => 'entry-title woocommerce-products-header__title page-title',
        ],
    ] );

    genesis_markup( [
        'close'     => '</div>',
        'context'   => 'troon-entry-header-wrap',
    ] );

    do_action( 'troon_woocommerce_page_image' );

    ?><img alt="Image of golf ball on tee on grass." src="<?php echo $appearance['default-header-image']; ?>" class="singular-image entry-image"><?php

    genesis_markup( [
        'close'      => '</div>',
        'context'   => 'troon-entry-header',
    ] );
		

		?>
	<?php endif; ?>

    <?php
    /**
	 * Hook: troon_woocommerce_before_main_content.
	 *
	 * @hooked woocommerce_breadcrumb - 20
	 */
    do_action( 'troon_woocommerce_before_main_content' );
    ?>

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

/**
 * Hook: woocommerce_after_main_content.
 *
 * @hooked woocommerce_output_content_wrapper_end - 10 (outputs closing divs for the content)
 */
do_action( 'woocommerce_after_main_content' );

get_footer( 'shop' );