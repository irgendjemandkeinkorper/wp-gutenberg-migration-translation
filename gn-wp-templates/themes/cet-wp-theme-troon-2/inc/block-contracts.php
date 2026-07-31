<?php

/**
 * Block Contracts Configuration
 *
 * Defines stable project-owned block identity contracts.
 * Used by BlockContracts class to apply consistent classes and data attributes.
 *
 * @package cet-wp-theme-troon-2
 */

return [
	'defaults' => [
		'section' => [
			'enabled' => false,
			'base_class' => 'cet-block',
			'type_class_prefix' => 'cet-block-type-',
			'modifier_prefix' => '-has-',
			'container' => 'container',
			'spacing' => 'md',
		],
		'content' => [
			'enabled' => true,
			'base_class' => 'cet-block-part',
			'type_class_prefix' => 'cet-block-part-type-',
			'apply_to_nested_only' => true,
		],
	],
	'section_blocks' => [
		/* v2 — registered in bootstrap.php registry
		'core/group' => [
			'enabled' => true,
			'type' => 'group',
			'container' => 'container',
			'spacing' => 'md',
		],
		*/
		'core/cover' => [
			'enabled'      => true,
			'type'         => 'cover',
			'container'    => 'full-bleed',
			'spacing'      => 'lg',
			'sub_elements' => [
				'wp-block-cover__background'      => 'cet-block-background',
				'wp-block-cover__inner-container' => 'cet-block-inner-container',
			],
		],
		/* v2 — registered in bootstrap.php registry
		'core/media-text' => [
			[
				'enabled'   => true,
				'type'      => 'club-intro',
				'container' => 'full-bleed',
				'spacing'   => 'none',
				'style'     => 'club-intro',
			],
			[
				'enabled'   => true,
				'type'      => 'module-one-asset',
				'container' => 'full-bleed',
				'spacing'   => 'none',
				'style'     => 'module-one-asset',
			],
		],
		*/
		/* v2 — registered in bootstrap.php registry
		'core/embed' => [
			'enabled'   => true,
			'type'      => 'embed',
			'container' => 'container',
			'spacing'   => 'md',
			'sub_elements' => [
				'wp-block-embed__wrapper' => 'embed-wrapper',
			],
		],
		*/
		'core/columns' => [
			/* v2 — registered in bootstrap.php registry
			[
				'enabled'   => true,
				'type'      => 'text-only',
				'container' => 'full-bleed',
				'spacing'   => 'none',
				'style'     => 'text-only',
			],
			*/
			/* v2 — registered in bootstrap.php registry
			[
				'enabled'   => true,
				'type'      => 'text-carousel',
				'container' => 'full-bleed',
				'spacing'   => 'none',
				'style'     => 'text-carousel',
			],
			*/
			/*[
				'enabled'   => true,
				'type'      => 'testimonials',
				'container' => 'full-bleed',
				'spacing'   => 'xxl',
				'style'     => 'testimonials',
			],*/
			/* v2 — registered in bootstrap.php registry
			[
				'enabled'   => true,
				'type'      => 'small-cards',
				'container' => 'full-bleed',
				'spacing'   => 'none',
				'style'     => 'small-cards',
			],
			[
				'enabled'   => true,
				'type'      => 'big-cards',
				'container' => 'full-bleed',
				'spacing'   => 'none',
				'style'     => 'big-cards',
			],
			*/
			/* v2 — registered in bootstrap.php registry
			[
				'enabled'   => true,
				'type'      => 'contact-form',
				'container' => 'full-bleed',
				'spacing'   => 'xxl',
				'style'     => 'contact-form',
			],
			*/
			/* v2 — registered in bootstrap.php registry
			[
                'enabled'   => true,
                'type'      => 'faq',
				'container' => 'full-bleed',
				'spacing'   => 'none',
				'style'     => 'faq',
			],
			*/
			/* v2 — registered in bootstrap.php registry
			[
				'enabled'   => true,
				'type'      => 'instructors',
				'container' => 'full-bleed',
				'spacing'   => 'none',
				'style'     => 'instructors',
			],
			[
				'enabled'   => true,
				'type'      => 'instructor',
				'container' => 'container',
				'spacing'   => 'none',
				'style'     => 'instructor',
			],
			*/
		],
        /* v2 — registered in bootstrap.php registry
        'core/separator' => [
            'enabled' => true,
            'type'    => 'separator',
            'spacing' => 'sm',
        ],
        */
        /* v2 — registered in bootstrap.php registry
        'core/file' => [
            'enabled' => true,
            'type'    => 'file',
            'spacing' => 'none',
        ],
        */
		/* v2 — registered in bootstrap.php registry
		'ghostkit/carousel' => [
			'enabled'   => true,
			'type'      => 'carousel',
			'container' => 'full-bleed',
		],
		*/
        'ghostkit/grid' => [
            /* v2 — registered in bootstrap.php registry
            [
                'enabled'   => true,
                'type'      => 'text-only',
                'container' => 'full-bleed',
                'spacing'   => 'none',
                'style'     => 'text-only',
            ],
            */
            /* v2 — registered in bootstrap.php registry
            [
                'enabled'   => true,
                'type'      => 'text-carousel',
                'container' => 'full-bleed',
                'spacing'   => 'none',
                'style'     => 'text-carousel',
            ],
            */
            /*[
                'enabled'   => true,
                'type'      => 'testimonials',
                'container' => 'full-bleed',
                'spacing'   => 'xxl',
                'style'     => 'testimonials',
            ],*/
            /* v2 — registered in bootstrap.php registry
            [
                'enabled'   => true,
                'type'      => 'small-cards',
                'container' => 'full-bleed',
                'spacing'   => 'none',
                'style'     => 'small-cards',
            ],
            [
                'enabled'   => true,
                'type'      => 'big-cards',
                'container' => 'full-bleed',
                'spacing'   => 'none',
                'style'     => 'big-cards',
            ],
            */
            /* v2 — registered in bootstrap.php registry
            [
                'enabled'   => true,
                'type'      => 'contact-form',
                'container' => 'full-bleed',
                'spacing'   => 'xxl',
                'style'     => 'contact-form',
            ],
            */
            /* v2 — registered in bootstrap.php registry
            [
                'enabled'   => true,
                'type'      => 'faq',
                'container' => 'full-bleed',
                'spacing'   => 'none',
                'style'     => 'faq',
            ],
            */
            /* v2 — registered in bootstrap.php registry
            [
                'enabled'   => true,
                'type'      => 'instructor',
                'container' => 'container',
                'spacing'   => 'none',
                'style'     => 'instructor',
            ],
            */
        ],
		'core/details' => [
			'enabled'   => true,
			'type'      => 'accordion',
			'container' => 'container',
			'spacing'   => 'md',
		],
		'core/accordion' => [
			'enabled'      => true,
			'type'         => 'accordion',
			'container'    => 'container',
			'spacing'      => 'md',
			'sub_elements' => [
				'wp-block-accordion-item'                  => 'accordion-item',
				'wp-block-accordion-heading'               => 'accordion-heading',
				'wp-block-accordion-heading__toggle'       => 'accordion-trigger',
				'wp-block-accordion-heading__toggle-title' => 'accordion-label',
				'wp-block-accordion-heading__toggle-icon'  => 'accordion-icon',
				'wp-block-accordion-panel'                 => 'accordion-content',
			],
		],
		'ghostkit/accordion' => [
			'enabled'      => true,
			'type'         => 'accordion',
			'container'    => 'container',
			'spacing'      => 'md',
			'sub_elements' => [
				'ghostkit-accordion-item'          => 'accordion-item',
				'ghostkit-accordion-item-heading'  => 'accordion-heading',
				'ghostkit-accordion-item-label'    => 'accordion-label',
				'ghostkit-accordion-item-collapse' => 'accordion-icon',
				'ghostkit-accordion-item-content'  => 'accordion-content',
			],
		],
        /* v2 — registered in bootstrap.php registry
        'wpforms/form-selector' => [
            'enabled' => true,
            'type' => 'wpforms',
            'container' => 'container',
            'spacing' => 'md',
        ],
        */
		/* v2 — registered in bootstrap.php registry
		'ghostkit/tabs-v2' => [
			'enabled'   => true,
			'type'      => 'instructors',
			'container' => 'full-bleed',
			'spacing'   => 'none',
		],
		*/
	],
	'nested_blocks' => [
		'core/heading' => [
			'enabled' => true,
			'type' => 'heading',
		],
		'core/paragraph' => [
			'enabled' => true,
			'type' => 'body',
		],
		'core/buttons' => [
			'enabled' => true,
			'type' => 'actions',
		],
		'core/button' => [
			'enabled' => true,
			'type' => 'button',
		],
		'core/image' => [
			'enabled' => true,
			'type' => 'image',
		],
		'core/list' => [
			'enabled' => true,
			'type' => 'list',
		],
		'core/columns' => [
			'enabled' => true,
			'type' => 'columns',
		],
		'core/column' => [
			'enabled' => true,
			'type'    => 'column',
		],
		'core/details' => [
			'enabled' => true,
			'type'    => 'accordion',
		],
		'core/quote' => [
			'enabled' => true,
			'type' => 'quote',
		],
		'core/cover' => [
			'enabled' => true,
			'type'    => 'cover',
		],
		/* v2 — registered in bootstrap.php registry
		'core/separator' => [
			'enabled' => true,
			'type'    => 'separator',
        ],
		*/
		'core/accordion' => [
			'enabled'      => true,
			'type'         => 'accordion',
			'sub_elements' => [
				'wp-block-accordion-item'                  => 'accordion-item',
				'wp-block-accordion-heading'               => 'accordion-heading',
				'wp-block-accordion-heading__toggle'       => 'accordion-trigger',
				'wp-block-accordion-heading__toggle-title' => 'accordion-label',
				'wp-block-accordion-heading__toggle-icon'  => 'accordion-icon',
				'wp-block-accordion-panel'                 => 'accordion-content',
			],
		],
		'core/accordion-item' => [
			'enabled' => true,
			'type'    => 'accordion-item',
		],
		/* v2 — registered in bootstrap.php registry
		'core/embed' => [
			'enabled'      => true,
			'type'         => 'embed',
			'sub_elements' => [
				'wp-block-embed__wrapper' => 'embed-wrapper',
			],
		],
		*/
		'ghostkit/carousel-slide' => [
			'enabled' => true,
			'type'    => 'carousel-slide',
		],
		'ghostkit/accordion' => [
			'enabled'      => true,
			'type'         => 'accordion',
			'sub_elements' => [
				'ghostkit-accordion-item'          => 'accordion-item',
				'ghostkit-accordion-item-heading'  => 'accordion-heading',
				'ghostkit-accordion-item-label'    => 'accordion-label',
				'ghostkit-accordion-item-collapse' => 'accordion-icon',
				'ghostkit-accordion-item-content'  => 'accordion-content',
			],
		],
		'ghostkit/accordion-item' => [
			'enabled' => true,
			'type'    => 'accordion-item',
		],
        'ghostkit/grid' => [
            'enabled' => true,
            'type'    => 'columns',
        ],
        'ghostkit/grid-column' => [
            'enabled' => true,
            'type'    => 'column',
        ],
	],
];
