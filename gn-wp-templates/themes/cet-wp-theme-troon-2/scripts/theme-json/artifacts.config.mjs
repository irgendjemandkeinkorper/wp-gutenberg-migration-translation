import path from 'node:path';

const rootDirectoryPath = process.cwd();

export default {
  rootDirectoryPath,
  sources: {
    typography: {
      type: 'scss-map',
      filePath: path.join(rootDirectoryPath, 'sass/base/typography/_typography.artifacts.scss'),
      mapName: '$artifact-typography',
    },
    colors: {
      type: 'scss-map',
      filePath: path.join(rootDirectoryPath, 'sass/base/colors/_colors.artifacts.scss'),
      mapName: '$artifact-colors',
    },
    colorTokens: {
      type: 'scss-color-map',
      filePath: path.join(rootDirectoryPath, 'sass/abstracts/variables/_colors.scss'),
      mapName: '$cet-theme-colors',
    },
  },

  targets: {
    themeJson: {
      outputFilePath: path.join(rootDirectoryPath, 'theme.json'),
      generators: ['typography', 'colors'],
    },
    editorColorTokens: {
      outputFilePath: path.join(rootDirectoryPath, 'inc/generated/editor-color-tokens.css'),
    },
  },
};
