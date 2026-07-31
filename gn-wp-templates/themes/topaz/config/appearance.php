<?php
/**
 * Genesis Sample appearance settings.
 *
 * @package Topaz
 * @author  Golfnow
 * @license GPL-2.0-or-later
 * @link    https://www.golfnow.com/
 */

$topaz_default_colors = [
	'body' => '#fff',
	'text' => '#424242',
	'headers' => '#05101b',
	'primary' => '#4261a1',
	'primary-transparent' => 'rgba(66, 97, 161, .9)',
	'primary-hover' => '#333',
	'secondary' => '#333',
	'secondary-text' => '#fff',
	'btn-shadow' => 'rgba(166, 46, 46, 0.25)',
	'borders' => '#d4d4d4',
	'nav-bg' => 'rgba(255, 255, 255, 0.9)',
	'nav-bg-scrolled' => 'rgba(255, 255, 255, 0.9)',
	'nav-text' => '#444',
	'nav-active' => '#a62e2e',
	'dropdown-borders' => '#e1e1e1',
	'dropdown-color' => '#333',
	'dropdown-background' => '#fff',
	'dropdown-color-hover' => '#333',
	'dropdown-background-hover' => '#f6f6f6',
	'footer' => '#111',
	'footer-text' => '#fff',
	'footer-headers' => '#fff',
	'footer-links' => '#eee',
	'footer-links-hover' => '#4f82e9',
	'footer-links-borders' => '#fff',
	'bottom-bar' => '#000',
	'bottom-text' => '#777',
	'bottom-links' => '#6867074',
	'bottom-links-hover' => '#fff',
];

$topaz_primary_color = get_theme_mod(
	'topaz_primary_color',
	$topaz_default_colors['primary']
);

$topaz_secondary_color = get_theme_mod(
	'topaz_secondary_color',
	$topaz_default_colors['secondary']
);

$topaz_primary_color_contrast   = topaz_color_contrast( $topaz_primary_color );
$topaz_primary_color_brightness = topaz_color_brightness( $topaz_primary_color, 35 );

return [
	'fonts-url'            => 'https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300;0,400;0,600;0,700;0,800;1,300;1,400&family=Raleway:wght@400;500;700;800&display=swap',
	'content-width'        => 1170,
	'primary-color'        => $topaz_primary_color,
	'button-bg'            => $topaz_primary_color,
	'button-color'         => $topaz_primary_color_contrast,
	'button-outline-hover' => $topaz_primary_color_brightness,
	'default-colors'       => $topaz_default_colors,
	'editor-color-palette' => [
		[
			'name'  => __( 'Primary Color', 'topaz' ), // Called “Link Color” in the Customizer options. Renamed because “Link Color” implies it can only be used for links.
			'slug'  => 'theme-primary',
			'color' => $topaz_primary_color,
		],
		[
			'name'  => __( 'Secondary Color', 'topaz' ),
			'slug'  => 'theme-secondary',
			'color' => $topaz_secondary_color,
		],
	],
	'editor-font-sizes'    => [
		[
			'name' => __( 'Small', 'topaz' ),
			'size' => 12,
			'slug' => 'small',
		],
		[
			'name' => __( 'Normal', 'topaz' ),
			'size' => 18,
			'slug' => 'normal',
		],
		[
			'name' => __( 'Large', 'topaz' ),
			'size' => 20,
			'slug' => 'large',
		],
		[
			'name' => __( 'Larger', 'topaz' ),
			'size' => 24,
			'slug' => 'larger',
		],
	],
];
