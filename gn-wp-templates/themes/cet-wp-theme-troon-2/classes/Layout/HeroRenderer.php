<?php
/**
 * Page hero renderer.
 *
 * @package cet-wp-theme-troon-2
 */

namespace Cet\Theme\Troon2\Layout;

use Cet\Theme\Troon2\Layout\State\PageState;

/**
 * Renders the banner-hero-short-image pattern for singular pages, WooCommerce
 * shop/product/category contexts.
 *
 * Two-phase design:
 *  1. register() hooks prepareEarly() into the `wp` action — before body_class fires —
 *     so PageState::hasFeaturedHero is set in time for BodyClassProvider to read it.
 *  2. render() outputs the markup using data pre-resolved in phase 1, or is a
 *     no-op when prepareEarly() determined the hero is not needed.
 */
class HeroRenderer {

	private static bool $enabled = false;

	/** @var array{title:string,caption:string,image:string,image_alt:string}|null */
	private static ?array $resolvedData = null;

	public static function register(): void {
		add_action( 'wp', [ static::class, 'prepareEarly' ] );
	}

	public static function isEnabled(): bool {
		return static::$enabled;
	}

	/**
	 * Runs on the `wp` action — queried object is known, body_class has not fired yet.
	 * Detects whether this request will render a programmatic hero and marks state.
	 */
	public static function prepareEarly(): void {
		$is_page            = is_singular( 'page' ) && ! is_front_page();
		$is_shop            = function_exists( 'is_shop' ) && is_shop();
		$is_product         = function_exists( 'is_product' ) && is_product();
		$is_product_archive = function_exists( 'is_product_category' )
			&& ( is_product_category() || is_tax( 'product_brand' ) );

		if ( ! $is_page && ! $is_shop && ! $is_product && ! $is_product_archive ) {
			return;
		}

		// If the first content block slides under the header (e.g. core/cover),
		// the transparent-header pattern takes priority — no featured hero needed.
		if ( $is_page && PageState::get()->firstBlockIsTransparent() ) {
			return;
		}

		if ( $is_page || $is_product ) {
			static::$resolvedData = static::resolveFromPost();
		} elseif ( $is_product_archive ) {
			static::$resolvedData = static::resolveFromTerm();
		}
		// $is_shop: data is passed explicitly at render() call time.

		static::$enabled = true;
		PageState::update( [ 'hasFeaturedHero' => true ] );
	}

	/**
	 * Output the hero banner. No-op when prepareEarly() disabled the hero for this request.
	 *
	 * @param array{title?:string, caption?:string, image?:string, image_alt?:string} $data
	 */
	public static function render( array $data = [] ): void {
		if ( ! static::$enabled ) {
			return;
		}

		$hero_data = $data
			? [
				'title'     => $data['title'] ?? '',
				'caption'   => $data['caption'] ?? '',
				'image'     => $data['image'] ?? '',
				'image_alt' => $data['image_alt'] ?? '',
			]
			: ( static::$resolvedData ?? static::resolveFromPost() );

		ob_start();
		get_template_part( 'patterns/banner-hero-short-image', null, $hero_data );
		$markup = (string) ob_get_clean();

		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo do_blocks( $markup );
	}

	/**
	 * @return array{title:string,caption:string,image:string,image_alt:string}
	 */
	private static function resolveFromPost(): array {
		$post         = PageState::get()->post;
		$has_img      = $post && has_post_thumbnail( $post->ID );

		return [
			'title'     => $post ? get_the_title( $post->ID ) : '',
			'caption'   => $post ? (string) get_post_meta( $post->ID, '_page_subtitle', true ) : '',
			'image'     => $has_img ? (string) get_the_post_thumbnail_url( $post->ID, 'full' ) : static::getFallbackImage(),
			'image_alt' => $has_img ? (string) get_post_meta( get_post_thumbnail_id( $post->ID ), '_wp_attachment_image_alt', true ) : '',
		];
	}

	/**
	 * @return array{title:string,caption:string,image:string,image_alt:string}
	 */
	private static function resolveFromTerm(): array {
		$term         = get_queried_object();
		$thumbnail_id = $term instanceof \WP_Term
			? (int) get_term_meta( $term->term_id, 'thumbnail_id', true )
			: 0;

		return [
			'title'     => $term instanceof \WP_Term ? $term->name : '',
			'caption'   => '',
			'image'     => $thumbnail_id ? (string) wp_get_attachment_url( $thumbnail_id ) : static::getFallbackImage(),
			'image_alt' => $thumbnail_id ? (string) get_post_meta( $thumbnail_id, '_wp_attachment_image_alt', true ) : '',
		];
	}

    private static function getFallbackImage(): string {
        return (string) ( get_header_image() ?: get_theme_support( 'custom-header', 'default-image' ) );
    }
}
