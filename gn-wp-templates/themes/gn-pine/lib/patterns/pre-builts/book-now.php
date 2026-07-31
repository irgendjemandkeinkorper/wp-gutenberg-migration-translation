<?php

/**
 * NBCSN Block Patterns - Book Now Section.
 *
 * @package NBCSN Block Patterns
 * @author  GolfNow
 * @license GPL-2.0-or-later
 */

$placeholder_1 = 'https://vip.teeitup.com/gn-basic/wp-content/uploads/sites/8604/2023/07/pine-book-now.jpg';

?>

<!-- wp:cover {"url":"<?php echo esc_url_raw( $placeholder_1 ) ?>","id":52,"hasParallax":true,"dimRatio":50,"minHeight":100,"minHeightUnit":"vh","align":"full"} -->
<div class="wp-block-cover alignfull has-parallax" style="min-height:100vh"><span aria-hidden="true" class="wp-block-cover__background has-background-dim"></span><div class="wp-block-cover__image-background wp-image-52 has-parallax" style="background-position:50% 50%;background-image:url(<?php echo esc_url_raw( $placeholder_1 ) ?>)"></div><div class="wp-block-cover__inner-container"><!-- wp:spacer {"className":"ghostkit-d-none ghostkit-d-md-block"} -->
<div style="height:100px" aria-hidden="true" class="wp-block-spacer ghostkit-d-none ghostkit-d-md-block"></div>
<!-- /wp:spacer -->

<!-- wp:group {"align":"wide","layout":{"type":"constrained"},"ghostkit":{"effects":{"reveal":{"x":0,"y":50,"opacity":0,"scale":1,"transition":{"type":"easing","duration":0.9,"delay":0.3,"easing":[0.5,0,0,1]}}}}} -->
<div class="wp-block-group alignwide"><!-- wp:paragraph {"style":{"typography":{"lineHeight":"1","textTransform":"uppercase","letterSpacing":"1px"}},"textColor":"theme-primary-contrast"} -->
<p class="has-theme-primary-contrast-color has-text-color" style="letter-spacing:1px;line-height:1;text-transform:uppercase">Join us</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"textAlign":"left","style":{"typography":{"textTransform":"uppercase","letterSpacing":"2px"}},"textColor":"theme-primary-contrast","fontSize":"display-2"} -->
<h2 class="wp-block-heading has-text-align-left has-theme-primary-contrast-color has-text-color has-display-2-font-size" id="let-us-make-your-day-special" style="letter-spacing:2px;text-transform:uppercase">play the round of your life</h2>
<!-- /wp:heading -->

<!-- wp:buttons {"className":""} -->
<div class="wp-block-buttons"><!-- wp:button {"textColor":"theme-primary-contrast","className":"is-style-outline"} -->
<div class="wp-block-button is-style-outline"><a class="wp-block-button__link has-theme-primary-contrast-color has-text-color wp-element-button">Book Now</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons --></div>
<!-- /wp:group -->

<!-- wp:spacer {"className":"ghostkit-d-none ghostkit-d-md-block"} -->
<div style="height:100px" aria-hidden="true" class="wp-block-spacer ghostkit-d-none ghostkit-d-md-block"></div>
<!-- /wp:spacer --></div></div>
<!-- /wp:cover -->