<?php
/**
 * Title: Banner Hero Tall Image
 * Slug: cet-wp-theme-troon-2/banner-hero-tall-image
 * Categories: troon-components
 * Description: Banner hero block with a tall image
 *
 * @package cet-wp-theme-troon-2
 */
?>

<!-- wp:cover {"url":"<?php echo esc_url( get_theme_file_uri( '/images/patterns/banner-hero-tall.jpg' ) ); ?>","dimRatio":0,"isUserOverlayColor":true,"isDark":false,"sizeSlug":"full","className":"is-style-hero-tall-image"} -->
<div class="wp-block-cover is-light is-style-hero-tall-image">
    <img class="wp-block-cover__image-background size-full" alt="" src="<?php echo esc_url( get_theme_file_uri( '/images/patterns/banner-hero-tall.jpg' ) ); ?>" data-object-fit="cover"/>
    <span aria-hidden="true" class="wp-block-cover__background has-background-dim-0 has-background-dim"></span>
    <div class="wp-block-cover__inner-container"></div>
</div>
<!-- /wp:cover -->