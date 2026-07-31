<?php

/**
 * NBCSN Block Patterns - Pine Hero.
 *
 * @package NBCSN Block Patterns
 * @author  GolfNow
 * @license GPL-2.0-or-later
 */

$placeholder_1 = 'https://vip.teeitup.com/gn-basic/wp-content/uploads/sites/8604/2023/07/pine-welcome.jpg';

?>

<!-- wp:cover {"url":"<?php echo esc_url_raw( $placeholder_1 ) ?>","id":483,"hasParallax":true,"dimRatio":50,"minHeight":100,"minHeightUnit":"vh","contentPosition":"center center","align":"full"} -->
<div class="wp-block-cover alignfull has-parallax" style="min-height:100vh"><span aria-hidden="true" class="wp-block-cover__background has-background-dim"></span><div class="wp-block-cover__image-background wp-image-483 has-parallax" style="background-position:50% 50%;background-image:url(<?php echo esc_url_raw( $placeholder_1 ) ?>)"></div><div class="wp-block-cover__inner-container"><!-- wp:group {"align":"wide","layout":{"type":"constrained"},"ghostkit":{"effects":{"reveal":{"x":0,"y":-50,"opacity":0,"scale":1,"transition":{"type":"easing","duration":0.9,"delay":0.1,"easing":[0.5,0,0,1]}}}}} -->
<div class="wp-block-group alignwide"><!-- wp:paragraph {"align":"left","className":"ghostkit-custom-Z2jY0ky","style":{"typography":{"textTransform":"uppercase","lineHeight":"1","letterSpacing":"1px"}},"textColor":"white","ghostkit":{"id":"Z2jY0ky","styles":{"media_md":{"padding-left":"0px","padding-right":"0px"}}}} -->
<p class="has-text-align-left ghostkit-custom-Z2jY0ky has-white-color has-text-color" style="letter-spacing:1px;line-height:1;text-transform:uppercase">welcome to</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"textAlign":"left","level":1,"className":"","style":{"typography":{"textTransform":"uppercase","letterSpacing":"4px","lineHeight":"1"}},"textColor":"white","fontSize":"display-1"} -->
<h1 class="wp-block-heading has-text-align-left has-white-color has-text-color has-display-1-font-size" id="pine-woods-golf-club" style="letter-spacing:4px;line-height:1;text-transform:uppercase"><?php echo wp_kses_post( get_bloginfo( 'name' ) ) ?></h1>
<!-- /wp:heading -->

<!-- wp:buttons {"className":""} -->
<div class="wp-block-buttons"><!-- wp:button {"textColor":"theme-primary-contrast","className":"is-style-outline"} -->
<div class="wp-block-button is-style-outline"><a class="wp-block-button__link has-theme-primary-contrast-color has-text-color wp-element-button">Book Now</a></div>
<!-- /wp:button -->

<!-- wp:button {"textColor":"theme-primary-contrast","className":"is-style-outline"} -->
<div class="wp-block-button is-style-outline"><a class="wp-block-button__link has-theme-primary-contrast-color has-text-color wp-element-button">Learn More</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons --></div>
<!-- /wp:group --></div></div>
<!-- /wp:cover -->