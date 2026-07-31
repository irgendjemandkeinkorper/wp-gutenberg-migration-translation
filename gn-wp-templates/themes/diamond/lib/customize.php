<?php
/**
 * Diamond.
 *
 * This file adds the Customizer additions to the Diamond Theme.
 *
 * @package Diamond
 * @author  NBCU Sports Next
 * @license GPL-2.0-or-later
 * @link    https://business.golfnow.com/Website-Theme-Library/
 */

add_action( 'customize_register', 'diamond_customizer_register' );
/**
 * Registers settings and controls with the Customizer.
 *
 * @since 2.2.3
 *
 * @param WP_Customize_Manager $wp_customize Customizer object.
 */
function diamond_customizer_register( $wp_customize ) {

	$appearance = genesis_get_config( 'appearance' );

	$wp_customize->add_setting(
		'diamond_primary_color',
		[
			'default'           => $appearance['primary-color'],
			'sanitize_callback' => 'sanitize_hex_color',
		]
	);

	$wp_customize->add_control(
		new WP_Customize_Color_Control(
			$wp_customize,
			'diamond_primary_color',
			[
				'description' => __( 'The main accent color to be used on the site.', 'diamond' ),
				'label'       => __( 'Primary Color', 'diamond' ),
				'section'     => 'colors',
				'settings'    => 'diamond_primary_color',
			]
		)
	);

}

/**
 * Displays a message if the entered width is not numeric or greater than 100.
 *
 * @param object $validity The validity status.
 * @param int    $width The width entered by the user.
 * @return int The new width.
 */
function diamond_validate_logo_width( $validity, $width ) {

	if ( empty( $width ) || ! is_numeric( $width ) ) {
		$validity->add( 'required', __( 'You must supply a valid number.', 'diamond' ) );
	} elseif ( $width < 100 ) {
		$validity->add( 'logo_too_small', __( 'The logo width cannot be less than 100.', 'diamond' ) );
	}

	return $validity;

}
