<?php
/**
 * Color tokens controller for the Troon 2 theme.
 *
 * @package cet-wp-theme-troon-2
 */

namespace Cet\Theme\Troon2\Colors;

/**
 * Controller for generating and caching color token CSS.
 */
class ColorTokensController {

	private const CACHE_KEY        = 'cet_color_tokens_css';
	private const CACHE_EXPIRATION = DAY_IN_SECONDS;

	/**
	 * Get the color tokens CSS, using cache when available.
	 *
	 * @param string $selector CSS selector to scope tokens to.
	 * @return string CSS string with color token definitions.
	 */
	public function getColorTokensCss( string $selector = ':root' ): string {
		// TODO: Re-enable cache after primary/secondary color rename is deployed and stale transients expire.
		return $this->generateColorTokensCss(
			$this->getPrimaryColor(),
			$this->getSecondaryColor(),
			$selector
		);
	}

	/**
	 * Clear all color token caches.
	 * Called when colors are updated in the customizer.
	 */
	public function clearCache(): void {
		delete_transient( self::CACHE_KEY );
	}

	/**
	 * Get the primary color from theme mod.
	 *
	 * @return string Sanitized hex color
	 */
	private function getPrimaryColor(): string {
		$color = sanitize_hex_color( get_theme_mod( 'cet_colors_primarycolor', ColorsConstants::PRIMARY ) );
		return $color ?: ColorsConstants::PRIMARY;
	}

	/**
	 * Get the secondary color from theme mod.
	 *
	 * @return string Sanitized hex color
	 */
	private function getSecondaryColor(): string {
		$color = sanitize_hex_color( get_theme_mod( 'cet_colors_secondarycolor', ColorsConstants::SECONDARY ) );
		return $color ?: ColorsConstants::SECONDARY;
	}

	/**
	 * Generate the complete CSS with color tokens.
	 *
	 * @param string $primary_color Primary color hex.
	 * @param string $secondary_color Secondary color hex.
	 * @param string $selector CSS selector to scope tokens to.
	 * @return string CSS string.
	 */
	private function generateColorTokensCss( string $primary_color, string $secondary_color, string $selector = ':root' ): string {
		$primary_palette   = $this->generatePrimaryPalette( $primary_color );
		$secondary_palette = $this->generateSecondaryPalette( $secondary_color );

		$primary_contrast   = ColorsHandler::ensureContrast( $primary_color );
		$secondary_contrast = ColorsHandler::ensureContrast( $secondary_color );

		// Calculate contrast for each palette variation.
		$primary_palette_contrast = [];
		foreach ( $primary_palette as $key => $color ) {
			$primary_palette_contrast[ $key ] = ColorsHandler::ensureContrast( $color );
		}

		$secondary_palette_contrast = [];
		foreach ( $secondary_palette as $key => $color ) {
			$secondary_palette_contrast[ $key ] = ColorsHandler::ensureContrast( $color );
		}

		$css = "{$selector}{\n";

		// Primary color and palette.
		$css .= "  --cet-theme-gold-main: {$primary_color};\n";
		$css .= "  --cet-theme-primary-contrast: {$primary_contrast};\n";
		$css .= "  --cet-theme-gold-400: {$primary_palette['400']};\n";
		$css .= "  --cet-theme-gold-400-contrast: {$primary_palette_contrast['400']};\n";
		$css .= "  --cet-theme-gold-300: {$primary_palette['300']};\n";
		$css .= "  --cet-theme-gold-300-contrast: {$primary_palette_contrast['300']};\n";
		$css .= "  --cet-theme-gold-200: {$primary_palette['200']};\n";
		$css .= "  --cet-theme-gold-200-contrast: {$primary_palette_contrast['200']};\n";
		$css .= "  --cet-theme-gold-100: {$primary_palette['100']};\n";
		$css .= "  --cet-theme-gold-100-contrast: {$primary_palette_contrast['100']};\n";

		// Secondary color and palette.
		$css .= "  --cet-theme-primary-teal: {$secondary_color};\n";
		$css .= "  --cet-theme-secondary-contrast: {$secondary_contrast};\n";
		$css .= "  --cet-theme-teal-400: {$secondary_palette['400']};\n";
		$css .= "  --cet-theme-teal-400-contrast: {$secondary_palette_contrast['400']};\n";
		$css .= "  --cet-theme-teal-300: {$secondary_palette['300']};\n";
		$css .= "  --cet-theme-teal-300-contrast: {$secondary_palette_contrast['300']};\n";
		$css .= '}';

		return $css;
	}

	/**
	 * Generate primary color palette.
	 *
	 * @param string $primary_color Primary color hex.
	 * @return array Color palette
	 */
	private function generatePrimaryPalette( string $primary_color ): array {
		$is_primary_custom = ( ColorsConstants::PRIMARY !== $primary_color );

		if ( $is_primary_custom ) {
			return ColorsHandler::generatePalette( $primary_color, ColorsConstants::$primary_coefficients );
		}

		return ColorsConstants::$primary_default_palette;
	}

	/**
	 * Generate secondary color palette.
	 *
	 * @param string $secondary_color Secondary color hex.
	 * @return array Color palette
	 */
	private function generateSecondaryPalette( string $secondary_color ): array {
		$is_secondary_custom = ( ColorsConstants::SECONDARY !== $secondary_color );

		if ( $is_secondary_custom ) {
			return ColorsHandler::generatePalette( $secondary_color, ColorsConstants::$secondary_coefficients );
		}

		return ColorsConstants::$secondary_default_palette;
	}
}
