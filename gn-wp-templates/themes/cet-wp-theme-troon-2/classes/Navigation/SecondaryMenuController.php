<?php

namespace Cet\Theme\Troon2\Navigation;

class SecondaryMenuController extends AbstractMenuController {

	protected function getTemplateName(): string {
		return 'secondary-menu';
	}

	public function init(): void {
		add_filter( 'wp_nav_menu_objects', [ $this, 'replaceWithIcons' ], 20, 2 );
	}

	/**
	 * Replace secondary menu item text with SVG icons, with optional WooCommerce cart count.
	 */
	public function replaceWithIcons( array $items, $args ): array {
		if ( empty( $args->theme_location ) || MenuLocation::Secondary->value !== $args->theme_location ) {
			return $items;
		}

		if ( ! class_exists( '\Cet\Theme\Troon2\Svg\SpriteManager' ) ) {
			return $items;
		}

		$icon_id_map = [
			'shopping-cart' => 'icon-shopping-cart-icon',
		];

		foreach ( $items as $item ) {
			$classes   = array_map( 'strtolower', (array) $item->classes );
			$icon_slug = null;

			foreach ( array_keys( $icon_id_map ) as $candidate ) {
				if ( in_array( $candidate, $classes, true ) ) {
					$icon_slug = $candidate;
					break;
				}
			}

			if ( ! $icon_slug ) {
				continue;
			}

			$icon_id = $icon_id_map[ $icon_slug ];
			$svg     = \Cet\Theme\Troon2\Svg\SpriteManager::getRenderedSvg( $icon_id );

			if ( empty( $svg ) ) {
				continue;
			}

			$label = wp_strip_all_tags( $item->title );

			if ( 'shopping-cart' === $icon_slug && function_exists( 'WC' ) && WC()->cart ) {
				$count = (int) WC()->cart->get_cart_contents_count();

				$item->title = sprintf(
					'<span class="header-secondary-nav__social-icon-wrapper cart">%1$s<span class="cart-count%2$s" aria-hidden="%3$s">%4$s</span><span class="screen-reader-text">%5$s</span></span>',
					$svg,
					$count ? '' : ' is-empty',
					$count ? 'false' : 'true',
					$count ?: '',
					esc_html( $label )
				);
			} else {
				$item->title = sprintf(
					'<span class="header-secondary-nav__social-icon-wrapper">%1$s<span class="screen-reader-text">%2$s</span></span>',
					$svg,
					esc_html( $label )
				);
			}
		}

		return $items;
	}

	public function render(): void {
		if ( ! has_nav_menu( MenuLocation::Secondary->value ) ) {
			return;
		}

		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo $this->renderTemplate();
	}
}
