<?php

namespace Cet\Theme\Troon2\Customizer;

/**
 * Product categories choice field for the Customizer.
 *
 * Provides top-level WooCommerce product categories as choices,
 * excluding the default product category. Choices are resolved
 * at customize_register time when WooCommerce taxonomies are available.
 *
 * @package cet-wp-theme-troon-2
 */
class ProductCategoriesField extends ChoiceField {

	/**
	 * @param string $id Setting ID.
	 * @param string $sectionId Section ID.
	 * @param string $label Field label.
	 * @param string $transport Transport method.
	 * @param string $default Default value.
	 * @param string $description Field description.
	 */
	public function __construct(
		string $id,
		string $sectionId,
		string $label,
		string $transport = 'refresh',
		string $default = '',
		string $description = ''
	) {
		parent::__construct(
			$id,
			$sectionId,
			$label,
			[ self::class, 'resolveChoices' ],
			$transport,
			$default,
			$description
		);
	}

	/**
	 * Resolve product category choices.
	 *
	 * @return array<int, string> Term ID => name map.
	 */
	public static function resolveChoices(): array {
		if ( ! function_exists( 'WC' ) ) {
			return [];
		}

		$categories = get_terms( [
			'taxonomy'   => 'product_cat',
			'hide_empty' => false,
			'parent'     => 0,
			'orderby'    => 'menu_order',
			'order'      => 'ASC',
		] );

		if ( is_wp_error( $categories ) || empty( $categories ) ) {
			return [];
		}

		$default_cat = (int) get_option( 'default_product_cat', 0 );

		if ( $default_cat ) {
			$categories = array_filter( $categories, static function ( $cat ) use ( $default_cat ) {
				return (int) $cat->term_id !== $default_cat;
			} );
		}

		$choices = [];
		foreach ( $categories as $cat ) {
			$choices[ $cat->term_id ] = $cat->name;
		}

		return $choices;
	}
}
