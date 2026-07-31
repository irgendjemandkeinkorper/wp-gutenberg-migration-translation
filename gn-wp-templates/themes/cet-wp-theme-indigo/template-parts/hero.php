<?php

/**
 * Template part for displaying Hero for pages
 *
 * @link https://developer.wordpress.org/themes/basics/template-hierarchy/
 *
 * @package cet-wp-theme-indigo
 */
?>

<?php
$passed_post_id = isset( $args['post_id'] ) ? (int) $args['post_id'] : 0;
$is_shop     = function_exists( 'is_shop' ) && is_shop();
$is_product  = function_exists( 'is_product' ) && is_product();
$is_calendar =
    ( function_exists( 'tribe_is_month' ) && tribe_is_month() ) ||
    ( function_exists( 'tribe_is_list_view' ) && tribe_is_list_view() ) ||
    ( function_exists( 'tribe_is_day' ) && tribe_is_day() ) ||
    ( function_exists( 'tribe_is_week' ) && tribe_is_week() ) ||
    ( function_exists( 'tribe_is_map' ) && tribe_is_map() ) ||
    ( function_exists( 'tribe_is_photo' ) && tribe_is_photo() );
$is_event    = is_singular( 'tribe_events' );
$is_events_archive = function_exists( 'tribe_is_event_query' ) && tribe_is_event_query() && ! $is_event;

if ( $passed_post_id ) {
	$post_id = $passed_post_id;
} elseif ( $is_shop && function_exists( 'wc_get_page_id' ) ) {
	$post_id = (int) wc_get_page_id( 'shop' );
} else {
	$post_id = $is_events_archive ? 0 : get_the_ID();
}

$hero_description = get_post_meta( $post_id, 'hero_description', true ) ?? '';
$hero_title       = '';

$get_custom_header_image = function () {
    $custom_header = get_custom_header();
    $header_id = isset($custom_header->attachment_id) ? (int) $custom_header->attachment_id : 0;

    if (! $header_id) {
        $data = get_theme_mod('header_image_data', []);
        if (is_array($data) && ! empty($data['attachment_id'])) {
            $header_id = (int) $data['attachment_id'];
        }
    }

    $header_url = get_header_image();

    if ($header_id) {
        return wp_get_attachment_image($header_id, 'full', false, ['sizes' => '100vw']);
    } elseif ($header_url) {
        return '<img src="' . esc_url($header_url) . '" alt="" />';
    }

    return '';
};

$get_featured_image = function () use ( $post_id, $get_custom_header_image ) {
    if ( $post_id && has_post_thumbnail( $post_id ) ) {
        return get_the_post_thumbnail( $post_id, 'full', [ 'sizes' => '100vw' ] );
    }

    return $get_custom_header_image();
};

$get_events_image = function () use ( $get_custom_header_image ) {
    $image_id = get_theme_mod( 'indigo_events_image', '' );
    if ( ! empty( $image_id ) ) {
        return wp_get_attachment_image( $image_id, 'full', false, [ 'sizes' => '100vw' ] );
    }

    return $get_custom_header_image();
};

$hero_image = $get_custom_header_image();

if ( $is_event ) {
    $hero_title = get_post_meta( $post_id, 'hero_title', true ) ?: __( 'Event Details', 'cet-wp-theme-indigo' );
    if ( $post_id && has_post_thumbnail( $post_id ) ) {
        $hero_image = $get_featured_image();
    } else {
        $hero_image = $get_events_image();
    }

} elseif ( $is_product ) {
    $hero_title = get_post_meta( $post_id, 'hero_title', true ) ?? '';
    $hero_image_id = (int) get_post_meta( $post_id, 'hero_image', true );

    if ( $hero_image_id ) {
        $hero_image = wp_get_attachment_image( $hero_image_id, 'full', false, ['sizes' => '100vw'] );
    }

} elseif ( $is_shop ) {
    $hero_title       = get_the_title( $post_id );
    $hero_description = get_post_meta( $post_id, 'hero_description', true ) ?? '';

} elseif ( $is_calendar ) {
    $hero_title = (get_theme_mod('indigo_events_title', '') ?? '') ?: __( 'Calendar', 'cet-wp-theme-indigo' );
    $hero_description = (get_theme_mod('indigo_events_description', '')) ?? '';
    $hero_image = $get_events_image();

} elseif ( $is_events_archive ) {
    $hero_title = __( 'Events', 'cet-wp-theme-indigo' );
    $hero_image = $get_events_image();

} else {
    $hero_title = get_the_title( $post_id );
    $hero_image = $get_featured_image();
}

?>

<div class="hero mb-3 mb-md-4 mb-xxl-5">
    <?php echo wp_kses_post($hero_image); ?>

    <div class="container">
        <?php if ($hero_title) : ?>
            <h1><?php echo esc_html( $hero_title ); ?></h1>
        <?php endif; ?>
        <?php if ($hero_description) : ?>
            <p class="hero-description"><?php echo esc_html($hero_description); ?></p>
        <?php endif; ?>
    </div>
</div>