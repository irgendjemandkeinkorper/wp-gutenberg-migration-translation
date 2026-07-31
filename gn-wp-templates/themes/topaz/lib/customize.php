<?php
/**
 * Topaz.
 *
 * This file adds the Customizer additions to the Genesis Sample Theme.
 *
 * @package Topaz
 * @author  Golfnow
 * @license GPL-2.0-or-later
 * @link    https://www.golfnow.com/
 */

add_action( 'customize_register', 'topaz_customizer_register' );
/**
 * Registers settings and controls with the Customizer.
 *
 * @since 2.2.3
 *
 * @param WP_Customize_Manager $wp_customize Customizer object.
 */
function topaz_customizer_register( $wp_customize ) {

	$appearance = genesis_get_config( 'appearance' );

	$wp_customize->add_setting(
		'topaz_primary_color',
		[
			'default'           => $appearance['default-colors']['primary'],
			'sanitize_callback' => 'sanitize_hex_color',
		]
	);

	$wp_customize->add_control(
		new WP_Customize_Color_Control(
			$wp_customize,
			'topaz_primary_color',
			[
				'description' => __( 'Change the Primary Color', 'topaz' ),
				'label'       => __( 'Primary Color', 'topaz' ),
				'section'     => 'colors',
				'settings'    => 'topaz_primary_color',
			]
		)
	);

	$wp_customize->add_setting(
		'topaz_secondary_color',
		[
			'default'           => $appearance['default-colors']['secondary'],
			'sanitize_callback' => 'sanitize_hex_color',
		]
	);

	$wp_customize->add_control(
		new WP_Customize_Color_Control(
			$wp_customize,
			'topaz_secondary_color',
			[
				'description' => __( 'Change the Secondary Color', 'topaz' ),
				'label'       => __( 'Secondary Color', 'topaz' ),
				'section'     => 'colors',
				'settings'    => 'topaz_secondary_color',
			]
		)
	);

	$wp_customize->add_setting(
		'topaz_logo_width',
		[
			'default'           => 350,
			'sanitize_callback' => 'absint',
			'validate_callback' => 'topaz_validate_logo_width',
		]
	);

	// Add a control for the logo size.
	$wp_customize->add_control(
		'topaz_logo_width',
		[
			'label'       => __( 'Logo Width', 'topaz' ),
			'description' => __( 'The maximum width of the logo in pixels.', 'topaz' ),
			'priority'    => 9,
			'section'     => 'title_tagline',
			'settings'    => 'topaz_logo_width',
			'type'        => 'number',
			'input_attrs' => [
				'min' => 100,
			],

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
function topaz_validate_logo_width( $validity, $width ) {

	if ( empty( $width ) || ! is_numeric( $width ) ) {
		$validity->add( 'required', __( 'You must supply a valid number.', 'topaz' ) );
	} elseif ( $width < 100 ) {
		$validity->add( 'logo_too_small', __( 'The logo width cannot be less than 100.', 'topaz' ) );
	}

	return $validity;

}
