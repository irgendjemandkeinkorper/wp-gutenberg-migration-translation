import fs from 'node:fs/promises';

function normalizeHex(hex) {
    const value = hex.trim().toLowerCase();

    if (value.length === 4) {
        return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`;
    }

    return value;
}

function hexToRgb(hex) {
    const normalized = normalizeHex(hex).replace('#', '');

    return {
        r: Number.parseInt(normalized.slice(0, 2), 16),
        g: Number.parseInt(normalized.slice(2, 4), 16),
        b: Number.parseInt(normalized.slice(4, 6), 16),
    };
}

function srgbToLinear(channel) {
    const normalized = channel / 255;

    return normalized <= 0.03928
        ? normalized / 12.92
        : ((normalized + 0.055) / 1.055) ** 2.4;
}

function getRelativeLuminance(hex) {
    const { r, g, b } = hexToRgb(hex);

    return 0.2126 * srgbToLinear(r)
        + 0.7152 * srgbToLinear(g)
        + 0.0722 * srgbToLinear(b);
}

function getContrastColor(hex) {
    const luminance = getRelativeLuminance(hex);
    const contrastWithWhite = 1.05 / (luminance + 0.05);
    const contrastWithBlack = (luminance + 0.05) / 0.05;

    return contrastWithWhite > contrastWithBlack
        ? 'var(--cet-theme-white)'
        : 'var(--cet-theme-black)';
}

function buildEditorContrastRules(tokens, palette = []) {
    const paletteRules = palette
        .filter((item) => item?.slug && item.slug !== 'transparent' && tokens[item.slug])
        .map((item) => {
            const contrastColor = getContrastColor(tokens[item.slug]);

            return `
.editor-styles-wrapper .has-${item.slug}-background-color {
  color: ${contrastColor};
}

.editor-styles-wrapper .has-${item.slug}-background-color :where(h1, h2, h3, h4, h5, h6, p, li, a):not(.has-text-color) {
  color: inherit;
}`;
        })
        .join('\n');

    return paletteRules ? `\n${paletteRules}\n` : '\n';
}

export async function writeEditorColorTokensTarget(targetConfig, tokens, palette = [], options = {}) {
    const { outputFilePath } = targetConfig;
    const { check = false } = options;

    const css = `:root{${Object.entries(tokens)
        .map(([slug, color]) => `--cet-theme-${slug}:${color};`)
        .join('')}}${buildEditorContrastRules(tokens, palette)}`;

    if (check) {
        try {
            const currentContent = await fs.readFile(outputFilePath, 'utf8');

            if (currentContent !== css) {
                throw new Error(
                    `Editor color tokens are out of date. Run 'npm run generate:theme-json-artifacts'.`
                );
            }

            console.log('✓ editor color tokens are up to date');
            return;
        } catch (error) {
            if (error.code === 'ENOENT') {
                throw new Error(
                    `Editor color tokens are missing. Run 'npm run generate:theme-json-artifacts'.`
                );
            }

            throw error;
        }
    }

    await fs.mkdir(new URL('.', `file://${outputFilePath}`).pathname, { recursive: true });
    await fs.writeFile(outputFilePath, css, 'utf8');

    console.log(`✓ Generated editor color tokens at ${outputFilePath}`);
}
