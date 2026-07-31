<?php

use Cet\Theme\Troon2\Navigation\MenuLocation;

wp_nav_menu(
	[
		'theme_location'       => MenuLocation::FooterLegal->value,
		'container'            => 'nav',
		'container_class'      => 'footer-legal-navigation',
		'container_aria_label' => esc_attr__( 'Footer legal links', 'cet-wp-theme-troon-2' ),
		'menu_class'           => 'footer-legal-navigation__list',
		'fallback_cb'          => false,
		'depth'                => 1,
		'link_before'          => '<span class="footer-legal-navigation__link-text">',
		'link_after'           => '</span>',
	]
);
