<?php

/**
 * NBCSN Block Patterns - Greeting Section.
 *
 * @package NBCSN Block Patterns
 * @author  GolfNow
 * @license GPL-2.0-or-later
 */

 $placeholder_1 = 'https://vip.teeitup.com/gn-basic/wp-content/uploads/sites/8604/2023/06/dogwood-welcome.jpg';

?>

<!-- wp:cover {"url":"<?php echo esc_url_raw( $placeholder_1 ) ?>","id":226,"dimRatio":80,"overlayColor":"white","isUserOverlayColor":true,"isDark":false,"align":"full"} -->
<div class="wp-block-cover alignfull is-light" id="dogwood-content-start"><span aria-hidden="true" class="wp-block-cover__background has-white-background-color has-background-dim-80 has-background-dim"></span><img class="wp-block-cover__image-background wp-image-226" alt="" src="<?php echo esc_url_raw( $placeholder_1 ) ?>" data-object-fit="cover"/><div class="wp-block-cover__inner-container"><!-- wp:group {"align":"wide","layout":{"type":"constrained"},"ghostkit":{"effects":{"reveal":{"x":0,"y":50,"opacity":0,"scale":1,"transition":{"type":"easing","duration":1,"delay":0.3,"easing":[0.5,0,0,1]}}}}} -->
<div class="wp-block-group alignwide"><!-- wp:heading {"textAlign":"center","textColor":"theme-primary","fontSize":"display-2"} -->
<h2 class="wp-block-heading has-text-align-center has-theme-primary-color has-text-color has-display-2-font-size" id="welcome-to-dogwood-links">Welcome to <?php echo wp_kses_post( get_bloginfo( 'name' ) ) ?>!</h2>
<!-- /wp:heading -->

<!-- wp:paragraph {"align":"center","className":"dogwood-subtitle","style":{"typography":{"textTransform":"uppercase","letterSpacing":"1.5px"}}} -->
<p class="has-text-align-center dogwood-subtitle" style="letter-spacing:1.5px;text-transform:uppercase">A True Links Experience</p>
<!-- /wp:paragraph -->

<!-- wp:group {"align":"wide","layout":{"type":"constrained"}} -->
<div class="wp-block-group alignwide"><!-- wp:paragraph {"align":"center"} -->
<p class="has-text-align-center"><?php echo wp_kses_post( get_bloginfo( 'name' ) ) ?> is a unique experience for golfers of all levels. This style of golf is characterized by rolling greens, strategically placed bunkers, and the occasional sandy beach. <?php echo wp_kses_post( get_bloginfo( 'name' ) ) ?> encourages a strategic approach to the game, with each hole requiring careful consideration of the wind conditions and club selection. Our links style of golf provides a challenge for experienced golfers, while also providing a great opportunity for beginners to learn the basics of the game. <?php echo wp_kses_post( get_bloginfo( 'name' ) ) ?> also offers stunning views of the surrounding landscape, making every round of golf a unique and memorable experience.</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group --></div>
<!-- /wp:group --></div></div>
<!-- /wp:cover -->