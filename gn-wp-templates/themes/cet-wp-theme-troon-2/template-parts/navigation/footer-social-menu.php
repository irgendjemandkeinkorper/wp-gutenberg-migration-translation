<?php

use Cet\Theme\Troon2\Navigation\MenuLocation;

wp_nav_menu(
	[
		'theme_location'       => MenuLocation::FooterSocial->value,
		'container'            => 'nav',
		'container_class'      => 'footer-social-navigation',
		'container_aria_label' => esc_attr__( 'Footer social links', 'cet-wp-theme-troon-2' ),
		'menu_class'           => 'footer-social-navigation__list',
		'fallback_cb'          => false,
		'depth'                => 1,
	]
);
