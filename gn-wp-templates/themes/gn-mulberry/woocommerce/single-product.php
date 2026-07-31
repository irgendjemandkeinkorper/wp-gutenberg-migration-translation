<?php
/**
 * The Template for displaying all single products
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/single-product.php.
 *
 * HOWEVER, on occasion WooCommerce will need to update template files and you
 * (the theme developer) will need to copy the new files to your theme to
 * maintain compatibility. We try to do this as little as possible, but it does
 * happen. When this occurs the version of the template file will be bumped and
 * the readme will list any important changes.
 *
 * @see         https://docs.woocommerce.com/document/template-structure/
 * @package     WooCommerce\Templates
 * @version     1.6.4
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}

get_header( 'shop' ); ?>
	
	<header class="woocommerce-products-header">
        <?php if ( apply_filters( 'woocommerce_show_page_title', true ) ) : 

			function printHeaderImage() {
				$appearance = genesis_get_config( 'appearance' );
				$getUpdatedImage = get_theme_mod( 'mulberry_default_header_image' );

				if ( !empty( $getUpdatedImage ) ) { 
					$getHeaderImage = wp_get_attachment_image_url( get_theme_mod( 'mulberry_default_header_image' ), 'full' );  
				} else {
					$getHeaderImage = $appearance['default-header-image']; 
				}

				return $getHeaderImage;
			}

			$headerImage = printHeaderImage();

			?> 

			<div class="entry-header-custom entry-header alignfull">
				<div class="site-inner text-center">
					<h1 class="entry-title woocommerce-products-header__title page-title"><?php woocommerce_page_title(); ?></h1>
				</div>
				<img alt="Image of golf ball on tee on grass." src="<?php echo $headerImage; ?>" class="singular-image entry-image">
			</div>
        <?php endif; ?>

        <?php
        /**
         * Hook: woocommerce_archive_description.
         *
         * @hooked woocommerce_taxonomy_archive_description - 10
         * @hooked woocommerce_product_archive_description - 10
         */
        do_action( 'woocommerce_before_main_content' );
        do_action( 'woocommerce_archive_description' );
        ?>
    </header>


		<?php while ( have_posts() ) : ?>
			<?php the_post(); ?>

			<?php wc_get_template_part( 'content', 'single-product' ); ?>

		<?php endwhile; // end of the loop. ?>

	<?php
		/**
		 * woocommerce_after_main_content hook.
		 *
		 * @hooked woocommerce_output_content_wrapper_end - 10 (outputs closing divs for the content)
		 */
		do_action( 'woocommerce_after_main_content' );
	?>

	<?php
		/**
		 * woocommerce_sidebar hook.
		 *
		 * @hooked woocommerce_get_sidebar - 10
		 */
		//do_action( 'woocommerce_sidebar' );
	?>

<?php
get_footer( 'shop' );

/* Omit closing PHP tag at the end of PHP files to avoid "headers already sent" issues. */