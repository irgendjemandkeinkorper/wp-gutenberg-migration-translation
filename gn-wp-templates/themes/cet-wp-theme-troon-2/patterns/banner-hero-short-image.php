<?php
/**
 * Title: Banner Hero Short Image
 * Slug: cet-wp-theme-troon-2/banner-hero-short-image
 * Categories: troon-components
 * Description: Banner hero block with a short image
 *
 * When used as a block-editor pattern, $args is not set and placeholder
 * values are used. When called via get_template_part() from hero.php,
 * $args carries the real page data.
 *
 * @package cet-wp-theme-troon-2
 */

$args     = $args ?? [];
$img_url  = $args['image'] ?? get_theme_file_uri( '/images/patterns/banner-hero-short.jpg' );
$img_alt  = $args['image_alt'] ?? '';
$hero_title = $args['title'] ?? __( 'Tee Off in Paradise 3', 'cet-wp-theme-troon-2' );
$subtitle = $args['caption'] ?? __( 'Golf lessons', 'cet-wp-theme-troon-2' );

$has_img    = ! empty( $img_url );
$class_name = 'is-style-hero-short-image' . ( $has_img ? '' : ' has-no-image' );

$attrs = [
	'dimRatio'           => 0,
	'isUserOverlayColor' => true,
	'isDark'             => false,
	'className'          => $class_name,
];

if ( $has_img ) {
	$attrs['url']      = $img_url;
	$attrs['sizeSlug'] = 'full';
}
?>
<!-- wp:cover <?php echo wp_json_encode( $attrs ); ?> -->
<div class="wp-block-cover is-light <?php echo esc_attr( $class_name ); ?>">
    <?php if ( $has_img ) : ?>
    <img class="wp-block-cover__image-background size-full" alt="<?php echo esc_attr( $img_alt ); ?>" src="<?php echo esc_url( $img_url ); ?>" data-object-fit="cover"/>
    <?php endif; ?>
    <span aria-hidden="true" class="wp-block-cover__background has-background-dim-0 has-background-dim"></span>
    <div class="wp-block-cover__inner-container">
        <?php if ( $subtitle ) : ?>
        <!-- wp:paragraph {"align":"center","className":"is-style-caption"} -->
        <p class="has-text-align-center is-style-caption"><?php echo esc_html( $subtitle ); ?></p>
        <!-- /wp:paragraph -->
        <?php endif; ?>

        <!-- wp:heading {"textAlign":"center","level":1} -->
        <h1 class="wp-block-heading has-text-align-center"><?php echo esc_html( $hero_title ); ?></h1>
        <!-- /wp:heading -->
    </div>
</div>
<!-- /wp:cover -->
