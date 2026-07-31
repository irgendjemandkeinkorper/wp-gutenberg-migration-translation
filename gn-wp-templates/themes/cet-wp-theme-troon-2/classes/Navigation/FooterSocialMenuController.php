<?php

namespace Cet\Theme\Troon2\Navigation;

use Cet\Theme\Troon2\Svg\SpriteManager;

class FooterSocialMenuController extends AbstractMenuController {

	protected function getTemplateName(): string {
		return 'footer-social-menu';
	}

	public function init(): void {
		add_filter( 'nav_menu_link_attributes', [ $this, 'addLinkAttributes' ], 10, 3 );
		add_filter( 'walker_nav_menu_start_el', [ $this, 'replaceWithIcons' ], 10, 4 );
	}

	public function addLinkAttributes( array $atts, $item, $args ): array {
		if ( empty( $args->theme_location ) || MenuLocation::FooterSocial->value !== $args->theme_location ) {
			return $atts;
		}

		$atts['class'] = 'footer-social-navigation__link';

		return $atts;
	}

	public function replaceWithIcons( string $item_output, $item, int $depth, $args ): string {
		/*
		if ( ! defined( 'CET_TROON_2_ENABLE_ICONS' ) || ! CET_TROON_2_ENABLE_ICONS ) {
			return $item_output;
		}
		*/

		if ( empty( $args->theme_location ) || MenuLocation::FooterSocial->value !== $args->theme_location ) {
			return $item_output;
		}

		if ( ! class_exists( SpriteManager::class ) ) {
			return $item_output;
		}

		$social_icon_map = [
			'facebook'  => 'icon-facebook-icon',
			'instagram' => 'icon-instagram-icon',
			'x'         => 'icon-x-icon',
		];

		$network = $this->getSocialNetwork( $item );

		if ( empty( $network ) || empty( $social_icon_map[ $network ] ) ) {
			return $item_output;
		}

		$svg = SpriteManager::getRenderedSvg( $social_icon_map[ $network ] );

		if ( empty( $svg ) ) {
			return $item_output;
		}

		$icon_markup = sprintf(
			'<span class="footer-social-navigation__icon" aria-hidden="true">%1$s</span><span class="screen-reader-text">%2$s</span>',
			$svg,
			esc_html( wp_strip_all_tags( $item->title ) )
		);

		return preg_replace(
			'/>(.*?)<\/a>/s',
			'>' . $icon_markup . '</a>',
			$item_output,
			1
		);
	}

	public function render(): void {
		if ( ! has_nav_menu( MenuLocation::FooterSocial->value ) ) {
			return;
		}

		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo $this->renderTemplate();
	}

	private function getSocialNetwork( $item ): string {
		$title   = strtolower( trim( wp_strip_all_tags( $item->title ?? '' ) ) );
		$url     = strtolower( trim( $item->url ?? '' ) );
		$classes = array_map( 'strtolower', (array) ( $item->classes ?? [] ) );

		if ( 'instagram' === $title || in_array( 'instagram', $classes, true ) || false !== strpos( $url, 'instagram.com' ) ) {
			return 'instagram';
		}

		if ( 'facebook' === $title || in_array( 'facebook', $classes, true ) || false !== strpos( $url, 'facebook.com' ) ) {
			return 'facebook';
		}

		if (
			'x' === $title
			|| 'twitter' === $title
			|| in_array( 'x', $classes, true )
			|| in_array( 'twitter', $classes, true )
			|| false !== strpos( $url, 'x.com' )
			|| false !== strpos( $url, 'twitter.com' )
		) {
			return 'x';
		}

		return '';
	}
}
