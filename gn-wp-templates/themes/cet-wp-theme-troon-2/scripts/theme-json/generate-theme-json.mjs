import config from './artifacts.config.mjs';
import { extractScssMap } from './extractors/scss-map.extractor.mjs';
import { generateTypographyThemeJsonSection } from './generators/typography.generator.mjs';
import { generateColorsThemeJsonSection } from './generators/colors.generator.mjs';
import { writeThemeJsonTarget } from './targets/theme-json.writer.mjs';
import { extractScssColorTokens } from './extractors/scss-colors.extractor.mjs';
import { writeEditorColorTokensTarget } from './targets/editor-color-tokens.writer.mjs';

async function run() {
	const check = process.argv.includes('--check');

	console.log(check ? 'Checking theme.json...' : 'Generating theme.json...');

	const typographyTokenData = await extractScssMap(config.sources.typography);
	const colorsTokenData = await extractScssMap(config.sources.colors);
	const colorTokens = await extractScssColorTokens(config.sources.colorTokens.filePath);
	const themeJsonTypographySection = generateTypographyThemeJsonSection(typographyTokenData);
	const themeJsonColorsSection = generateColorsThemeJsonSection(colorsTokenData);

	await writeEditorColorTokensTarget(
		config.targets.editorColorTokens,
		colorTokens,
		themeJsonColorsSection.settings.color.palette,
		{ check }

	);

	await writeThemeJsonTarget(
		config.targets.themeJson,
		[
			themeJsonTypographySection,
			themeJsonColorsSection,
		],
		{ check }
	);

	if (!check) {
		console.log('✓ Theme.json artifacts generated successfully');
	}
}

run().catch((error) => {
	console.error('✗ Error:', error.message);
	process.exit(1);
});
