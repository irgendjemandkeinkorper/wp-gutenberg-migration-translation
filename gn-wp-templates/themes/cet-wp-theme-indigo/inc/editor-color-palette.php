<?php

function indigo_setup_editor_color_palette() {
    // Array of black and white
    $palette_colors = [
        [
            'name' => __('Theme Black', 'cet-wp-theme-indigo'),
            'slug' => 'indigo_palette_black',
            'color' => '#000'
        ],
        [
            'name' => __('Theme White','cet-wp-theme-indigo'),
            'slug' => 'indigo_palette_white',
            'color' => '#FFF'
        ]
    ];

    // Array from customizer
    $palette_colors[] = [
        'name' => __('Theme Primary', 'cet-wp-theme-indigo'),
        'slug' => 'indigo_palette_primary_color',
        'color' => get_theme_mod('primary_color', '#000')
    ];

    $palette_colors[] = [
        'name' => __('Theme Secondary', 'cet-wp-theme-indigo'),
        'slug' => 'indigo_palette_secondary_color',
        'color' => get_theme_mod('secondary_color','#FFF') 
    ];


    add_theme_support('editor-color-palette', $palette_colors);
}

add_action('after_setup_theme','indigo_setup_editor_color_palette');