<?php

/**
 * NBCSN Block Patterns - Greeting Section.
 *
 * @package NBCSN Block Patterns
 * @author  GolfNow
 * @license GPL-2.0-or-later
 */

$placeholder_1 = 'https://vip.teeitup.com/gn-basic/wp-content/uploads/sites/8604/2023/07/pine-single.jpg';

?>

<!-- wp:cover {"overlayColor":"theme-primary-contrast","isUserOverlayColor":true,"minHeight":100,"minHeightUnit":"vh","isDark":false,"align":"full"} -->
<div class="wp-block-cover alignfull is-light" style="min-height:100vh"><span aria-hidden="true" class="wp-block-cover__background has-theme-primary-contrast-background-color has-background-dim-100 has-background-dim"></span><div class="wp-block-cover__inner-container"><!-- wp:spacer {"className":"ghostkit-d-none ghostkit-d-md-block"} -->
<div style="height:100px" aria-hidden="true" class="wp-block-spacer ghostkit-d-none ghostkit-d-md-block"></div>
<!-- /wp:spacer -->

<!-- wp:ghostkit/grid {"gap":"lg","align":"wide"} -->
<div class="alignwide ghostkit-grid ghostkit-grid-gap-lg"><div class="ghostkit-grid-inner"><!-- wp:ghostkit/grid-column {"md_size":"12","size":"7","verticalAlign":"center"} -->
<div class="ghostkit-col ghostkit-col-md-12 ghostkit-col-7 ghostkit-col-align-self-center"><div class="ghostkit-col-content"><!-- wp:image {"id":129,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="<?php echo esc_url_raw( $placeholder_1 ) ?>" alt="" class="wp-image-129"/></figure>
<!-- /wp:image --></div></div>
<!-- /wp:ghostkit/grid-column -->

<!-- wp:ghostkit/grid-column {"md_size":"12","size":"5","verticalAlign":"center","ghostkit":{"effects":{"reveal":{"x":100,"y":0,"opacity":0,"scale":1,"transition":{"type":"easing","duration":0.9,"delay":0.3,"easing":[0.5,0,0,1]}}}}} -->
<div class="ghostkit-col ghostkit-col-md-12 ghostkit-col-5 ghostkit-col-align-self-center"><div class="ghostkit-col-content"><!-- wp:heading {"style":{"typography":{"textTransform":"uppercase"}}} -->
<h2 class="wp-block-heading" id="more-than-just-a-golf-club" style="text-transform:uppercase">More than just a golf club</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>We are proud to offer a unique golfing experience for players of all ages and skill levels. Our Par 72, 18-hole championship course is designed to challenge even the most experienced golfer while providing an enjoyable and rewarding experience for beginners. Our course is surrounded by beautiful scenery, tranquil lakes, and lush greenery, making it an ideal spot for a day of golfing. Whether a beginner or an experienced golfer, we guarantee you'll have a great time at <?php echo wp_kses_post( get_bloginfo( 'name' ) ) ?>.</p>
<!-- /wp:paragraph -->

<!-- wp:buttons -->
<div class="wp-block-buttons"><!-- wp:button {"className":"is-style-fill","style":{"border":{"radius":"0px"}}} -->
<div class="wp-block-button is-style-fill"><a class="wp-block-button__link wp-element-button" style="border-radius:0px">Button</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons --></div></div>
<!-- /wp:ghostkit/grid-column --></div></div>
<!-- /wp:ghostkit/grid -->

<!-- wp:spacer {"className":"ghostkit-d-none ghostkit-d-md-block"} -->
<div style="height:100px" aria-hidden="true" class="wp-block-spacer ghostkit-d-none ghostkit-d-md-block"></div>
<!-- /wp:spacer --></div></div>
<!-- /wp:cover -->
