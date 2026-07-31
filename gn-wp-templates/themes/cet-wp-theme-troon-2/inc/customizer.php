<?php
/**
 * Troon 2 Theme Customizer
 *
 * @package cet-wp-theme-troon-2
 */

use Cet\Theme\Troon2\Customizer\CustomizerController;
use Cet\Theme\Troon2\Customizer\Section;
use Cet\Theme\Troon2\Customizer\SimpleField;
use Cet\Theme\Troon2\Customizer\ProductCategoriesField;

/**
 * Initialize and configure theme customizer.
 */
$customizer = new CustomizerController();

// Colors section.
$customizer->addSection(
	new Section(
		'cet_colors_section',
		__( 'Colors', 'cet-wp-theme-troon-2' ),
		160,
		__( 'Controls theme colors.', 'cet-wp-theme-troon-2' )
	)
);

$customizer->addField(
	new SimpleField(
		'cet_colors_primarycolor',
		'cet_colors_section',
		__( 'Primary color', 'cet-wp-theme-troon-2' ),
		'color',
		'sanitize_hex_color',
		'refresh',
		'#8c6a3b'
	)
);

$customizer->addField(
	new SimpleField(
		'cet_colors_secondarycolor',
		'cet_colors_section',
		__( 'Secondary color', 'cet-wp-theme-troon-2' ),
		'color',
		'sanitize_hex_color',
		'refresh',
		'#012831'
	)
);

// Menu Settings section (nested under nav_menus panel).
$customizer->addSection(
	new Section(
		'cet_menus_section',
		__( 'Menu Settings', 'cet-wp-theme-troon-2' ),
		5,
		__( 'Controls menu text and labels.', 'cet-wp-theme-troon-2' ),
		'nav_menus'
	)
);

$customizer->addField(
	new SimpleField(
		'cet_menus_burger_heading',
		'cet_menus_section',
		__( 'Burger menu heading', 'cet-wp-theme-troon-2' ),
		'text',
		'sanitize_text_field',
		'refresh',
		'Explore {site_title}'
	)
);

// WooCommerce Shop section.
$customizer->addSection(
	new Section(
		'cet_shop_section',
		__( 'WooCommerce Shop', 'cet-wp-theme-troon-2' ),
		170,
		__( 'Controls the WooCommerce Shop page sections.', 'cet-wp-theme-troon-2' )
	)
);

$customizer->addField(
	new SimpleField(
		'cet_shop_hero_caption',
		'cet_shop_section',
		__( 'Shop Hero Caption', 'cet-wp-theme-troon-2' ),
		'text',
		'sanitize_text_field',
		'refresh',
		'Online Store'
	)
);

$customizer->addField(
	new SimpleField(
		'cet_shop_hero_image',
		'cet_shop_section',
		__( 'Shop Hero Image', 'cet-wp-theme-troon-2' ),
		'image',
		'esc_url_raw',
		'refresh',
		''
	)
);

$customizer->addField(
	new ProductCategoriesField(
		'cet_shop_category_ids',
		'cet_shop_section',
		__( 'Shop Everything Categories', 'cet-wp-theme-troon-2' ),
		'refresh',
		'',
		__( 'Select product categories to display in the Shop Everything section. Leave empty to show all top-level non-empty categories.', 'cet-wp-theme-troon-2' )
	)
);

$customizer->init();
