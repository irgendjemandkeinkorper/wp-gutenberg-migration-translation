<?php

add_filter( 'nbcsn_blocks_page_patterns', 'troon_page_patterns' );

function troon_page_patterns( $pattern_array ) {
    $pattern_array['page/home']['type'] = 'theme';

    $pattern_slider = [];
    $pattern_slider['page/home-slider'] = [
        'title'             => __( 'Home Slider', 'troon' ),
        'type'              => 'theme',
        'location'          => 'page/home-slider',
        'args'              => [
            'categories'    => array( 'nbcsn', 'featured', 'slider' ),
            'description'   => __( 'Pattern for Hero Slider', 'troon' ),
            'keywords'      => array( 'hero', 'slider', 'carousel' ),
        ],
    ];

    $pattern_slider['page/contact'] = [
        'title'             => __( 'Contact Page', 'troon' ),
        'type'              => 'theme',
        'location'          => 'page/contact',
        'args'              => [
            'categories'    => array( 'nbcsn', 'featured', 'slider' ),
            'description'   => __( 'Default Troon Contact Us Template', 'troon' ),
            'keywords'      => array( 'hero', 'slider', 'carousel' ),
        ],
    ];

    array_splice( $pattern_array, 1, 0, $pattern_slider );
    

    return $pattern_array;
}

add_filter( 'nbcsn_blocks_patterns', 'troon_patterns' );

function troon_patterns( $pattern_array ) {

    $pattern_array['hero/slider']['type'] = 'theme';
    $pattern_array['hero/slide-1'] = [
        'title'             => __( 'Troon Slide Example 1', 'troon' ),
        'type'              => 'theme',
        'location'          => 'hero/slide-1',
        'args'              => [
            'categories'    => array( 'nbcsn', 'featured', 'slider' ),
            'description'   => __( 'Pattern for Hero Slider', 'troon' ),
            'keywords'      => array( 'hero', 'slider', 'carousel' ),
        ],
    ];
    $pattern_array['hero/slide-2'] = [
        'title'             => __( 'Troon Slide Example 2', 'troon' ),
        'type'              => 'theme',
        'location'          => 'hero/slide-2',
        'args'              => [
            'categories'    => array( 'nbcsn', 'featured', 'slider' ),
            'description'   => __( 'Pattern for Hero Slider', 'troon' ),
            'keywords'      => array( 'hero', 'slider', 'carousel' ),
        ],
    ];
    $pattern_array['hero/slide-3'] = [
        'title'             => __( 'Troon Slide Example 3', 'troon' ),
        'type'              => 'theme',
        'location'          => 'hero/slide-3',
        'args'              => [
            'categories'    => array( 'nbcsn', 'featured', 'slider' ),
            'description'   => __( 'Pattern for Hero Slider', 'troon' ),
            'keywords'      => array( 'hero', 'slider', 'carousel' ),
        ],
    ];

    $pattern_array['pre-built/contact-details'] = [
        'title'             => __( 'Contact Details', 'troon' ),
        'type'              => 'theme',
        'location'          => 'pre-built/contact-details',
        'args'              => [
            'categories'    => array( 'nbcsn', 'featured', 'slider' ),
            'description'   => __( 'Contact Details', 'troon' ),
            'keywords'      => array( 'hero', 'slider', 'carousel' ),
        ],
    ];

    $pattern_array['pre-built/greeting'] = [
        'title'             => __( 'Troon Prebuilt Greeting', 'troon' ),
        'type'              => 'theme',
        'location'          => 'pre-builts/greeting',
        'args'              => [
            'categories'    => array( 'nbcsn', 'featured', 'troon' ),
            'description'   => __( 'Default Page Greeting', 'troon' ),
            'keywords'      => array( 'home', 'troon', 'custom', 'pre-built' ),
        ],
    ];
    $pattern_array['pre-built/promo-grid-image'] = [
        'title'             => __( 'Troon Prebuilt Grid Promo Image', 'troon' ),
        'type'              => 'theme',
        'location'          => 'pre-builts/promo-grid-image',
        'args'              => [
            'categories'    => array( 'nbcsn', 'featured', 'troon' ),
            'description'   => __( 'Promo-tile image grid, single row', 'troon' ),
            'keywords'      => array( 'home', 'troon', 'custom', 'pre-built' ),
        ],
    ];
    $pattern_array['pre-built/promo-grid-text'] = [
        'title'             => __( 'Troon Prebuilt Grid Promo Text', 'troon' ),
        'type'              => 'theme',
        'location'          => 'pre-builts/promo-grid-text',
        'args'              => [
            'categories'    => array( 'nbcsn', 'featured', 'troon' ),
            'description'   => __( 'Promo-tile grid, single row, text only', 'troon' ),
            'keywords'      => array( 'home', 'troon', 'custom', 'pre-built' ),
        ],
    ];
    $pattern_array['pre-built/promo-grid'] = [
        'title'             => __( 'Troon Prebuilt Grid', 'troon' ),
        'type'              => 'theme',
        'location'          => 'pre-builts/promo-grid',
        'args'              => [
            'categories'    => array( 'nbcsn', 'featured', 'troon' ),
            'description'   => __( 'The full 3 X 2 image grid', 'troon' ),
            'keywords'      => array( 'home', 'troon', 'custom', 'pre-built' ),
        ],
    ];
    $pattern_array['pre-built/promo-image'] = [
        'title'             => __( 'Troon Prebuilt Singular Promo Image', 'troon' ),
        'type'              => 'theme',
        'location'          => 'pre-builts/promo-image',
        'args'              => [
            'categories'    => array( 'nbcsn', 'featured', 'troon' ),
            'description'   => __( 'A pre-built image pattern to be inserted into the promo-image-grid', 'troon' ),
            'keywords'      => array( 'home', 'troon', 'custom', 'pre-built' ),
        ],
    ];
    $pattern_array['pre-built/promo-text'] = [
        'title'             => __( 'Troon Prebuilt Singular Promo Text', 'troon' ),
        'type'              => 'theme',
        'location'          => 'pre-builts/promo-text',
        'args'              => [
            'categories'    => array( 'nbcsn', 'featured', 'troon' ),
            'description'   => __( 'A pre-built text pattern to be inserted into the promo-text-grid', 'troon' ),
            'keywords'      => array( 'home', 'troon', 'custom', 'pre-built' ),
        ],
    ];
    $pattern_array['pre-built/signup'] = [
        'title'             => __( 'Troon Prebuilt Signup', 'troon' ),
        'type'              => 'theme',
        'location'          => 'pre-builts/signup',
        'args'              => [
            'categories'    => array( 'nbcsn', 'featured', 'troon' ),
            'description'   => __( 'Newletter Signup default pattern', 'troon' ),
            'keywords'      => array( 'home', 'troon', 'custom', 'pre-built' ),
        ],
    ];


    return $pattern_array;
}

add_action( 'init', 'register_troon_pattern_category' );

function register_troon_pattern_category() {

    register_block_pattern_category(
        'troon',
        array( 'label' => __( 'Pre-built Troon Patterns', 'troon' ) )
    );
}
