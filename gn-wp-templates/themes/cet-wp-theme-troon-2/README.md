# Troon 2.0 Theme — Developer Guide

## Scripts Directory

This directory is preserved for future build scripts or tooling.

Current build uses:
- `sass` (SCSS compilation)
- `rtlcss` (RTL CSS generation)
- `wp-scripts` (WordPress tooling for linting)

See `package.json` for active build scripts.

## Overview

Theme is built using **design tokens + generators** approach.

- SCSS maps → single source of truth
- CSS tokens (`--cet-theme-*`) → used across all styles
- Generators → build `theme.json` and editor UI tokens
- CSS is structured with `@layer`

### CSS Layers

- `tokens` → global variables (`:root`)
- `base` → element defaults
- `components` → UI blocks
- `utilities` → helpers

---

## Project Structure

```
sass/
  abstracts/variables/   → tokens (colors, typography)
  base/                  → base styles + artifacts
  components/            → components
  utilities/             → helpers

scripts/theme-json/      → generators + extractors

inc/                     → PHP integrations
inc/generated/           → generated files

theme.json               → Gutenberg config
```

---

## Color System

### Source of truth

```
sass/abstracts/variables/_colors.scss
```

---

### CSS Tokens

Generated as:

```
--cet-theme-{color}
```

Usage:

```css
color: var(--cet-theme-primary-teal);
```

---

### Gutenberg Palette

Generated from:

```
sass/base/_colors.artifacts.scss
```

→ Output:

```
theme.json
```

---

### Editor UI (Important)

Gutenberg sidebar **does not resolve CSS variables from editor.css**.

Fix:

- Generated file:
```
inc/generated/editor-color-tokens.css
```

- Injected via:
```php
wp_add_inline_style('wp-edit-blocks', $css);
```

---

## theme.json — Generated Artifact

**`theme.json` is a generated file. Do not edit `settings.*` sections by hand — they will be overwritten.**

### What is generated

| Section | Source |
|---|---|
| `settings.typography` | `sass/base/typography/_typography.artifacts.scss` |
| `settings.color` | `sass/base/colors/_colors.artifacts.scss` |

### What can be edited directly

`styles.*` is **not touched by any generator**. The writer reads the existing `theme.json` first and only deep-merges the generated `settings.*` sections on top, so any `styles.*` entries survive regeneration.

Example — safe to edit directly:

```json
"styles": {
    "elements": {
        "link": {
            "typography": {
                "textDecoration": "var(--cet-theme-link-text-decoration, underline)"
            }
        }
    }
}
```

If a future generator needs to write to `styles.*`, declare it as a source in `scripts/theme-json/artifacts.config.mjs` and add a generator/writer — do not add it as a manual edit.

### Generation Flow

```
_typography.artifacts.scss  _colors.artifacts.scss
         ↓                          ↓
   Node extractor              Node extractor
         ↓                          ↓
 settings.typography          settings.color
              ↘               ↙
         deepMerge over existing theme.json
                    ↓
                theme.json
```

### Check mode

Verify the file is up to date without writing:

```bash
npm run check:theme-json-artifacts
```

---

## Commands

Run after any changes to tokens:

```bash
npm run generate:theme-json-artifacts
npm run build
```

---

## Adding / Updating Colors

1. Update:
```
sass/abstracts/variables/_colors.scss
```

2. Update artifacts:
```
sass/base/_colors.artifacts.scss
```

3. Regenerate:
```bash
npm run generate:theme-json-artifacts
npm run build
```

---

## Typography System

- Fonts:
  - Primary → Urbanist
  - Secondary → Libre Baskerville

- Tokens:
```
--cet-theme-heading-*
--cet-theme-paragraph-*
--cet-theme-caption-*
```

- Gutenberg font sizes mapped via `theme.json`

---

## Rules

- No hardcoded colors or font sizes
- No tokens defined in PHP manually
- Use CSS variables
- SCSS maps = single source of truth
- Always regenerate artifacts after changes

---

## Debug Tips

Check token:

```js
getComputedStyle(document.documentElement)
  .getPropertyValue('--cet-theme-primary-teal')
```

Check theme.json:

```bash
grep primary-teal theme.json
```

Check generated tokens:

```
inc/generated/editor-color-tokens.css
```

## SVG Icons Sprite

The theme uses SVG sprite generation based on the implementation from
`cet-wp-theme-base` and `cet-wp-theme-golfnow-business`.

### Generate sprite

Run:

```bash
npm run build-icons-sprite
```

SVG icons should be placed in:

```txt
images/icons/
```

Generated sprite files are stored in:

```txt
build/sprite/svg/
```

### Render icon in PHP

Example:

```php
echo \Cet\Theme\Troon2\Svg\SpriteManager::getRenderedSvg( 'icon-x-icon' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
```

### Feature flag

All icon-related functionality is controlled by:

```php
CET_TROON_2_ENABLE_ICONS
```

The flag is disabled by default.

### Gutenberg toolbar

When the feature flag is enabled, the editor loads the icon toolbar
(`rich-text-insert-icon-format-toolbar.js`) which allows inserting icons into RichText blocks.

### Adding new icons

1. Add SVG file to:

```txt
images/icons/
```

2. Run:

```bash
npm run build-icons-sprite
```

3. Use generated icon ID:

```txt
icon-{filename}
```

Example:

```txt
x-icon.svg → icon-x-icon
```


## Content Layout Primitives & Block Contracts

The theme includes a config-driven block contract system for Gutenberg layouts.

The goal is to provide stable, project-owned layout and identity contracts instead of relying directly on WordPress-generated `wp-block-*` classes.

### Layout Containers

Three layout container types are supported:

- `container`
  - Standard content container
  - Uses:
  ```css
  --cet-theme-container-max-width
  ```

- `narrow-container`
  - Helper container for centered/narrow content areas
  - Uses:
  ```css
  --cet-theme-container-narrow-width
  ```

- `full-bleed`
  - Full viewport width sections
  - Used for hero/cover/background sections

---

### Layout Tokens

Defined in theme tokens:

```css
--cet-theme-container-max-width
--cet-theme-container-padding-inline
--cet-theme-container-narrow-width

--cet-theme-vertical-section-spacing-sm
--cet-theme-vertical-section-spacing-md
--cet-theme-vertical-section-spacing-lg
```

---

### Block Contracts

Rendered Gutenberg blocks receive stable project-owned classes and data attributes.

Top-level section blocks:

```html
<div
  class="cet-block cet-block-type-group -has-container -has-section-spacing-md"
  data-cet-block="group"
  data-cet-block-container="container"
  data-cet-block-spacing="md"
>
```

Nested content/layout blocks:

```html
<h2
  class="cet-block-part cet-block-part-type-heading"
  data-cet-block-part="heading"
>
```

---

### Config

Contracts are configured in:

```txt
inc/block-contracts.php
```

Example:

```php
return [
  'section_blocks' => [
    'core/group' => [
      'enabled'   => true,
      'type'      => 'group',
      'container' => 'container',
      'spacing'   => 'md',
    ],

    'core/cover' => [
      'enabled'   => true,
      'type'      => 'cover',
      'container' => 'full-bleed',
      'spacing'   => 'lg',
    ],
  ],
];
```

---

### Rendering Flow

Contracts are resolved via:

- `render_block_data`
- `render_block`
- `WP_HTML_Tag_Processor`

Implementation lives in:

```txt
classes/Blocks/BlockContracts.php
```

---

### Important Notes

- Layout behavior should remain block-owned
- Avoid styling directly against `wp-block-*` classes
- Use `cet-*` contracts for CSS/JS targeting
- Nested blocks should use `cet-block-part-*`
- Top-level section blocks should use `cet-block-*`
- Full-width sections should use `full-bleed`
- Narrow layouts should explicitly use `narrow-container`