<?php
/**
 * Sunstone Pro.
 *
 * This file adds the default theme settings to the Sunstone Pro Theme.
 *
 * @package Sunstone Pro
 */

add_filter( 'simple_social_default_styles', 'sunstone_pro_social_default_styles' );
/**
 * Set Simple Social Icon defaults.
 *
 * @since 1.0.0
 *
 * @param array $defaults Social style defaults.
 * @return array Modified social style defaults.
 */
function sunstone_pro_social_default_styles( $defaults ) {

	$args = genesis_get_config( 'simple-social-icons-settings' );

	return wp_parse_args( $args, $defaults );

}
