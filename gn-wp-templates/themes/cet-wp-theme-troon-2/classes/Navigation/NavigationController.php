<?php

namespace Cet\Theme\Troon2\Navigation;

/**
 * Orchestrates all header navigation controllers and owns shared menu filters.
 */
class NavigationController {

	public function __construct(
		private PrimaryMenuController $primary,
		private SecondaryMenuController $secondary,
		private TertiaryMenuController $tertiary,
		private MobileMenuController $mobile,
		private FooterSocialMenuController $social,
		private FooterLegalMenuController $legal,
	) {}

	public function init(): void {
		add_filter( 'wp_nav_menu_objects', [ $this, 'addLevelClasses' ], 10, 2 );
		add_filter( 'walker_nav_menu_start_el', [ $this, 'addSubmenuToggle' ], 10, 4 );
		add_filter( 'theme_mod_cet_menus_burger_heading', [ $this, 'resolveBurgerHeading' ] );

		$this->primary->init();
		$this->secondary->init();
		$this->tertiary->init();
		$this->mobile->init();
		$this->social->init();
		$this->legal->init();
	}

	public function primary(): PrimaryMenuController {
		return $this->primary;
	}

	public function secondary(): SecondaryMenuController {
		return $this->secondary;
	}

	public function tertiary(): TertiaryMenuController {
		return $this->tertiary;
	}

	public function mobile(): MobileMenuController {
		return $this->mobile;
	}

	public function social(): FooterSocialMenuController {
		return $this->social;
	}

	public function legal(): FooterLegalMenuController {
		return $this->legal;
	}

	/**
	 * Resolve the {site_title} token and migrate the old hardcoded default to the dynamic value.
	 *
	 * Curly-brace syntax is intentional — percent-delimited tokens (e.g. %site%) contain %s,
	 * which the Customizer pipeline treats as a printf specifier and replaces with the
	 * stylesheet directory URI, corrupting the value before it reaches this filter.
	 */
	public function resolveBurgerHeading( $value ): string {
		// Covers two cases: no value saved yet (get_theme_mod returns false) and
		// Customizer live preview before saving (passes a stdClass).
		if ( ! is_string( $value ) ) {
			return 'Explore ' . get_bloginfo( 'name' );
		}
		if ( 'Explore Troon North Golf' === $value ) {
			$value = 'Explore {site_title}';
		}
		return str_replace( '{site_title}', get_bloginfo( 'name' ), $value );
	}

	/**
	 * Add BEM-style level classes and wrap titles for primary and tertiary menus.
	 */
	public function addLevelClasses( array $items, object $args ): array {
		if ( MenuLocation::Primary->value !== $args->theme_location && MenuLocation::Tertiary->value !== $args->theme_location ) {
			return $items;
		}

		foreach ( $items as $item ) {
			$level_class = 0 === (int) $item->menu_item_parent
				? '-root-level'
				: ( in_array( 'menu-item-has-children', $item->classes, true ) ? '-mid-level' : '-end-level' );

			$item->classes[] = $level_class;

			if ( ! empty( $item->title ) ) {
				$item_text_classes = apply_filters( 'cet_menu_item_text_classes', [ 'cet-anchor-title', $level_class ], $args, $item );

				$item->title = sprintf(
					'<span class="%s">%s</span>',
					implode( ' ', $item_text_classes ),
					wp_strip_all_tags( $item->title )
				);
			}
		}

		return $items;
	}

	/**
	 * Append a submenu toggle button to primary menu items that have children.
	 */
	public function addSubmenuToggle( string $item_output, object $item, int $depth, object $args ): string {
		if ( MenuLocation::Primary->value !== $args->theme_location ) {
			return $item_output;
		}

		// Depth 0 = root-level only. Mid-level submenus are toggled via their anchor click.
		if ( 0 === $depth && in_array( 'menu-item-has-children', $item->classes, true ) ) {
			$item_output .= '<button class="submenu-toggle" data-submenu-toggle aria-expanded="false" aria-label="Toggle submenu"><span class="toggle-arrow"></span></button>';
		}

		return $item_output;
	}
}
