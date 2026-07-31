import fs from 'node:fs/promises';

export async function extractScssColorTokens(filePath) {
    const scss = await fs.readFile(filePath, 'utf8');
    const match = scss.match(/\$cet-theme-colors:\s*\(([\s\S]*?)\);/);

    if (!match) {
        return {};
    }

    const tokens = {};
    const colorRegex = /"([^"]+)"\s*:\s*(#[a-fA-F0-9]{3,8})\s*,?/g;

    let colorMatch;

    while ((colorMatch = colorRegex.exec(match[1])) !== null) {
        tokens[colorMatch[1]] = colorMatch[2];
    }

    return tokens;
}