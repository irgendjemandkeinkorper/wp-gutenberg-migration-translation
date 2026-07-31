import * as sass from 'sass';
import path from 'node:path';
import { parseScssMap } from '../parsers/scss-map.parser.mjs';

/**
 * SCSS map extractor
 * Compiles SCSS with sass:meta to extract artifact map data
 */
export async function extractScssMap(sourceDefinition) {
  const { filePath, mapName } = sourceDefinition;
  
  // Resolve the artifact file relative to the config
  const artifactFilePath = path.resolve(filePath);
  const artifactFileDir = path.dirname(artifactFilePath);
  const artifactFileName = path.basename(artifactFilePath);
  
  // Build a temporary SCSS file that uses sass:meta to inspect the map
  const tempScss = `
    @use 'sass:meta';
    @use './${artifactFileName.replace('.scss', '')}' as artifacts;
    
    :root {
      --artifact-data: #{meta.inspect(artifacts.${mapName})};
    }
  `;
  
  try {
    // Compile the temporary SCSS
    const result = sass.compileString(tempScss, {
      loadPaths: [artifactFileDir],
      style: 'expanded',
    });
    
    // Extract the value from the compiled CSS
    const cssContent = result.css;
    const match = cssContent.match(/--artifact-data:\s*(.+?);/);
    
    if (!match) {
      throw new Error(`Could not extract ${mapName} from compiled CSS`);
    }
    
    const inspectOutput = match[1].trim();
    
    // Parse the meta.inspect() output
    const parsedData = parseScssMap(inspectOutput);
    
    return parsedData;
  } catch (error) {
    throw new Error(`Failed to extract SCSS map from ${filePath}: ${error.message}`);
  }
}
