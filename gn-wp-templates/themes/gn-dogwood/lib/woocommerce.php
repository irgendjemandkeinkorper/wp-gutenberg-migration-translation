<?php
/**
 * Disable default WooCommerce coupon field on Cart.
 */
add_filter( 'woocommerce_coupons_enabled', 'golfnow_dogwood_disable_cart_coupons' );

function golfnow_dogwood_disable_cart_coupons( $enabled ) {
	if ( is_cart() ) {
		return false;
	}

	return $enabled;
}