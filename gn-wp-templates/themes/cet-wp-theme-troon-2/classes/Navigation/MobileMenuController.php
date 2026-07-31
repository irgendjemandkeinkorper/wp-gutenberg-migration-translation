<?php

namespace Cet\Theme\Troon2\Navigation;

class MobileMenuController extends AbstractMenuController {

	use BurgerMenuTrait;

	public function __construct( private SecondaryMenuController $secondary ) {}

	protected function getTemplateName(): string {
		return 'mobile-menu';
	}

	public function render(): void {
		$items = $this->collectItems( [ MenuLocation::Primary->value, MenuLocation::Tertiary->value ] );

		if ( empty( $items ) ) {
			return;
		}

		$children_map = [];
		foreach ( $items as $item ) {
			$children_map[ (int) $item->menu_item_parent ][] = $item;
		}

		// Mark the first root-level tertiary item as a visual section divider.
		foreach ( $children_map[0] ?? [] as $item ) {
			if ( isset( $item->menu_source ) && MenuLocation::Tertiary->value === $item->menu_source ) {
				$item->classes[] = 'menu-divider';
				break;
			}
		}

		$render_items = fn( int $parent_id ) => $this->renderMenuItems( $parent_id, $children_map );

		ob_start();
		$this->secondary->render();
		$secondary_menu_html = (string) ob_get_clean();

		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo $this->renderTemplate( [
			'children_map'       => $children_map,
			'render_items'       => $render_items,
			'burger_heading'     => $this->getBurgerHeading(),
			'burger_close_icon'  => $this->getBurgerCloseIcon(),
			'secondary_menu_html' => $secondary_menu_html,
		] );
	}

	/**
	 * Collect menu items from multiple theme locations, tagging each with menu_source.
	 *
	 * @param string[] $locations Theme location slugs.
	 * @return WP_Post[]
	 */
	private function collectItems( array $locations ): array {
		$all_items     = [];
		$nav_locations = get_nav_menu_locations();

		foreach ( $locations as $location ) {
			if ( empty( $nav_locations[ $location ] ) ) {
				continue;
			}

			$items = wp_get_nav_menu_items( $nav_locations[ $location ] );

			if ( empty( $items ) || is_wp_error( $items ) ) {
				continue;
			}

			foreach ( $items as $item ) {
				$item->menu_source = $location;
			}

			$all_items = array_merge( $all_items, $items );
		}

		return $all_items;
	}

	/**
	 * Recursively render mobile menu items as nested <ul>/<li> elements.
	 */
	private function renderMenuItems( int $parent_id, array $children_map ): void {
		if ( empty( $children_map[ $parent_id ] ) ) {
			return;
		}

		$list_class = 0 === $parent_id ? 'burger-nav__list' : 'sub-menu';
		echo '<ul class="' . esc_attr( $list_class ) . '">';

		foreach ( $children_map[ $parent_id ] as $item ) {
			$has_children = ! empty( $children_map[ (int) $item->ID ] );

			$level_class = 0 === (int) $item->menu_item_parent
				? '-root-level'
				: ( $has_children ? '-mid-level' : '-end-level' );

			$classes = [
				'menu-item',
				'menu-item-type-' . $item->type,
				'menu-item-object-' . $item->object,
				'menu-item-' . $item->ID,
				$level_class,
			];

			if ( $has_children ) {
				$classes[] = 'menu-item-has-children';
			}

			if ( in_array( 'menu-divider', (array) $item->classes, true ) ) {
				$classes[] = 'menu-divider';
			}

			$item_text_classes = apply_filters(
				'cet_menu_item_text_classes',
				[ 'cet-anchor-title', $level_class ],
				(object) [ 'theme_location' => $item->menu_source ?? '' ],
				$item
			);

			printf(
				'<li class="%s"><a href="%s"><span class="%s">%s</span></a>',
				esc_attr( implode( ' ', $classes ) ),
				esc_url( $item->url ),
				esc_attr( implode( ' ', $item_text_classes ) ),
				esc_html( wp_strip_all_tags( $item->title ) )
			);

			$this->renderMenuItems( (int) $item->ID, $children_map );

			echo '</li>';
		}

		echo '</ul>';
	}
}
