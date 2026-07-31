<?php

namespace Cet\Theme\Troon2\Navigation;

use Cet\Theme\Troon2\Navigation\Registry\OverflowMenuRegistry;

class NavigationFactory {

	private static ?NavigationController $controller = null;

	public static function init(): void {
		self::getController();
	}

	public static function primary(): PrimaryMenuController {
		return self::getController()->primary();
	}

	public static function secondary(): SecondaryMenuController {
		return self::getController()->secondary();
	}

	public static function tertiary(): TertiaryMenuController {
		return self::getController()->tertiary();
	}

	public static function mobile(): MobileMenuController {
		return self::getController()->mobile();
	}

	public static function social(): FooterSocialMenuController {
		return self::getController()->social();
	}

	public static function legal(): FooterLegalMenuController {
		return self::getController()->legal();
	}

	private static function getController(): NavigationController {
		if ( null === self::$controller ) {
			$overflow_registry = new OverflowMenuRegistry();

			$secondary = new SecondaryMenuController();

			self::$controller = new NavigationController(
				new PrimaryMenuController( $overflow_registry ),
				$secondary,
				new TertiaryMenuController( $overflow_registry ),
				new MobileMenuController( $secondary ),
				new FooterSocialMenuController(),
				new FooterLegalMenuController(),
			);
			self::$controller->init();
		}

		return self::$controller;
	}
}
