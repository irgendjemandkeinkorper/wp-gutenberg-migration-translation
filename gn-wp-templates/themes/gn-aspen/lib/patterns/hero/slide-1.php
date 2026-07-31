<?php

/**
 * NBCSN Block Patterns - Slider Block Pattern.
 *
 * This file adds the required helper functions used in the NBCSN Block Patterns.
 *
 * @package NBCSN Block Patterns
 * @author  GolfNow
 * @license GPL-2.0-or-later
 */

$placeholder_1 = 'https://vip-teeitup-com-develop.go-vip.co/troong/wp-content/uploads/sites/8129/2023/04/slide1.jpg';
?>

<!-- wp:cover {"url":"<?php echo esc_url_raw( $placeholder_1 ) ?>","id":67,"dimRatio":20,"minHeight":65,"minHeightUnit":"vh","contentPosition":"center center","align":"full"} -->
<div class="wp-block-cover alignfull" style="min-height:65vh"><span aria-hidden="true" class="wp-block-cover__background has-background-dim-20 has-background-dim"></span><img class="wp-block-cover__image-background wp-image-67" alt="" src="<?php echo esc_url_raw( $placeholder_1 ) ?>" data-object-fit="cover"/><div class="wp-block-cover__inner-container"><!-- wp:heading {"textAlign":"center","level":1,"textColor":"white","fontSize":"display-1"} -->
<h1 class="wp-block-heading has-text-align-center has-white-color has-text-color has-display-1-font-size" id="troon-ginkgo-1"><strong><?php echo wp_kses_post( get_bloginfo( 'name' ) ) ?></strong></h1>
<!-- /wp:heading -->

<!-- wp:paragraph {"align":"center","textColor":"white"} -->
<p class="has-text-align-center has-white-color has-text-color">Suspendisse condimentum faucibus bibendum. Phasellus cursus sollicitudin tellus, quis porta augue tristique nec. Suspendisse sed tincidunt nibh. Aenean.</p>
<!-- /wp:paragraph -->

<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} -->
<div class="wp-block-buttons"><!-- wp:button {"backgroundColor":"theme-secondary","textColor":"theme-secondary-contrast","style":{"border":{"radius":"100px"}},"className":"is-style-fill"} -->
<div class="wp-block-button is-style-fill"><a class="wp-block-button__link has-theme-secondary-contrast-color has-theme-secondary-background-color has-text-color has-background wp-element-button" href="#" style="border-radius:100px" target="_blank" rel="noreferrer noopener">Button Text</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons --></div></div>
<!-- /wp:cover -->