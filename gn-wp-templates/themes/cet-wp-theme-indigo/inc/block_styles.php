<?php

function add_block_indigo_styles() {
    $group_block_list = [
        [
            'name'  => 'text-image',
            'label' => 'Text + Image'
        ],
        [
            'name'  => 'text-image-center',
            'label' => 'Text + Image (Center)'
        ],
        [
            'name' => 'factoids',
            'label' => 'Factoids'
        ],
        [
            'name' => 'image-grid',
            'label' => 'Image Grid'
        ],
        [
            'name' => 'carousel',
            'label' => 'Carousel'
        ],
        [
            'name' => 'hero-slider',
            'label' => 'Hero Slider'
        ],
        [
            'name' => 'multi-column',
            'label' => 'Multi Column'
        ],
        [
            'name' => 'color-background',
            'label' => 'Color Background'
        ],
        // TEC plugin's Event Detail page
        [
            'name' => 'event-details',
            'label' => 'Event Details'
        ],
        [
            'name' => 'faq',
            'label' => 'FAQ'
        ]
    ];
    $cover_block_list = [
        [
            'name' => 'promotion',
            'label' => 'Promotion'
        ],
        [
            'name' => 'hero',
            'label' => 'Hero'
        ]
    ];

    // Group block styles
    foreach($group_block_list as $block) {
       	register_block_style( 'core/group', [
            'name'  => $block['name'],
            'label' => __( $block['label'], 'cet-wp-theme-indigo' ),
        ] ); 
    }

    // Cover block styles
       foreach($cover_block_list as $block) {
       	register_block_style( 'core/cover', [
            'name'  => $block['name'],
            'label' => __( $block['label'], 'cet-wp-theme-indigo' ),
        ] ); 
    } 
}

add_action('init','add_block_indigo_styles');
