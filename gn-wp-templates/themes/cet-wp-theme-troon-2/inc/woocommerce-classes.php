<?php
/**
 * WooCommerce class hooks.
 *
 * Attaches Troon classes to WooCommerce elements via hooks/filters.
 * Only applies to default WooCommerce pages (not the custom Shop page).
 *
 * @package cet-wp-theme-troon-2
 */

/**
 * Add cet-wc-product-card class to product loop items.
 *
 * @param array       $classes Product classes.
 * @param \WC_Product $product Product object.
 * @return array
 */
function cet_troon_2_woocommerce_post_class( array $classes, $product ): array {
	if ( $product instanceof \WC_Product ) {
		$classes[] = 'cet-wc-product-card';
	}

	return $classes;
}
add_filter( 'woocommerce_post_class', 'cet_troon_2_woocommerce_post_class', 10, 2 );

/**
 * Add cet-wc-product-grid class to the product loop wrapper.
 *
 * @param string $html Opening tag HTML.
 * @return string
 */
function cet_troon_2_woocommerce_product_loop_start( string $html ): string {
	if ( is_shop() ) {
		return $html;
	}

	if ( false !== strpos( $html, 'cet-wc-product-grid' ) ) {
		return $html;
	}

	return str_replace(
		'class="products',
		'class="products cet-wc-product-grid',
		$html
	);
}
add_filter( 'woocommerce_product_loop_start', 'cet_troon_2_woocommerce_product_loop_start', 10 );

/**
 * Add Troon button class to archive add-to-cart links.
 *
 * Reuses the same button styling as the custom Shop page cards.
 *
 * @param string      $link    Add to cart link HTML.
 * @param \WC_Product $product Product object.
 * @return string
 */
function cet_troon_2_woocommerce_loop_add_to_cart_link( string $link, $product ): string {
	if ( is_shop() ) {
		return $link;
	}

	if ( false !== strpos( $link, 'cet-wc-product-card__button' ) ) {
		return $link;
	}

	return str_replace(
		'class="button',
		'class="button cet-wc-product-card__button',
		$link
	);
}
add_filter( 'woocommerce_loop_add_to_cart_link', 'cet_troon_2_woocommerce_loop_add_to_cart_link', 20, 2 );

/**
 * Add Troon body classes for WooCommerce pages.
 *
 * @param array $classes Body classes.
 * @return array
 */
function cet_troon_2_woocommerce_body_class( array $classes ): array {
	if ( ! function_exists( 'is_woocommerce' ) || ! is_woocommerce() ) {
		return $classes;
	}

	$classes[] = 'cet-woocommerce-page';

	if ( is_product_category() || is_product_tag() || is_tax( 'product_brand' ) ) {
		$classes[] = 'cet-woocommerce-archive';
	}

	if ( is_product() ) {
		$classes[] = 'cet-woocommerce-single';
	}

	return $classes;
}
add_filter( 'body_class', 'cet_troon_2_woocommerce_body_class' );