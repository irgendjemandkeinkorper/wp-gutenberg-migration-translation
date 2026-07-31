<?php

/**
 * NBCSN Block Patterns - Book Now pre-built Section.
 *
 * @package NBCSN Block Patterns
 * @author  GolfNow
 * @license GPL-2.0-or-later
 */

$placeholder_1 = 'https://vip.teeitup.com/gn-basic/wp-content/uploads/sites/8604/2023/07/mulberry-book-now.jpg';

?>

<!-- wp:cover {"url":"<?php echo esc_url_raw( $placeholder_1 ) ?>","id":565,"hasParallax":true,"dimRatio":40,"minHeight":100,"minHeightUnit":"vh","isDark":false,"align":"full"} -->
<div class="wp-block-cover alignfull is-light has-parallax" style="min-height:100vh"><span aria-hidden="true" class="wp-block-cover__background has-background-dim-40 has-background-dim"></span><div role="img" class="wp-block-cover__image-background wp-image-565 has-parallax" style="background-position:50% 50%;background-image:url(<?php echo esc_url_raw( $placeholder_1 ) ?>)"></div><div class="wp-block-cover__inner-container"><!-- wp:group {"align":"wide","layout":{"type":"constrained"}} -->
<div class="wp-block-group alignwide"><!-- wp:heading {"textAlign":"left","style":{"typography":{"textTransform":"uppercase"}},"textColor":"white","className":"mulberry-hero-text","fontSize":"display-2"} -->
<h2 class="wp-block-heading has-text-align-left mulberry-hero-text has-white-color has-text-color has-display-2-font-size" id="hero-text" style="text-transform:uppercase">AN INCREDIBLE EXPERIENCE IS WAITING!</h2>
<!-- /wp:heading -->

<!-- wp:buttons -->
<div class="wp-block-buttons"><!-- wp:button -->
<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="<?php echo esc_url_raw( get_site_url() . '/tee-times/' ) ?>">Book Now</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons --></div>
<!-- /wp:group --></div></div>
<!-- /wp:cover -->
