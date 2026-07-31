<?php
/**
 * Zilker appearance settings.
 *
 * @package Zilker
 * @author  NBCU Sports Next
 * @license GPL-2.0-or-later
 * @link    https://business.golfnow.com/Website-Theme-Library/
 */


//  The Zilker only has one color that it is styled with.
// 	Everything else should be generated automatically.

$zilker_default_colors = [
	'primary'   => '#8dc153',
];

$zilker_primary_color = get_theme_mod(
	'zilker_primary_color',
	$zilker_default_colors['primary']
);

$zilker_default_contrasts = [
	'light'					=> '#ffffff',
	'dark'					=> '#111111',
];

$zilker_primary_color_contrast_array 	= array_merge( [
	'best-contrast'						=> zilker_color_contrast( $zilker_primary_color ),
], $zilker_default_contrasts );
$zilker_primary_color_contrast			= $zilker_primary_color_contrast_array["" . get_theme_mod( 'zilker_primary_color_contrast', 'best-contrast' ) . ""];
$zilker_primary_color_brighter 		= zilker_color_shade( $zilker_primary_color, 15 );
$zilker_primary_color_darker 			= zilker_color_shade( $zilker_primary_color, -15 );
$zilker_primary_color_rgb 				= zilker_color_rgb( $zilker_primary_color );
$zilker_primary_color_rgba				= zilker_color_rgb( $zilker_primary_color, 0.7 );

return [
	'fonts-url'            => 'https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400;1,700&display=swap',
	'fonts'				   => [
		'roboto'	       => 'https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;1,100;1,300;1,400;1,500&display=swap',
	],
	'content-width'        => 1170,
	'primary-color'        => $zilker_primary_color,
	'default-colors'       => $zilker_default_colors,
	'color-palette'		   => [
		"dark-background"		=> "#252932",
		"dark-contrast"			=> "#ffffff",
		"light-background"		=> "#ffffff",
		"light-contast"			=> "#111111",
		"almost-black"			=> "#111111",
		"white"					=> "#ffffff",
		"lt-gray"				=> "#fafafa",
		"gray"					=> "#9ca4af",
		"medium-gray"			=> "#434955",
		"dark-gray"				=> "#353b47",
	],
	'editor-color-palette' => [
		[
			'name'  => __( 'Primary Color', 'diamond' ),
			'slug'  => 'theme-primary',
			'color' => $zilker_primary_color,
		],
		[
			'name'  => __( 'Primary Contrast', 'diamond' ),
			'slug'  => 'theme-primary-contrast',
			'color' => $zilker_primary_color_contrast,
		],
		[
			'name'  => __( 'Primary Brighter', 'diamond' ),
			'slug'  => 'theme-primary-brighter',
			'color' => $zilker_primary_color_brighter,
		],
		[
			'name'  => __( 'Primary Darker', 'diamond' ),
			'slug'  => 'theme-primary-darker',
			'color' => $zilker_primary_color_darker,
		],
		[
			'name'  => __( 'Primary RGB', 'diamond' ),
			'slug'  => 'theme-primary-rgb',
			'color' => $zilker_primary_color_rgb,
		],
		[
			'name'  => __( 'Primary RGBA', 'diamond' ),
			'slug'  => 'theme-primary-rgba',
			'color' => $zilker_primary_color_rgba,
		],
	],
	// Sizes are in rem units
	'editor-font-sizes'    => [
		[
			'name' => __( 'Smaller', 'diamond' ),
			'size' => 12,
			'slug' => 'smaller',
		],
		[
			'name' => __( 'Small', 'diamond' ),
			'size' => 14,
			'slug' => 'small',
		],
		[
			'name' => __( 'Normal', 'diamond' ),
			'size' => 16,
			'slug' => 'normal',
		],
		[
			'name' => __( 'h4', 'diamond' ),
			'size' => 18,
			'slug' => 'h4',
		],
		[
			'name' => __( 'h3', 'diamond' ),
			'size' => 22,
			'slug' => 'h3',
		],
		[
			'name' => __( 'h2', 'diamond' ),
			'size' => 28,
			'slug' => 'h2',
		],
		[
			'name' => __( 'h1', 'diamond' ),
			'size' => 38,
			'slug' => 'h1',
		],
		[
			'name' => __( 'Display 3', 'diamond' ),
			'size' => 48,
			'slug' => 'display-3',
		],
		[
			'name' => __( 'Display 2', 'diamond' ),
			'size' => 55,
			'slug' => 'display-2',
		],
		[
			'name' => __( 'Display 1', 'diamond' ),
			'size' => 60,
			'slug' => 'display-1',
		],
	],
];
