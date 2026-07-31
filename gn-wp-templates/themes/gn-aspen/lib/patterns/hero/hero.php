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

$placeholder_image = "https://vip.teeitup.com/gn-aspen/wp-content/uploads/sites/8758/2023/03/canvas-bg.jpg";
?>

<!-- wp:cover {"url":"<?php echo esc_url_raw( $placeholder_image ) ?>","id":19,"dimRatio":50,"minHeight":100,"minHeightUnit":"vh","isDark":false,"align":"full"} -->
<div class="wp-block-cover alignfull is-light" style="min-height:100vh"><span aria-hidden="true" class="wp-block-cover__background has-background-dim"></span><img class="wp-block-cover__image-background wp-image-19" alt="" src="<?php echo esc_url_raw( $placeholder_image ) ?>" data-object-fit="cover"/><div class="wp-block-cover__inner-container"><!-- wp:heading {"textAlign":"center","level":1,"textColor":"theme-primary","fontSize":"display-1"} -->
<h1 class="wp-block-heading has-text-align-center has-theme-primary-color has-text-color has-display-1-font-size" id="quail-river-golf-club-is-building-lifelong-friendships"><?php echo wp_kses_post( get_bloginfo( 'name' ) ) ?> is Building Lifelong Friendships</h1>
<!-- /wp:heading --></div></div>
<!-- /wp:cover -->