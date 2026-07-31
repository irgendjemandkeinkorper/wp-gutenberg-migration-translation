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

$placeholder_1 = 'https://vip.teeitup.com/gn-basic/wp-content/uploads/sites/8604/2023/04/promo-1.jpg';
?>

<!-- wp:cover {"url":"<?php echo esc_url( $placeholder_1 ) ?>","id":177,"dimRatio":50,"isDark":false,"style":{"color":{"duotone":["#1c1f24","rgb(242, 242, 242)"]}}} -->
<div class="wp-block-cover is-light"><span aria-hidden="true" class="wp-block-cover__background has-background-dim"></span><img class="wp-block-cover__image-background wp-image-177" alt="Rocky hills view from a fairway" src="<?php echo esc_url( $placeholder_1 ) ?>" data-object-fit="cover"/><div class="wp-block-cover__inner-container"><!-- wp:heading {"textAlign":"center","textColor":"theme-secondary-contrast"} -->
<h2 class="wp-block-heading has-text-align-center has-theme-secondary-contrast-color has-text-color" id="book-tee-times-1"><a href="#">Book Tee Times</a></h2>
<!-- /wp:heading --></div></div>
<!-- /wp:cover -->