<?php

namespace Cet\Theme\Troon2\Colors;

use Spatie\Color\Hex;
use Spatie\Color\Hsl;

class ColorsHandler {

	/**
	 * Generate color variations from a base color with custom coefficients.
	 *
	 * @param string $color Base color in hex format (e.g., '#012831')
	 * @param array $coefficients Array of coefficient arrays, each containing:
	 *        - 'hue' (float): Change in hue (can be negative)
	 *        - 'saturation' (float): Change in saturation percentage
	 *        - 'lightness' (float): Change in lightness percentage
	 * @return array Array of hex color strings
	 */
	public static function generatePalette(string $color, array $coefficients = []):array {
        // Parse the base color
		$baseColor = Hex::fromString($color);
		$hsl = $baseColor->toHsl();

		// Get current HSL values
		$hue = round($hsl->hue());
		$saturation = $hsl->saturation();
		$lightness = $hsl->lightness();

		$colors = [];

		// Generate color variations based on coefficients
		foreach ($coefficients as $key => $coeff) {
			$newHue = $hue + ($coeff['hue'] ?? 0);
			$newSaturation = min(max($saturation + ($coeff['saturation'] ?? 0), 0), 100);
			$newLightness = min(max($lightness + ($coeff['lightness'] ?? 0), 0), 100);

			$generatedColor = (string) Hsl::fromString("hsl({$newHue}," . round($newSaturation) . "%," . round($newLightness) . "%)")->toHex();

			$colors[$key] = $generatedColor;
		}

		return $colors;
	}

	/**
	 * Determine the best contrast text color for a given background color.
	 *
	 * @param string $color Background color in hex format (e.g., '#012831')
	 *
	 * @return string Either '#222222' for dark text or '#ffffff' for light text
	 */
    public static function ensureContrast(string $color): string {
        // Parse the background color
        $bgColor = Hex::fromString($color);
        $rgb = $bgColor->toRgb();

        // Calculate relative luminance using WCAG formula
        // Convert RGB values to 0-1 range
        $r = $rgb->red() / 255;
        $g = $rgb->green() / 255;
        $b = $rgb->blue() / 255;

        // Apply gamma correction
        $r = ($r <= 0.03928) ? $r / 12.92 : pow(($r + 0.055) / 1.055, 2.4);
        $g = ($g <= 0.03928) ? $g / 12.92 : pow(($g + 0.055) / 1.055, 2.4);
        $b = ($b <= 0.03928) ? $b / 12.92 : pow(($b + 0.055) / 1.055, 2.4);

        // Calculate luminance
        $luminance = 0.2126 * $r + 0.7152 * $g + 0.0722 * $b;

        // Use light text on dark backgrounds, dark text on light backgrounds
        $contrastWithWhite = 1.05 / ($luminance + 0.05);
        $contrastWithBlack = ($luminance + 0.05) / 0.05;

        return $contrastWithWhite > $contrastWithBlack
            ? ColorsConstants::LIGHT
            : ColorsConstants::DARK;
    }
}

