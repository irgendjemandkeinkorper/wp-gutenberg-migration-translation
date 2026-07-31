<?php
/**
 * GolfNow - Mulberry.
 *
 * This file adds the default theme settings to the GolfNow - Mulberry Theme.
 *
 * @package GolfNow - Mulberry
 * @author  NBCU Sports Next
 * @license GPL-2.0-or-later
 * @link    https://business.golfnow.com/Website-Theme-Library/
 */

add_filter( 'simple_social_default_styles', 'genesis_sample_social_default_styles' );
/**
 * Set Simple Social Icon defaults.
 *
 * @since 1.0.0
 *
 * @param array $defaults Social style defaults.
 * @return array Modified social style defaults.
 */
function genesis_sample_social_default_styles( $defaults ) {

    $args = genesis_get_config( 'simple-social-icons-settings' );

    return wp_parse_args( $args, $defaults );

}
