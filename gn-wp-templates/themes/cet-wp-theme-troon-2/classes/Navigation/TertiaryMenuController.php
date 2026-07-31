<?php

namespace Cet\Theme\Troon2\Navigation;

use Cet\Theme\Troon2\Navigation\Registry\OverflowMenuRegistry;

class TertiaryMenuController extends AbstractMenuController {

	use BurgerMenuTrait;

	public function __construct( private OverflowMenuRegistry $overflowRegistry ) {}

	protected function getTemplateName(): string {
		return 'tertiary-menu';
	}

	public function init(): void {
		add_filter( 'wp_nav_menu_objects', [ $this, 'prependOverflowItems' ], 5, 2 );
	}

	/**
	 * Prepend primary-nav overflow items so they appear first in the burger drawer.
	 * Runs at priority 5, before addLevelClasses (priority 10), so overflow items
	 * get level classes applied alongside the regular tertiary items.
	 */
	public function prependOverflowItems( array $items, object $args ): array {
		if ( MenuLocation::Tertiary->value !== ( $args->theme_location ?? '' ) ) {
			return $items;
		}

		if ( $this->overflowRegistry->isEmpty() ) {
			return $items;
		}

		return array_merge( $this->overflowRegistry->get(), $items );
	}

	public function getBurgerClass(): string {
		$class = 'site-header__burger';
		if ( has_nav_menu( MenuLocation::Tertiary->value ) || ! $this->overflowRegistry->isEmpty() ) {
			$class .= ' has-tertiary-menu';
		}
		return $class;
	}

	public function render(): void {
		if ( ! has_nav_menu( MenuLocation::Tertiary->value ) && $this->overflowRegistry->isEmpty() ) {
			return;
		}

		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo $this->renderTemplate( [
			'overflow_items'    => $this->overflowRegistry->get(),
			'burger_heading'    => $this->getBurgerHeading(),
			'burger_close_icon' => $this->getBurgerCloseIcon(),
		] );
	}
}
