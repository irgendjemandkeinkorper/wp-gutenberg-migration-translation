<?php

namespace Cet\Theme\Troon2\Navigation;

use Cet\Theme\Troon2\Navigation\Registry\OverflowMenuRegistry;

class PrimaryMenuController extends AbstractMenuController {

	const MAX_PRIMARY_NAV_ITEMS = 5;

	public function __construct( private readonly OverflowMenuRegistry $overflowRegistry ) {}

	protected function getTemplateName(): string {
		return 'primary-menu';
	}

	public function init(): void {
		add_filter( 'nav_menu_link_attributes', [ $this, 'addDataTextAttribute' ], 10, 3 );
		add_filter( 'wp_nav_menu_objects', [ $this, 'capPrimaryItems' ], 20, 2 );
	}

	/**
	 * Add data-text attribute for hover font-weight animation fix.
	 */
	public function addDataTextAttribute( array $atts, $item, $args ): array {
		if ( empty( $args->theme_location ) || MenuLocation::Primary->value !== $args->theme_location ) {
			return $atts;
		}

		$atts['data-text'] = wp_strip_all_tags( $item->title );

		return $atts;
	}

	/**
	 * Cap root-level items at MAX_PRIMARY_NAV_ITEMS. Items beyond the limit
	 * are stored in $overflowItems for the tertiary (burger) menu to consume.
	 */
	public function capPrimaryItems( array $items, object $args ): array {
		if ( MenuLocation::Primary->value !== ( $args->theme_location ?? '' ) ) {
			return $items;
		}

		$root_count   = 0;
		$overflow_ids = [];
		$overflow     = [];
		$visible      = [];

		foreach ( $items as $item ) {
			if ( 0 === (int) $item->menu_item_parent ) {
				$is_overflow = ++$root_count > self::MAX_PRIMARY_NAV_ITEMS;
			} else {
				$is_overflow = isset( $overflow_ids[ (int) $item->menu_item_parent ] );
			}

			if ( $is_overflow ) {
				$overflow_ids[ (int) $item->ID ] = true;
				$overflow[] = $item;
			} else {
				$visible[] = $item;
			}
		}

		$this->overflowRegistry->set( $overflow );

		return $visible;
	}

	public function render(): void {
		if ( ! has_nav_menu( MenuLocation::Primary->value ) ) {
			return;
		}

		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo $this->renderTemplate();
	}
}
