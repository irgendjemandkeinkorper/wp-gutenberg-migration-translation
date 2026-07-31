<?php
/**
 * Our Store — Featured Products grid.
 *
 * Receives prepared product data from WooData::getFeaturedProducts().
 * Displays a 4-column responsive grid with product image, title, price, and Add to Cart.
 *
 * @package cet-wp-theme-troon-2
 *
 * @var array $args {
 *     @type \WC_Product[] $products Featured products.
 * }
 */

defined( 'ABSPATH' ) || exit;

$products = $args['products'] ?? [];

if ( empty( $products ) ) {
	return;
}
?>
<section class="cet-wc-products">
	<div class="cet-container cet-wc-container">
		<div class="cet-wc-section-header cet-wc-section-header--with-link">
			<span class="cet-wc-caption"><?php esc_html_e( 'Our Store', 'cet-wp-theme-troon-2' ); ?></span>

			<div class="cet-wc-section-header__row-group">
				<h2 class="cet-wc-heading"><?php esc_html_e( 'Shipped From The Club', 'cet-wp-theme-troon-2' ); ?></h2>

				<a href="<?php echo esc_url( get_permalink( wc_get_page_id( 'shop' ) ) ); ?>" class="cet-wc-link-arrow">
					<?php esc_html_e( 'Explore All', 'cet-wp-theme-troon-2' ); ?>
				</a>
			</div>
		</div>

		<div class="cet-wc-products__grid">
			<?php foreach ( $products as $product ) : ?>
				<?php
				$product_id    = $product->get_id();
				$product_link  = $product->get_permalink();
				$product_image = $product->get_image(
					'woocommerce_thumbnail',
					[
						'class'   => 'cet-wc-product-card__image',
						'loading' => 'lazy',
					]
				);
				$product_title  = $product->get_name();
				$regular_price  = $product->get_regular_price();
				$sale_price     = $product->get_sale_price();
				$current_price  = $product->get_price();
				?>

				<article class="cet-wc-product-card">
					<a href="<?php echo esc_url( $product_link ); ?>" class="cet-wc-product-card__media">
						<?php echo wp_kses_post( $product_image ); ?>
					</a>

					<div class="cet-wc-product-card__body">
						<div class="cet-wc-product-card__info">
							<a href="<?php echo esc_url( $product_link ); ?>">
								<h3 class="cet-wc-product-card__title">
									<?php echo esc_html( $product_title ); ?>
								</h3>
							</a>

							<span class="cet-wc-product-card__price">
								<?php if ( $product->is_on_sale() && '' !== $regular_price && '' !== $sale_price ) : ?>
									<del><?php echo wp_kses_post( wc_price( $regular_price ) ); ?></del>
									<ins><?php echo wp_kses_post( wc_price( $sale_price ) ); ?></ins>
								<?php elseif ( '' !== $current_price ) : ?>
									<?php echo wp_kses_post( wc_price( $current_price ) ); ?>
								<?php endif; ?>
							</span>
						</div>

						<?php
						$button_classes = [
							'button',
							'product_type_' . $product->get_type(),
							'add_to_cart_button',
							'cet-wc-product-card__button',
						];

						if ( $product->supports( 'ajax_add_to_cart' ) && $product->is_purchasable() && $product->is_in_stock() ) {
							$button_classes[] = 'ajax_add_to_cart';
						}

						$add_to_cart_link = apply_filters(
							'woocommerce_loop_add_to_cart_link',
							sprintf(
								'<a href="%s" data-quantity="1" class="%s" data-product_id="%s" data-product_sku="%s" aria-label="%s" rel="nofollow">%s</a>',
								esc_url( $product->add_to_cart_url() ),
								esc_attr( implode( ' ', $button_classes ) ),
								esc_attr( $product_id ),
								esc_attr( $product->get_sku() ),
								esc_attr(
									sprintf(
										/* translators: %s: product name */
										__( 'Add "%s" to your cart', 'cet-wp-theme-troon-2' ),
										$product_title
									)
								),
								esc_html( $product->add_to_cart_text() )
							),
							$product
						);
						echo wp_kses_post( $add_to_cart_link );
						?>
					</div>
				</article>
			<?php endforeach; ?>
		</div>
	</div>
</section>
