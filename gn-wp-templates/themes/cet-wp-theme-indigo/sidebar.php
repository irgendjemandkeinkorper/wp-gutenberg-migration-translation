<?php
/**
 * The sidebar containing the main widget area
 *
 * @link https://developer.wordpress.org/themes/basics/template-files/#template-partials
 *
 * @package cet-wp-theme-indigo
 */

$is_calendar       = function_exists( 'tribe_is_month' ) && tribe_is_month();
$is_events_archive = function_exists( 'tribe_is_event_query' ) && tribe_is_event_query() && ! is_singular( 'tribe_events' );
$is_event_series   = get_post_type() === 'tribe_event_series';

if ( $is_calendar || $is_events_archive || $is_event_series ) {
	return;
}

if ( ! is_active_sidebar( 'sidebar-1' ) ) {
	return;
}
?>

<aside id="secondary" class="widget-area">
	<?php dynamic_sidebar( 'sidebar-1' ); ?>
</aside><!-- #secondary -->
