<?php
/**
 * Sunstone Pro.
 *
 * This file adds the Customizer additions to the Sunstone Pro Theme.
 *
 * @package rkv
 */

use GN\Customizer\RKV_Editor_Control;

add_action( 'customize_register', 'rkv_register_customizer_settings' );
/**
 * Registers settings and controls with the Customizer.
 *
 * @since 2.2.3
 *
 * @param WP_Customize_Manager $wp_customize Customizer object.
 */
function rkv_register_customizer_settings( $wp_customize ) {
	$appearance = genesis_get_config( 'appearance' );

	$section = 'colors';

	foreach ( $appearance['default-colors'] as $key => $value ) {
		$id = 'sunstone_brand_color_' . $key;
		$wp_customize->add_setting(
			$id,
			[
				'default'           => $value,
				'sanitize_callback' => 'sanitize_hex_color',
			]
		);

		$wp_customize->add_control(
			new WP_Customize_Color_Control(
				$wp_customize,
				$id,
				[
					'description' => sprintf(
						// Translators: The placeholder is the color name.
						__( 'Change the %s brand color.', 'sunstone-pro' ),
						$key
					),
					'label'       => sunstone_pro_get_label_from_key( $key ),
					'section'     => $section,
					'settings'    => $id,
				]
			)
		);
	}

	$id = 'sunstone_pro_logo_width';
	$wp_customize->add_setting(
		$id,
		[
			'default'           => 350,
			'sanitize_callback' => 'absint',
			'validate_callback' => 'rkv_sample_validate_logo_width',
		]
	);

	// Add a control for the logo size.
	$wp_customize->add_control(
		$id,
		[
			'label'       => __( 'Logo Width', 'sunstone-pro' ),
			'description' => __( 'The maximum width of the logo in pixels.', 'sunstone-pro' ),
			'priority'    => 9,
			'section'     => 'title_tagline',
			'settings'    => $id,
			'type'        => 'number',
			'input_attrs' => [
				'min' => 100,
			],

		]
	);

	
	if ( class_exists( 'NBCSN_Toggle_Control' ) ) {
		$logo_toggle_id = 'sunstone_pro_logo_toggle';
		$wp_customize->add_setting(
			$logo_toggle_id,
			[
				'default'           => false,
				'transport'         => 'postMessage',
				'sanitize_callback' => 'sunstone_pro_sanitize_checkbox',
			]
		);

		$wp_customize->add_control(
			new NBCSN_Toggle_Control(
				$wp_customize, 
				$logo_toggle_id,
				[
					'label'       => __( 'Header Logo on All Pages', 'sunstone-pro' ),
					'description' => __( 'Displays the logo in the header on the homepage and sub-pages', 'sunstone-pro' ),
					'priority'    => 8,
					'section'     => 'title_tagline',
					'type'        => 'toggle',
					'settings'    => $logo_toggle_id,
				]
			)
		);
	}

	// App Text.
	$wp_customize->add_setting(
		'sunstone_pro_app_text',
		[
			'default'           => 'DOWNLOAD THE APP',
			'transport'         => 'refresh',
			'sanitize_callback' => 'sanitize_text_field',
		]
	);

	$wp_customize->add_control(
		'sunstone_pro_app_text',
		[
			'label'       => __( 'App Pre-Text', 'sunstone-pro' ),
			'description' => __( 'The text that appears before the app links', 'sec' ),
			'type'        => 'url',
			'section'     => 'title_tagline',
			'priority'    => 11,
			'settings'    => 'sunstone_pro_app_text',
		]
	);

	// App Links Selection
	$wp_customize->add_setting(
		'sunstone_pro_app_store_url',
		[
			'default'     => '',
			'transport'   => 'refresh',
			'sanitize_callback' => 'esc_url',
		]
	);

	$wp_customize->add_control(
		'sunstone_pro_app_store_url',
		[
			'label'       => __( 'Apple App Store Url', 'sunstone-pro' ),
			'description' => __( 'The link to the app on the App Store', 'usl_sportsengine' ),
			'type'        => 'url',
			'section'     => 'title_tagline',
			'priority'    => 11,
			'settings'    => 'sunstone_pro_app_store_url',
		]
	);

	$wp_customize->add_setting(
		'sunstone_pro_play_store_url',
		[
			'default'     => '',
			'transport'   => 'refresh',
			'sanitize_callback' => 'esc_url',
		]
	);

	$wp_customize->add_control(
		'sunstone_pro_play_store_url',
		[
			'label'       => __( 'Google Play Store Url', 'sunstone-pro' ),
			'description' => __( 'The link to the app located on the Play Store' ),
			'type'        => 'url',
			'section'     => 'title_tagline',
			'priority'    => 11,
			'settings'    => 'sunstone_pro_play_store_url',
		]
	);
}

/**
 * Displays a message if the entered width is not numeric or greater than 100.
 *
 * @param object $validity The validity status.
 * @param int    $width The width entered by the user.
 * @return int The new width.
 */
function rkv_sample_validate_logo_width( $validity, $width ) {
	if ( empty( $width ) || ! is_numeric( $width ) ) {
		$validity->add( 'required', __( 'You must supply a valid number.', 'sunstone-pro' ) );
	} elseif ( $width < 100 ) {
		$validity->add( 'logo_too_small', __( 'The logo width cannot be less than 100.', 'sunstone-pro' ) );
	}

	return $validity;
}

/**
 * Converts keys into a more readable format.
 *
 * @param  string $key The key.
 * @return string
 */
function sunstone_pro_get_label_from_key( $key ) {
	return ucwords( str_replace( [ '_', '-' ], ' ', $key ) );
}

/**
 * Makes sure the checkbox is returning a boolean
 *
 * @param  bool $checked if the checkbox is checked
 * @return bool it should only be able to return a bool
 */
function sunstone_pro_sanitize_checkbox( $checked ) {
	return ( ( isset( $checked ) && true === $checked ) ? true : false );
}


add_action( 'widgets_init', 'sunstone_pro_register_prefooter_widget' );

/**
 * Registers the prefooter widget area.
 */
function sunstone_pro_register_prefooter_widget() {
	register_sidebar(
		array(
			'name'          => 'Prefooter',
			'id'            => 'prefooter',
			'before_widget' => '<div id="%1$s" class="widget %2$s">',
			'after_widget'  => '</div>',
		)
	);

}