<?php

namespace Cet\Theme\Troon2\Navigation;

trait BurgerMenuTrait {

	/**
	 * Retrieve the burger menu heading from the customizer setting.
	 * Token resolution and DB migration are handled by NavigationController::resolveBurgerHeading().
	 *
	 * @return string
	 */
	protected function getBurgerHeading(): string {
		return (string) get_theme_mod( 'cet_menus_burger_heading' );
	}

	/**
	 * Render the close icon SVG for burger-style menus.
	 *
	 * @return string
	 */
	protected function getBurgerCloseIcon(): string {
		return \Cet\Theme\Troon2\Svg\SpriteManager::getRenderedSvg( 'icon-hamburger-close-icon' );
	}
}
