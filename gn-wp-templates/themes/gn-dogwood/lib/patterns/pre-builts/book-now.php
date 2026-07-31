<?php

/**
 * NBCSN Block Patterns - Book Now Section.
 *
 * @package NBCSN Block Patterns
 * @author  GolfNow
 * @license GPL-2.0-or-later
 */

 $placeholder_1 = 'https://vip.teeitup.com/gn-basic/wp-content/uploads/sites/8604/2023/07/dogwood-booknow.jpg';

?>

<!-- wp:cover {"url":"<?php echo esc_url_raw( $placeholder_1 ) ?>","id":331,"hasParallax":true,"dimRatio":50,"isDark":false,"align":"full","ghostkit":{"effects":{"reveal":{"x":0,"y":50,"opacity":0,"scale":0.9,"transition":{"type":"easing","duration":0.9,"delay":0.3,"easing":[0.5,0,0,1]}}}}} -->
<div class="wp-block-cover alignfull is-light has-parallax"><span aria-hidden="true" class="wp-block-cover__background has-background-dim"></span><div class="wp-block-cover__image-background wp-image-331 has-parallax" style="background-position:50% 50%;background-image:url(<?php echo esc_url_raw( $placeholder_1 ) ?>)"></div><div class="wp-block-cover__inner-container"><!-- wp:heading {"textAlign":"center","textColor":"white"} -->
<h2 class="wp-block-heading has-text-align-center has-white-color has-text-color" id="what-are-you-waiting-for">What Are You Waiting For?</h2>
<!-- /wp:heading -->

<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} -->
<div class="wp-block-buttons"><!-- wp:button {"style":{"border":{"radius":"0px"}}} -->
<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="https://vip.teeitup.com/gn-dogwood/tee-times/" style="border-radius:0px">Book Now</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons --></div></div>
<!-- /wp:cover -->