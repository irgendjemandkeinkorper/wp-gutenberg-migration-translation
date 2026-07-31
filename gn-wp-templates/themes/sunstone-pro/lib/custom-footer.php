<?php
/**
 * Sunstone Pro.
 *
 * This file adds the Customizer additions to the Sunstone Pro Theme.
 *
 * @package rkv
 */

add_filter( 'genesis_markup_footer-widgets_open', 'sunstone_pro_remove_footer_widget_area_title', 10, 2 );
/**
 * Remove redundant heading for footer.
 */
function sunstone_pro_remove_footer_widget_area_title( $open, $args ) {
    // Rewrite the open
    $args['open'] = '<div %s>';

    return sprintf( $args['open'], genesis_attr( $args['context'], $args['atts'], $args ) );
}

add_filter( 'dynamic_sidebar_params', 'sunstone_pro_dynamic_sidebar_title_level' );
/**
 * Adjust dynamic_sidebar parameters to use h2 instead of h3.
 */
function sunstone_pro_dynamic_sidebar_title_level( $params ) {
    $params[0]['before_title'] = '<h2 class="widgettitle widget-title">';
    $params[0]['after_title'] = '</h2>';

    return $params;
}

add_filter( 'golfnow_badge_location', 'sunstone_pro_move_golfpass' );
/**
 * Moves the Golfnow Badge beneath the footer.
 */
function sunstone_pro_move_golfpass() {
    return 'genesis_before_footer';
}

add_filter( 'golfnow_badge_priority', 'sunstone_pro_change_golfpass_priority' );
/**
 * Changes the priority of the Golfnow Badge to place it in the correct order.
 */
function sunstone_pro_change_golfpass_priority() {
    return 11;
}