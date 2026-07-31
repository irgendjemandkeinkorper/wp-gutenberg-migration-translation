<?php

use Cet\Theme\Troon2\Navigation\MenuLocation;

wp_nav_menu( [
	'theme_location'       => MenuLocation::Secondary->value,
	'container'            => 'nav',
	'container_class'      => 'header-secondary-nav',
	'container_aria_label' => esc_attr__( 'Header secondary menu', 'cet-wp-theme-troon-2' ),
	'menu_class'           => 'header-secondary-nav__list',
] );
