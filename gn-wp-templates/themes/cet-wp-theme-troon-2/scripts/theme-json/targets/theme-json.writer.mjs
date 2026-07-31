import fs from 'node:fs/promises';
import { deepMerge } from '../utils/deep-merge.mjs';

/**
 * Theme.json writer
 * Reads existing theme.json (if present), merges generated sections, and writes output
 */
export async function writeThemeJsonTarget(targetConfig, generatedSections, options = {}) {
  const { outputFilePath } = targetConfig;
  const { check = false } = options;
  
  // Start with base structure
  let themeJson = {
    $schema: 'https://schemas.wp.org/trunk/theme.json',
    version: 3,
  };
  
  // Read existing theme.json if present
  try {
    const existingContent = await fs.readFile(outputFilePath, 'utf-8');
    const existingJson = JSON.parse(existingContent);
    themeJson = { ...themeJson, ...existingJson };
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw new Error(`Failed to read existing theme.json: ${error.message}`);
    }
    // File doesn't exist, use base structure
  }
  
  // Deep merge all generated sections
  for (const section of generatedSections) {
    themeJson = deepMerge(themeJson, section);
  }
  
  // Format output
  const output = JSON.stringify(themeJson, null, 2) + '\n';
  
  // Check mode: compare with existing file
  if (check) {
    try {
      const currentContent = await fs.readFile(outputFilePath, 'utf-8');
      if (currentContent !== output) {
        throw new Error(
          `theme.json is out of date. Run 'npm run generate:theme-json-artifacts' to update it.`
        );
      }
      console.log('✓ theme.json is up to date');
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(
          `theme.json is missing. Run 'npm run generate:theme-json-artifacts' to generate it.`
        );
      }
      throw error;
    }
    return;
  }
  
  // Write mode: save the file
  await fs.writeFile(outputFilePath, output, 'utf-8');
  console.log(`✓ Generated theme.json at ${outputFilePath}`);
}
