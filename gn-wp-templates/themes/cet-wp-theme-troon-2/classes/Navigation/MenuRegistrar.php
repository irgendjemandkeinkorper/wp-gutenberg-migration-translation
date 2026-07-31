<?php

namespace Cet\Theme\Troon2\Navigation;

class MenuRegistrar {

	public static function init(): void {
		add_action( 'after_setup_theme', [ self::class, 'register' ] );
	}

	public static function register(): void {
		$menus = [];

		foreach ( MenuLocation::cases() as $location ) {
			$menus[ $location->value ] = $location->getLabel();
		}

		register_nav_menus( $menus );
	}
}
