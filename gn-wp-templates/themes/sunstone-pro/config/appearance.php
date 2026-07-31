<?php
/**
 * Sunstone Pro appearance settings.
 *
 * @package sunstone-pro
 */

$sunstone_default_brand_colors = [
	'link'                => '#085F68',
	'link-hover'          => '#1053b7',
	'pre-header'          => '#085F68',
	'pre-header-border'   => '#e3e3e3',
	'pre-header-color'    => '#f1f1f1',
	'header'              => '#ffffff',
	'header-color'        => '#333333',
	'headings-color'      => '#343434',
	'text-color'          => '#666666',
	'button'              => '#085F68',
	'button-border'       => '#085F68',
	'button-color'        => '#ffffff',
	'button-hover'        => '#1053B7',
	'button-hover-border' => '#1053B7',
	'button-hover-color'  => '#ffffff',
	'footer-widget'       => '#262626',
	'footer'              => '#000000',
	'footer-color'        => '#999999',
	'footer-headings'     => '#ababab',
	'footer-links'        => '#11a7b9',
	'footer-links-hover'  => '#91BDF2',
];

$sunstone_colors = [];
foreach ( $sunstone_default_brand_colors as $key => $value ) {
	$sunstone_colors[ $key ] = get_theme_mod( 'sunstone_brand_color_' . $key, $value );
}

return [
	'fonts-url'            => '',
	'content-width'        => 1062,
	'button-bg'            => $sunstone_colors['button'],
	'button-color'         => $sunstone_colors['button-color'],
	'button-outline-hover' => $sunstone_colors['button-hover-border'],
	'link-color'           => $sunstone_colors['link'],
	'default-colors'       => $sunstone_default_brand_colors,
	'brand-colors'         => $sunstone_colors,
	'editor-color-palette' => [
		[
			'name'  => __( 'Black', 'sunstone-pro' ),
			'slug'  => 'black',
			'color' => '#000000',
		],
		[
			'name'  => __( 'White', 'sunstone-pro' ),
			'slug'  => 'white',
			'color' => '#ffffff',
		],
		[
			'name'  => __( 'Gray', 'sunstone-pro' ),
			'slug'  => 'gray',
			'color' => '#f1f1f1',
		],
		[
			'name'  => __( 'Brand primary color', 'sunstone-pro' ),
			'slug'  => 'brand-primary',
			'color' => $sunstone_colors['pre-header'],
		],
		[
			'name'  => __( 'Brand secondary color', 'sunstone-pro' ),
			'slug'  => 'brand-secondary',
			'color' => $sunstone_colors['button-hover'],
		],
		[
			'name'  => __( 'Brand accent color', 'sunstone-pro' ),
			'slug'  => 'brand-accent',
			'color' => $sunstone_colors['footer-links'],
		],
		[
			'name'  => __( 'Brand Tertiary color', 'sunstone-pro' ),
			'slug'  => 'brand-tertiary',
			'color' => $sunstone_colors['footer-widget'],
		],
		[
			'name'  => __( 'Brand extra color', 'sunstone-pro' ),
			'slug'  => 'brand-link',
			'color' => $sunstone_colors['footer-links-hover'],
		],
	],
	'editor-font-sizes'    => [
		[
			'name' => __( 'Small', 'sunstone-pro' ),
			'size' => 12,
			'slug' => 'small',
		],
		[
			'name' => __( 'Normal', 'sunstone-pro' ),
			'size' => 18,
			'slug' => 'normal',
		],
		[
			'name' => __( 'Large', 'sunstone-pro' ),
			'size' => 20,
			'slug' => 'large',
		],
		[
			'name' => __( 'Larger', 'sunstone-pro' ),
			'size' => 24,
			'slug' => 'larger',
		],
	],
];
