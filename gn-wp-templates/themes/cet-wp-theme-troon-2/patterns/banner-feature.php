<?php
/**
 * Title: Banner Feature
 * Slug: cet-wp-theme-troon-2/banner-feature
 * Categories: troon-components
 * Description: Banner Feature
 *
 * @package cet-wp-theme-troon-2
 */
?>

<!-- wp:cover {"url":"<?php echo esc_url( get_theme_file_uri( '/images/patterns/banner-feature.jpg' ) ); ?>","dimRatio":0,"isUserOverlayColor":true,"sizeSlug":"large","className":"is-style-feature"} -->
<div class="wp-block-cover is-style-feature">
    <img class="wp-block-cover__image-background size-large" alt="" src="<?php echo esc_url( get_theme_file_uri( '/images/patterns/banner-feature.jpg' ) ); ?>" data-object-fit="cover"/>
    <span aria-hidden="true" class="wp-block-cover__background has-background-dim-0 has-background-dim"></span>
    <div class="wp-block-cover__inner-container">
        <!-- wp:paragraph {"align":"center","className":"is-style-caption"} -->
        <p class="has-text-align-center is-style-caption">play dine &amp; unwind</p>
        <!-- /wp:paragraph -->

        <!-- wp:heading {"textAlign":"center"} -->
        <h2 class="wp-block-heading has-text-align-center">Your Golf Experience, Elevated</h2>
        <!-- /wp:heading -->

        <!-- wp:paragraph {"align":"center"} -->
        <p class="has-text-align-center">Top-tier facilities including a driving range, short game areas, pro shop, and clubhouse <br>— everything you need for a complete golf experience.</p>
        <!-- /wp:paragraph -->

        <!-- wp:heading {"textAlign":"left","level":4} -->
        <h4 class="wp-block-heading has-text-align-left">Event and Banquet Spaces</h4>
        <!-- /wp:heading -->
    </div>
</div>
<!-- /wp:cover -->