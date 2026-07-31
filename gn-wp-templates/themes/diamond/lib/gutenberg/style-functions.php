<?php

/**
 * Generate CSS for editor font sizes from the provided theme support.
 *
 * @since 2.9.0
 *
 * @return string The CSS for editor font sizes if theme support was declared.
 */
function diamond_inline_font_sizes() {

	$css               = '';
	$editor_font_sizes = get_theme_support( 'editor-font-sizes' );

	if ( ! $editor_font_sizes ) {
		return '';
	}

	foreach ( $editor_font_sizes[0] as $font_size ) {
		$css .= <<<CSS
        .site-container .has-{$font_size['slug']}-font-size {
            font-size: {$font_size['size']}rem;
        }
        CSS;
	}

	return $css;

}

/**
 * Generate CSS for editor colors based on theme color palette support.
 *
 * @since 1.0.0
 *
 * @return string The editor colors CSS if `editor-color-palette` theme support was declared.
 */
function diamond_inline_color_palette() {

    $css                  = '';
    $appearance           = genesis_get_config( 'appearance' );
    $editor_color_palette = $appearance['editor-color-palette'];

    foreach ( $editor_color_palette as $color_info ) {
        $css .= <<<CSS
        .has-{$color_info['slug']}-background-color {
            background: {$color_info['color']};
            color: {$color_info['contrast']};
        }

        hr.has-{$color_info['slug']}-background-color.wp-block-separator {
            color: {$color_info['color']};
        }
        CSS;
    }

    return $css;
}


function diamond_inline_gradient_palette() {

    $css					 = '';
    $appearance				 = genesis_get_config( 'appearance' );
    $editor_gradient_presets = $appearance['editor-gradient-presets'];

    foreach ( $editor_gradient_presets as $color_info ) {
        $css .= <<<CSS
        .has-{$color_info['slug']}-background-color {
            background: {$color_info['gradient']};
        }
        CSS;
    }

    return $css;
}

function diamond_inline_color_palette_root() {

    $root_format .= ":root { %s }";
    $root_palette .= [];
    $appearance           = genesis_get_config( 'appearance' );
    $font_selection       = get_theme_mod( 'diamond_font_select', $appearance['default-font'] );
    $editor_color_palette = $appearance['editor-color-palette'];

    array_push( $root_palette, <<<CSS
    --theme-font: {$appearance['font-names'][$font_selection]};
    CSS );

    foreach ( $editor_color_palette as $color_info ) {
        array_push( $root_palette, <<<CSS
        --theme-{$color_info['slug']}: {$color['info']};
        CSS );
    }

    

    return sprintf( $root_format, implode( "", $root_palette ) );
}

/**
 * Generate CSS for editor colors based on theme color palette support.
 *
 * @since 1.0.0
 *
 * @return string The editor colors CSS if `editor-color-palette` theme support was declared.
 */
function diamond_editor_inline_color_palette() {

	$css                  = '';
    $root_format = "%s";
    $root_palette = [];
	$appearance           = genesis_get_config( 'appearance' );
	$editor_color_palette = $appearance['editor-color-palette'];
    $font_selection       = get_theme_mod( 'diamond_font_select', $appearance['default-font'] );

    array_push( $root_palette, <<<CSS
    --theme-font: {$appearance['font-names'][$font_selection]};
    CSS );

	foreach ( $editor_color_palette as $color_info ) {
		$css .= <<<CSS
        .has-{$color_info['slug']}-color {
            color: {$color_info['color']};
        }

        .has-{$color_info['slug']}-color:visited {
            color: {$color_info['color']};
        }
        CSS;

        $color_name = str_replace( "theme-", "", $color_info['slug'] );

        array_push(
            $root_palette, 
            "--theme-{$color_name}: {$color_info['color']};"
        );

        if ( array_key_exists( 'contrast', $color_info ) ) {
            array_push(
                $root_palette, 
                "--theme-{$color_name}-contrast: {$color_info['contrast']};"
            );
        }

        if ( array_key_exists( 'brighter', $color_info ) ) {
            array_push(
                $root_palette, 
                "--theme-{$color_name}-brighter: {$color_info['brighter']};"
            );
        }
	}

    $theme_colors = sprintf( $root_format, implode( " ", $root_palette ) );

    $css .= <<<CSS
        :root {
            {$theme_colors}
        }
    CSS;

	return $css;

}