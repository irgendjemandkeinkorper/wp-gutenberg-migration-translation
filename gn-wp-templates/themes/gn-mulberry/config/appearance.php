<?php
/**
 * GolfNow - Mulberry appearance settings.
 *
 * @package GolfNow - Mulberry
 * @author  NBCU Sports Next
 * @license GPL-2.0-or-later
 * @link    https://business.golfnow.com/Website-Theme-Library/
 */

// Because we're going to see if this was generated already, we can't use this file unless the plugin is enabled
// This is just for safety so that certain features aren't available unless the NBCSN Basic Frameworks Plugin is enabled 
if ( !class_exists('NBCSNFrameworksCompartment') ) {
    return;
}

// Protect from function redeclarations due to the way this file is accessed a lot
if ( !function_exists( 'theme_build_theme_appearance' ) ) {
    function theme_build_theme_appearance() {
        //  Everything should be generated automatically.

        $theme_appearance_default_colors = [
            'primary'   => [
                'color'         => '#4c0121',
                'description'   => __( 'The main color to be used on the site.', 'gn-mulberry' ),
                'label'         => __( 'Primary Color', 'gn-mulberry' ),
            ],
            'secondary' => [
                'color'         => '#525C7B',
                'description'   => __( 'The accent color to be used on the site', 'gn-mulberry' ),
                'label'         =>__( 'Secondary Color', 'gn-mulberry' ),
            ],
        ];
    
        $theme_appearance_default_contrasts = [
            'white'                 => '#ffffff',
            'light'                 => '#f8f9fa',
            'dark'                  => '#212529',
            'black'                 => '#000000',
        ];
    
        $theme_appearance_default_color_selection  = [
            'topbar'                => 'black',
            'navbar'                => 'black',
            'body'                  => 'white',
            'footer'                => 'secondary',
        ];

        // I want designers who expand on this theme to only have to update one location
        // In order to get more colors So I'm going to use a few for loops and a few arrays
        // To accomplish some automatic boilerplating
        $theme_appearance_colors = [];
        foreach ( $theme_appearance_default_colors as $appearance_color_name => $appearance_color_value ) {
            array_push(
                $theme_appearance_colors,
                [
                    'name'      => $appearance_color_name,
                    'selection' => get_theme_mod(
                        'theme_appearance_' . $appearance_color_name . '_color',
                        $appearance_color_value['color']
                    )
                ]
            );
        }

        $theme_appearance_font_selection = get_theme_mod(
            'theme_appearance_font_selection',
            'open-sans'
        );

        // Theme Filters
        $theme_appearance_contrasts_array           = apply_filters(
            'nbcsn_framework_contrasts',
            [ 'default-contrasts' => $theme_appearance_default_contrasts ],
        );

        $theme_appearance_colors_selection_array    = apply_filters(
            'nbcsn_framework_colors_selection',
            $theme_appearance_default_color_selection
        );

        $theme_appearance_color_selection_keys = array_keys( $theme_appearance_colors_selection_array );

        // I want to add the contrasts to this array here
        foreach( $theme_appearance_default_contrasts as $appearance_contrast_name => $appearance_contrast_value ) {
            array_push(
                $theme_appearance_colors,
                [
                    'name'      => $appearance_contrast_name,
                    'selection' => $appearance_contrast_value,
                ]
            );
        }

        $theme_appearance_colors_array = [];
        foreach( $theme_appearance_colors as $theme_appearance_color ) {
            $theme_appearance_colors_array          = array_merge( 
                $theme_appearance_colors_array, 
                apply_filters(
                    'nbcsn_framework_colors',
                    [ 'color' => $theme_appearance_color['selection'] ],
                    [
                        'name'      => $theme_appearance_color['name'],
                        'contrasts' => $theme_appearance_default_contrasts
                    ]
                ) 
            );
        }
    
        $theme_appearance_colors_palette                = apply_filters(
            'nbcsn_framework_colors_palette',
            [ 'editor-color-palette'  => [] ],
            [
                'colors_array'        => $theme_appearance_colors_array,
            ],
        );
        
        $theme_appearance_fonts                         = apply_filters(
            'nbcsn_framework_fonts',
            [ 'fonts'           => [
                'open-sans'     => [
                    'name'      => "Open Sans",
                    'css'       => "'Open Sans'",
                    'url'       => 'Open+Sans:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400;1,700',
                    'url_base'  => 'google',
                ],
                'crimson-text'     => [
                    'name'      => "Crimson Text",
                    'css'       => "'Crimson Text'",
                    'url'       => 'Crimson+Text:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700',
                    'url_base'  => 'google',
                ],
            ] ],
        );
    
        $theme_appearance_font_urls                     = apply_filters(
            'nbcsn_framework_font_urls',
            [ 'google' => 'https://fonts.googleapis.com/css2?family=' ],
        );

        // Appearance variable simplification
        $theme_appearance_selected_font_details = $theme_appearance_fonts['fonts'][$theme_appearance_font_selection];
        
        // Appearance Array
        $appearance = [
            'default-font'              => 'open-sans',
            'default-header-image'      => 'https://vip.teeitup.com/gn-basic/wp-content/uploads/sites/8604/2023/07/header-image.jpg',
            'fonts'                     => $theme_appearance_fonts,
            'font-selection'            => $theme_appearance_font_selection,
            'font-urls'                 => $theme_appearance_font_urls,
            'selected_font_details'     => $theme_appearance_selected_font_details,
            'fonts-url-base'            => $theme_appearance_font_urls[$theme_appearance_selected_font_details['url_base']],
            'fonts-url-selction'        => $theme_appearance_selected_font_details['url'],
            'fonts-url'                 => $theme_appearance_font_urls[$theme_appearance_selected_font_details['url_base']] . $theme_appearance_selected_font_details['url'] . '&display=swap',
            'content-width'             => 1170,
            'default-colors'            => $theme_appearance_default_colors,
            'color_selection_keys'      => $theme_appearance_color_selection_keys,
            // Sizes are in rem units
            'editor-font-sizes'    => [
                [
                    'name' => __( 'Smaller', 'gn-mulberry' ),
                    'size' => 12,
                    'slug' => 'smaller',
                ],
                [
                    'name' => __( 'Small', 'gn-mulberry' ),
                    'size' => 14,
                    'slug' => 'small',
                ],
                [
                    'name' => __( 'Normal', 'gn-mulberry' ),
                    'size' => 16,
                    'slug' => 'normal',
                ],
                [
                    'name' => __( 'h4', 'gn-mulberry' ),
                    'size' => 18,
                    'slug' => 'h4',
                ],
                [
                    'name' => __( 'h3', 'gn-mulberry' ),
                    'size' => 22,
                    'slug' => 'h3',
                ],
                [
                    'name' => __( 'h2', 'gn-mulberry' ),
                    'size' => 28,
                    'slug' => 'h2',
                ],
                [
                    'name' => __( 'h1', 'gn-mulberry' ),
                    'size' => 38,
                    'slug' => 'h1',
                ],
                [
                    'name' => __( 'Display 3', 'gn-mulberry' ),
                    'size' => 48,
                    'slug' => 'display-3',
                ],
                [
                    'name' => __( 'Display 2', 'gn-mulberry' ),
                    'size' => 55,
                    'slug' => 'display-2',
                ],
                [
                    'name' => __( 'Display 1', 'gn-mulberry' ),
                    'size' => 60,
                    'slug' => 'display-1',
                ],
            ],
        ];

        // Merge everything together that needs to be together
        $appearance_array = array_merge(
            $appearance,
            $theme_appearance_fonts,
            $theme_appearance_colors_array,
            $theme_appearance_colors_palette,
            $theme_appearance_colors_selection_array,
            $theme_appearance_contrasts_array,
        );
    
        NBCSNFrameworksCompartment::set( "appearance", $appearance_array );
    }
}

if ( !NBCSNFrameworksCompartment::get( "appearance" ) ) {
    theme_build_theme_appearance();
}

list( 'font-selection' => $theme_appearance_font_selection, 'default-colors' => $theme_appearance_default_colors ) = NBCSNFrameworksCompartment::get( "appearance" );
$theme_appearance_colors_same = false;

foreach ( $theme_appearance_default_colors as $default_color => $color_details ) {
    if ( $color_details[ 'color' ] !== get_theme_mod( 'theme_appearance_' . $default_color . '_color' ) ) {
        $theme_appearance_colors_same = true;
    }
}

if ( 
    $theme_appearance_font_selection !== get_theme_mod( 'theme_appearance_font_selection' ) ||
    $theme_appearance_colors_same
) {
    theme_build_theme_appearance();
}

return NBCSNFrameworksCompartment::get( "appearance" );