<?php

namespace Cet\Theme\Troon2\Admin;

use Cet\Theme\Troon2\Navigation\MenuLocation;
use Cet\Theme\Troon2\Navigation\PrimaryMenuController;

class MenuEditorNotices {

	public function init(): void {
		add_action( 'admin_notices', [ $this, 'render' ] );
	}

	public function render(): void {
		$screen = get_current_screen();

		if ( ! $screen || 'nav-menus' !== $screen->id ) {
			return;
		}

		$menu_id = $this->resolveCurrentMenuId();

		if ( ! $menu_id ) {
			return;
		}

		$notifier  = new Notifier();
		$locations = get_nav_menu_locations();

		if ( ( $locations[ MenuLocation::Primary->value ] ?? 0 ) === $menu_id ) {
			$this->addPrimaryNotice( $notifier, $menu_id );
		}

		if ( ( $locations[ MenuLocation::Tertiary->value ] ?? 0 ) === $menu_id ) {
			$this->addTertiaryNotice( $notifier );
		}

		$notifier->output();
	}

	private function addPrimaryNotice( Notifier $notifier, int $menu_id ): void {
		$items = wp_get_nav_menu_items( $menu_id );

		if ( empty( $items ) ) {
			return;
		}

		$root_count = count(
			array_filter( $items, fn( $item ) => 0 === (int) $item->menu_item_parent )
		);

		if ( $root_count <= PrimaryMenuController::MAX_PRIMARY_NAV_ITEMS ) {
			return;
		}

		$overflow_count = $root_count - PrimaryMenuController::MAX_PRIMARY_NAV_ITEMS;

		$notifier->add(
			sprintf(
				esc_html__(
					'This menu has %1$d top-level items. Only the first %2$d will appear in the primary navigation — the remaining %3$d will be moved to the burger menu automatically.',
					'cet-wp-theme-troon-2'
				),
				$root_count,
				PrimaryMenuController::MAX_PRIMARY_NAV_ITEMS,
				$overflow_count
			),
			Notifier::WARNING
		);
	}

	private function addTertiaryNotice( Notifier $notifier ): void {
		$notifier->add(
			sprintf(
				esc_html__(
					'Any top-level items beyond the first %d in the primary menu will automatically appear at the top of this menu on the frontend.',
					'cet-wp-theme-troon-2'
				),
				PrimaryMenuController::MAX_PRIMARY_NAV_ITEMS
			),
			Notifier::INFO
		);
	}

	/**
	 * Replicates WordPress's own logic for determining which menu is currently displayed
	 * on the nav-menus screen when no explicit ?menu= parameter is present.
	 */
	private function resolveCurrentMenuId(): int {
		if ( isset( $_REQUEST['menu'] ) ) {
			return absint( $_REQUEST['menu'] );
		}

		$menus = wp_get_nav_menus();

		return ! empty( $menus ) ? (int) $menus[0]->term_id : 0;
	}
}
