<?php

namespace Cet\Theme\Troon2\Layout\WooCommerce;

/**
 * WooCommerce data provider for Shop page template parts.
 *
 * Encapsulates all WooCommerce queries and data preparation
 * used by the Shop page sections. Template parts receive
 * prepared data arrays and are responsible only for markup.
 *
 * @package cet-wp-theme-troon-2
 */
class WooData {

	/**
	 * Get Woo hero data from the current request context and Customizer.
	 *
	 * @param int $page_id Shop page ID.
	 * @return array{title: string, caption: string, image: string, image_alt: string}
	 */
	public function getShopHeroData( int $page_id ): array {
		$title   = $this->resolveHeroTitle( $page_id );
		$caption = get_theme_mod( 'cet_shop_hero_caption', 'Online Store' );

		if ( $page_id && has_post_thumbnail( $page_id ) ) {
			$image_id  = get_post_thumbnail_id( $page_id );
			$image_url = (string) get_the_post_thumbnail_url( $page_id, 'full' );
			$image_alt = (string) get_post_meta( $image_id, '_wp_attachment_image_alt', true );
		} elseif ( get_theme_mod( 'cet_shop_hero_image' ) ) {
			$image_url = (string) get_theme_mod( 'cet_shop_hero_image' );
			$image_alt = '';
		} else {
			$image_url = (string) get_theme_file_uri( 'images/patterns/banner-shop.jpg' );
			$image_alt = '';
		}

		return [
			'title'     => $title,
			'caption'   => $caption,
			'image'     => $image_url,
			'image_alt' => $image_alt,
		];
	}

	/**
	 * Resolve the hero title for the current WooCommerce request.
	 *
	 * Shop keeps the configured shop page title, product archives use the current
	 * archive title, and single products use the product title.
	 *
	 * @param int $page_id Shop page ID.
	 */
	private function resolveHeroTitle( int $page_id ): string {
		if ( function_exists( 'is_product' ) && is_product() ) {
			return get_the_title( get_the_ID() ) ?: 'Pro Shop';
		}

		if (
			function_exists( 'is_product_category' )
			&& ( is_product_category() || is_product_tag() || is_tax( 'product_brand' ) )
		) {
			return function_exists( 'woocommerce_page_title' )
				? woocommerce_page_title( false )
				: single_term_title( '', false );
		}

		return $page_id ? get_the_title( $page_id ) : 'Pro Shop';
	}

	/**
	 * Get product categories for the Shop Everything carousel.
	 *
	 * Respects Customizer selection (cet_shop_category_ids).
	 * Falls back to all top-level non-empty categories.
	 * Excludes the default product category in PHP.
	 *
	 * @return \WP_Term[]
	 */
	public function getShopCategories(): array {
		$selected_ids      = get_theme_mod( 'cet_shop_category_ids', '' );
		$default_cat_id    = (int) get_option( 'default_product_cat', 0 );
		$selected_id_array = array_filter( array_map( 'absint', explode( ',', (string) $selected_ids ) ) );

		if ( $default_cat_id ) {
			$selected_id_array = array_diff( $selected_id_array, [ $default_cat_id ] );
		}

		if ( ! empty( $selected_id_array ) ) {
			$categories = get_terms( [
				'taxonomy'   => 'product_cat',
				'include'    => array_values( $selected_id_array ),
				'hide_empty' => true,
				'orderby'    => 'menu_order',
				'order'      => 'ASC',
			] );
		} else {
			$categories = get_terms( [
				'taxonomy'   => 'product_cat',
				'hide_empty' => true,
				'parent'     => 0,
				'orderby'    => 'menu_order',
				'order'      => 'ASC',
			] );
		}

		if ( is_wp_error( $categories ) || empty( $categories ) ) {
			return [];
		}

		if ( $default_cat_id ) {
			$categories = array_filter( $categories, static function ( $cat ) use ( $default_cat_id ) {
				return (int) $cat->term_id !== $default_cat_id;
			} );
		}

		return array_values( $categories );
	}

	/**
	 * Get featured products for the Our Store grid.
	 *
	 * @return \WC_Product[]
	 */
	public function getFeaturedProducts(): array {
		if ( ! function_exists( 'wc_get_products' ) ) {
			return [];
		}

		return wc_get_products( [
			'featured' => true,
			'limit'    => 8,
			'status'   => 'publish',
			'orderby'  => 'date',
			'order'    => 'DESC',
		] );
	}

	/**
	 * Get featured brands with thumbnail images.
	 *
	 * @return array<int, array{term: \WP_Term, thumbnail_url: string}>
	 */
	public function getFeaturedBrands(): array {
		if ( ! taxonomy_exists( 'product_brand' ) ) {
			return [];
		}

		$brands = get_terms( [
			'taxonomy'   => 'product_brand',
			'hide_empty' => true,
			'number'     => 10,
			'orderby'    => 'menu_order',
			'order'      => 'ASC',
		] );

		if ( is_wp_error( $brands ) || empty( $brands ) ) {
			return [];
		}

		$result = [];

		foreach ( $brands as $brand ) {
			$thumbnail_id = get_term_meta( $brand->term_id, 'thumbnail_id', true );

			$thumbnail_url = '';
			if ( function_exists( 'wc_get_brand_thumbnail_url' ) ) {
				$thumbnail_url = wc_get_brand_thumbnail_url( $brand->term_id, 'full' );
			}

			if ( ! $thumbnail_url && $thumbnail_id ) {
				$thumbnail_url = wp_get_attachment_image_url( (int) $thumbnail_id, 'full' );
			}

			if ( ! $thumbnail_url ) {
				continue;
			}

			$brand_link = get_term_link( $brand );
			if ( is_wp_error( $brand_link ) ) {
				continue;
			}

			$result[] = [
				'term'          => $brand,
				'thumbnail_url' => $thumbnail_url,
				'link'          => $brand_link,
			];
		}

		return $result;
	}
}
