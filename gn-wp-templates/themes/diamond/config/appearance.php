<?php
/**
 * Diamond appearance settings.
 *
 * @package Diamond
 * @author  NBCU Sports Next
 * @license GPL-2.0-or-later
 * @link    https://business.golfnow.com/Website-Theme-Library/
 */


//  The diamond only has one color that it is styled with.
// 	Everything else should be generated automatically.

$diamond_default_colors = [
	'primary'   => '#e84c3d',
];

$diamond_primary_color = get_theme_mod(
	'diamond_primary_color',
	$diamond_default_colors['primary']
);

$diamond_default_contrasts = [
	'light'					=> '#ffffff',
	'dark'					=> '#111111',
];

$diamond_primary_color_contrast_array 	= array_merge( [
	'best-contrast'						=> diamond_color_contrast( $diamond_primary_color ),
], $diamond_default_contrasts );
$diamond_primary_color_contrast			= $diamond_primary_color_contrast_array["" . get_theme_mod( 'diamond_primary_color_contrast', 'best-contrast' ) . ""];
$diamond_primary_color_brighter 		= diamond_color_shade( $diamond_primary_color, 15 );
$diamond_primary_color_darker 			= diamond_color_shade( $diamond_primary_color, -15 );
$diamond_primary_color_rgb 				= diamond_color_rgb( $diamond_primary_color );
$diamond_primary_color_rgba				= diamond_color_rgb( $diamond_primary_color, 0.7 );

return [
	'fonts-url'            => 'https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400;1,700&display=swap',
	'content-width'        => 1170,
	'primary-color'        => $diamond_primary_color,
	'default-colors'       => $diamond_default_colors,
	'editor-color-palette' => [
		[
			'name'  => __( 'Primary Color', 'diamond' ),
			'slug'  => 'theme-primary',
			'color' => $diamond_primary_color,
		],
		[
			'name'  => __( 'Primary Contrast', 'diamond' ),
			'slug'  => 'theme-primary-contrast',
			'color' => $diamond_primary_color_contrast,
		],
		[
			'name'  => __( 'Primary Brighter', 'diamond' ),
			'slug'  => 'theme-primary-brighter',
			'color' => $diamond_primary_color_brighter,
		],
		[
			'name'  => __( 'Primary Darker', 'diamond' ),
			'slug'  => 'theme-primary-darker',
			'color' => $diamond_primary_color_darker,
		],
		[
			'name'  => __( 'Primary RGB', 'diamond' ),
			'slug'  => 'theme-primary-rgb',
			'color' => $diamond_primary_color_rgb,
		],
		[
			'name'  => __( 'Primary RGBA', 'diamond' ),
			'slug'  => 'theme-primary-rgba',
			'color' => $diamond_primary_color_rgba,
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
