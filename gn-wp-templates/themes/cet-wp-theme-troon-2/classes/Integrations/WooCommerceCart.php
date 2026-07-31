<?php

namespace Cet\Theme\Troon2\Integrations;

/**
 * WooCommerce cart integration.
 *
 * Keeps the header cart count badge in sync after AJAX add-to-cart actions.
 */
class WooCommerceCart {

	public function __construct() {
		$this->register_hooks();
	}

	private function register_hooks(): void {
		add_filter( 'woocommerce_add_to_cart_fragments', [ $this, 'filter_cart_fragments' ] );
	}

	/**
	 * Return an updated .cart-count fragment so WooCommerce replaces it on the page after AJAX add-to-cart.
	 *
	 * @param array $fragments Associative array of CSS selector => HTML string.
	 * @return array
	 */
	public function filter_cart_fragments( array $fragments ): array {
		if ( ! function_exists( 'WC' ) || ! WC()->cart ) {
			return $fragments;
		}

		$count = (int) WC()->cart->get_cart_contents_count();

		ob_start();
		?>
		<span class="cart-count<?php echo $count ? '' : ' is-empty'; ?>" aria-hidden="<?php echo $count ? 'false' : 'true'; ?>">
			<?php echo $count ?: ''; ?>
		</span>
		<?php
		$fragments['.cart-count'] = ob_get_clean();

		return $fragments;
	}
}
