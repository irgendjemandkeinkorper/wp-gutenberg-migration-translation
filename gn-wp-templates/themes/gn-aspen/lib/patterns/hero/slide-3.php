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

$placeholder_1 = "https://vip-teeitup-com-develop.go-vip.co/troong/wp-content/uploads/sites/8129/2023/04/slide3.jpg";
?>

<!-- wp:cover {"url":"<?php echo esc_url_raw( $placeholder_1 ) ?>","id":69,"dimRatio":20,"minHeight":65,"minHeightUnit":"vh","contentPosition":"center center","align":"full"} -->
<div class="wp-block-cover alignfull" style="min-height:65vh"><span aria-hidden="true" class="wp-block-cover__background has-background-dim-20 has-background-dim"></span><img class="wp-block-cover__image-background wp-image-69" alt="" src="<?php echo esc_url_raw( $placeholder_1 ) ?>" data-object-fit="cover"/><div class="wp-block-cover__inner-container"><!-- wp:heading {"textAlign":"center","textColor":"white","fontSize":"display-2"} -->
<h2 class="wp-block-heading has-text-align-center has-white-color has-text-color has-display-2-font-size" id="become-a-member-1">Become a Member</h2>
<!-- /wp:heading -->

<!-- wp:paragraph {"align":"center","textColor":"white"} -->
<p class="has-text-align-center has-white-color has-text-color">Hero description text to promote a <a href="#">clickable action</a></p>
<!-- /wp:paragraph -->

<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} -->
<div class="wp-block-buttons"><!-- wp:button {"textColor":"white","style":{"color":{"background":"#045ec9"},"border":{"radius":"100px"}},"className":"is-style-fill"} -->
<div class="wp-block-button is-style-fill"><a class="wp-block-button__link has-white-color has-text-color has-background wp-element-button" style="border-radius:100px;background-color:#045ec9">Membership App</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons --></div></div>
<!-- /wp:cover -->