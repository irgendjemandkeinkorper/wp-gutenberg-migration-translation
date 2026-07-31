/**
 * Typography generator
 * Transforms normalized typography config into theme.json structure
 */
export function generateTypographyThemeJsonSection(typographyConfig) {
	return {
		settings: {
			typography: {
				defaultFontSizes: false,
				customFontSize: true,
				fontSizes: typographyConfig.fontSizes || [],
				fontFamilies: typographyConfig.fontFamilies || [],
			},
		},
	};
}
