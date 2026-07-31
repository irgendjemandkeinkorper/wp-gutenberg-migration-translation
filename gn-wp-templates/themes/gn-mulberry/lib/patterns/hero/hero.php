<?php

/**
 * NBCSN Block Patterns - Hero.
 *
 * @package NBCSN Block Patterns
 * @author  GolfNow
 * @license GPL-2.0-or-later
 */

$placeholder_1      = 'https://vip.teeitup.com/gn-basic/wp-content/uploads/sites/8604/2023/06/mulberry-hero.jpg';

?>

<!-- wp:cover {"url":"<?php echo esc_url_raw( $placeholder_1 ) ?>","id":53,"hasParallax":true,"dimRatio":30,"overlayColor":"theme-dark-darker","minHeight":100,"minHeightUnit":"vh","isDark":false,"align":"full"} -->
<div class="wp-block-cover alignfull is-light has-parallax" style="min-height:100vh"><span aria-hidden="true" class="wp-block-cover__background has-theme-dark-darker-background-color has-background-dim-30 has-background-dim"></span><div role="img" class="wp-block-cover__image-background wp-image-53 has-parallax" style="background-position:50% 50%;background-image:url(<?php echo esc_url_raw( $placeholder_1 ) ?>)"></div><div class="wp-block-cover__inner-container"><!-- wp:heading {"textAlign":"center","style":{"typography":{"textTransform":"uppercase"}},"textColor":"white","className":"mulberry-hero-text","fontSize":"display-2"} -->
<h2 class="wp-block-heading has-text-align-center mulberry-hero-text has-white-color has-text-color has-display-2-font-size" id="hero-text" style="text-transform:uppercase">Enjoy a round<br>Unlike any other!</h2>
<!-- /wp:heading -->

<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} -->
<div class="wp-block-buttons"><!-- wp:button -->
<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="<?php echo esc_url_raw( get_site_url() . '/tee-times/' ) ?>">BOOK NOW</a></div>
<!-- /wp:button -->

<!-- wp:button -->
<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="#">e-club</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons -->
<!-- /wp:cover -->