export function generateColorsThemeJsonSection(colorsConfig) {
	return {
		settings: {
			color: {
				defaultPalette: false,
				custom: false,
				palette: colorsConfig.palette || [],
			},
		},
	};
}