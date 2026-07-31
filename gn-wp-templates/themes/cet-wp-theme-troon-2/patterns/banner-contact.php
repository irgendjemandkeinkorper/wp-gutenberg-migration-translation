<?php
/**
 * Title: Banner Contact
 * Slug: cet-wp-theme-troon-2/banner-contact
 * Categories: troon-components
 * Description: Banner Contact
 *
 * @package cet-wp-theme-troon-2
 */
?>

<!-- wp:cover {"url":"<?php echo esc_url( get_theme_file_uri( '/images/patterns/banner-contact.jpg' ) ); ?>","dimRatio":0,"isUserOverlayColor":true,"isDark":false,"sizeSlug":"full","className":"is-style-contact"} -->
<div class="wp-block-cover is-light is-style-contact">
    <img class="wp-block-cover__image-background size-full" alt="" src="<?php echo esc_url( get_theme_file_uri( '/images/patterns/banner-contact.jpg' ) ); ?>" data-object-fit="cover"/>
    <span aria-hidden="true" class="wp-block-cover__background has-background-dim-0 has-background-dim"></span>
    <div class="wp-block-cover__inner-container">
        <!-- wp:paragraph {"align":"center","placeholder":"Write title…","fontSize":"large"} -->
        <p class="has-text-align-center has-large-font-size"></p>
        <!-- /wp:paragraph -->

        <!-- wp:heading {"textAlign":"left","level":4} -->
        <h4 class="wp-block-heading has-text-align-left">Troon North Golf Club</h4>
        <!-- /wp:heading -->

        <!-- wp:paragraph {"align":"left"} -->
        <p class="has-text-align-left">10320 E Dynamite Blvd.<br>Scottsdate, ARZ 85262</p>
        <!-- /wp:paragraph -->

        <!-- wp:paragraph {"align":"left"} -->
        <p class="has-text-align-left">Phone: 480.585.7700</p>
        <!-- /wp:paragraph -->
    </div>
</div>
<!-- /wp:cover -->