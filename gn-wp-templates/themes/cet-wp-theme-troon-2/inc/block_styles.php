<?php
/**
 * Block styles registration.
 *
 * @package cet-wp-theme-troon-2
 */

/**
 * Register custom block pattern categories.
 */
function cet_troon_2_register_pattern_categories() {
	if ( ! function_exists( 'register_block_pattern_category' ) ) {
		return;
	}

	register_block_pattern_category(
		'troon-components',
		array(
			'label' => __( 'Troon Components', 'cet-wp-theme-troon-2' ),
		)
	);
}
add_action( 'init', 'cet_troon_2_register_pattern_categories' );

/**
 * Register custom Gutenberg block styles.
 */
function cet_troon_2_register_block_styles() {
	$button_styles = [
		[
			'name'         => 'primary',
			'label'        => __( 'Primary', 'cet-wp-theme-troon-2' ),
			'style_handle' => 'cet-wp-theme-base-style',
			'is_default'   => true,
		],
		[
			'name'         => 'secondary',
			'label'        => __( 'Secondary', 'cet-wp-theme-troon-2' ),
			'style_handle' => 'cet-wp-theme-base-style',
		],
		[
			'name'         => 'link-arrow-1',
			'label'        => __( 'Link arrow 1', 'cet-wp-theme-troon-2' ),
			'style_handle' => 'cet-wp-theme-base-style',
		],
		[
			'name'         => 'link-arrow-2',
			'label'        => __( 'Link arrow 2', 'cet-wp-theme-troon-2' ),
			'style_handle' => 'cet-wp-theme-base-style',
		],
	];

	$column_styles = [
		[
			// Section root style. Activates the instructors block contract in BlockContracts
			// (adds cet-block-type-instructors) and triggers InstructorsTabs to apply all
			// tab data attributes on the frontend. Also activates the editor HOC that manages
			// tab switching in the Gutenberg editor.
			'name'  => 'instructors',
			'label' => __( 'Instructors', 'cet-wp-theme-troon-2' ),
		],
		[
			// Marks the inner core/columns as the panels container. InstructorsTabs.php uses
			// this class to set data-cet-tabs-panels, which the frontend tab script targets to
			// scope panel queries. Must be applied to the core/columns that wraps all tab panels.
			'name'  => 'instructors-panels',
			'label' => __( 'Instructors Panels', 'cet-wp-theme-troon-2' ),
		],
		[
			'name'  => 'text-only',
			'label' => __( 'Text Only', 'cet-wp-theme-troon-2' ),
		],
		[
			'name'  => 'text-carousel',
			'label' => __( 'Text Carousel', 'cet-wp-theme-troon-2' ),
		],
		[
			'name'  => 'testimonials',
			'label' => __( 'Testimonials', 'cet-wp-theme-troon-2' ),
		],
		[
			'name'  => 'instructor',
			'label' => __( 'Instructor', 'cet-wp-theme-troon-2' ),
		],
		[
			'name'  => 'contact-form',
			'label' => __( 'Contact Form', 'cet-wp-theme-troon-2' ),
		],

	];

	foreach ( CET_TROON_2_CAROUSEL_STYLES as $style_name ) {
		$column_styles[] = [
			'name'  => $style_name,
			'label' => ucwords( str_replace( '-', ' ', $style_name ), " \t\r\n\f\v" ),
		];
	}

	$cover_styles = [
		[
			'name'  => 'hero-tall-video',
			'label' => __( 'Hero – Tall Video', 'cet-wp-theme-troon-2' ),
		],
		[
			'name'  => 'hero-tall-image',
			'label' => __( 'Hero – Tall Image', 'cet-wp-theme-troon-2' ),
		],
		[
			'name'  => 'hero-short-image',
			'label' => __( 'Hero – Short Image', 'cet-wp-theme-troon-2' ),
		],
		[
			'name'  => 'contact',
			'label' => __( 'Contact', 'cet-wp-theme-troon-2' ),
		],
		[
			'name'  => 'feature',
			'label' => __( 'Feature', 'cet-wp-theme-troon-2' ),
		],
	];

	$map = [
		'core/button'       => $button_styles,
		'core/cover'        => $cover_styles,
		'core/media-text'   => [
			[
				'name'       => 'club-intro',
				'label'      => __( 'Club Intro', 'cet-wp-theme-troon-2' ),
				'is_default' => true,
			],
			[
				'name'  => 'module-one-asset',
				'label' => __( 'Module One Asset', 'cet-wp-theme-troon-2' ),
			],
		],
		'core/paragraph'    => [
			[
				'name'  => 'caption',
				'label' => __( 'Caption', 'cet-wp-theme-troon-2' ),
			],
		],
		'core/columns'      => $column_styles,
		'core/column'       => [
			[
				// Marks each core/column as an individual tab panel. InstructorsTabs.php uses
				// this class to set data-cet-tab-panel with a sequential index, which the
				// frontend tab script uses to show or hide the matching panel. Must be applied
				// to every direct panel column inside the instructors-panels columns wrapper.
				'name'  => 'instructors-panel',
				'label' => __( 'Instructors Panel', 'cet-wp-theme-troon-2' ),
			],
		],
		'ghostkit/grid'     => $column_styles,
		'ghostkit/carousel' => [
			[
				'name'  => 'testimonials',
				'label' => __( 'Testimonials', 'cet-wp-theme-troon-2' ),
			],
		],
	];

	foreach ( $map as $block_name => $styles ) {
		if ( ! is_array( $styles ) ) {
			continue;
		}

		foreach ( $styles as $style ) {
			register_block_style( $block_name, $style );
		}
	}
}

add_action( 'init', 'cet_troon_2_register_block_styles' );
