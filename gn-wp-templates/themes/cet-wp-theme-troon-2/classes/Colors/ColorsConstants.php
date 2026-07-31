<?php
/**
 * Color constants for the Troon 2 theme.
 *
 * @package cet-wp-theme-troon-2
 */

namespace Cet\Theme\Troon2\Colors;

/**
 * Default colors and palette coefficients for the design system.
 */
class ColorsConstants {

	/**
	 * Default theme colors from a design system.
	 */
	const PRIMARY   = '#8c6a3b';
	const SECONDARY = '#012831';
	const DARK      = '#222222';
	const LIGHT     = '#ffffff';

	/**
	 * Primary color variation coefficients.
	 *
	 * These coefficients define HSL transformations to generate lighter/darker variations
	 * of the primary color. Calculated from the existing color palette in the mockup.
	 *
	 * To expand: analyze the target variation color, calculate the HSL difference from
	 * the base color, and add a new entry with the calculated hue/saturation/lightness deltas.
	 *
	 * Example: For a new '200' variation:
	 * - Original color: hsl(186, 100%, 10%)
	 * - Target '200' color: hsl(184, 95%, 25%)
	 * - Coefficients: ['hue' => -2, 'saturation' => -5, 'lightness' => 15]
	 *
	 * @var array<string, array<string, int|float>>
	 */
	public static array $primary_coefficients = [
		'400' => [
			'hue'        => 3,
			'saturation' => 10,
			'lightness'  => 27,
		],
		'300' => [
			'hue'        => 4,
			'saturation' => 15,
			'lightness'  => 35,
		],
		'200' => [
			'hue'        => 4,
			'saturation' => -6,
			'lightness'  => 53,
		],
		'100' => [
			'hue'        => 5,
			'saturation' => 3,
			'lightness'  => 58,
		],
	];

	/**
	 * Secondary color variation coefficients.
	 *
	 * These coefficients define HSL transformations to generate lighter/darker variations
	 * of the secondary color. Calculated from the existing color palette in the mockup.
	 *
	 * To expand: analyze the target variation color, calculate the HSL difference from
	 * the base color, and add a new entry with the calculated hue/saturation/lightness deltas.
	 *
	 * @var array<string, array<string, int|float>>
	 */
	public static array $secondary_coefficients = [
		'400' => [
			'hue'        => 0,
			'saturation' => 4,
			'lightness'  => 5,
		],
		'300' => [
			'hue'        => -6,
			'saturation' => 2.29,
			'lightness'  => 13.14,
		],
	];

	/**
	 * Default primary color palette a design system.
	 *
	 * @var array<string, string>
	 */
	public static array $primary_default_palette = [
		'400' => '#d4b47c',
		'300' => '#e2c99a',
		'200' => '#f2ede4',
		'100' => '#faf8f4',
	];

	/**
	 * Default secondary color palette a design system.
	 *
	 * @var array<string, string>
	 */
	public static array $secondary_default_palette = [
		'400' => '#003e4d',
		'300' => '#016a74',
	];
}
