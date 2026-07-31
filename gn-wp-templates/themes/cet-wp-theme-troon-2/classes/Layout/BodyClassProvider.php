<?php
/**
 * Body class provider.
 *
 * @package cet-wp-theme-troon-2
 */

namespace Cet\Theme\Troon2\Layout;

use Cet\Theme\Troon2\Layout\State\PageState;

/**
 * Registers body_class filters that signal layout context to CSS.
 */
class BodyClassProvider {

	protected const HEADER_OFFSET_SIGNAL_CLASS = 'has-sticky-header-offset';

	public function __construct() {
		add_filter( 'body_class', [ $this, 'addHeaderOffset' ] );
	}

	/**
	 * @param string[] $classes
	 * @return string[]
	 */
	public function addHeaderOffset( array $classes ): array {
		if ( $this->needsHeaderOffset() ) {
			$classes[] = static::HEADER_OFFSET_SIGNAL_CLASS;
		}

		return $classes;
	}

	private function needsHeaderOffset(): bool {
        if ( is_404() || is_search() ) {
            return true;
        }

		// Events Calendar — all views (month, list, day, single event, category, etc.).
		if ( function_exists( 'tribe_is_event_query' ) && tribe_is_event_query() ) {
			return true;
		}

		// WooCommerce shop/product/archive templates render a hero directly under
		// the fixed header and should participate in the transparent-header path.
		if ( function_exists( 'is_shop' ) && is_shop() ) {
			return false;
		}

		if ( function_exists( 'is_product' ) && is_product() ) {
			return false;
		}

		if ( function_exists( 'is_product_category' ) && ( is_product_category() || is_tax( 'product_brand' ) ) ) {
			return false;
		}

		// HeroRenderer::prepareEarly() sets this flag before body_class fires
		if ( PageState::get()->hasFeaturedHeroTemplate() ) {
			return false;
		}

		if ( ! is_singular() ) {
			return false;
		}

		// Other singular (front page, posts, CPTs): add offset unless the first
		// content block is a full-bleed cover that intentionally overlaps the header.
		return ! PageState::get()->firstBlockIsTransparent();
	}
}
