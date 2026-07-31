<?php

/**
 * NBCSN Block Patterns - Special Day Review.
 *
 * @package NBCSN Block Patterns
 * @author  GolfNow
 * @license GPL-2.0-or-later
 */

$placeholder_1 = 'https://vip.teeitup.com/gn-basic/wp-content/uploads/sites/8604/2023/07/pine-events.jpg';
$placeholder_2 = 'https://vip.teeitup.com/gn-basic/wp-content/uploads/sites/8604/2023/07/pine-meetings.jpg';
$placeholder_3 = 'https://vip.teeitup.com/gn-basic/wp-content/uploads/sites/8604/2023/07/pine-weddings.jpg';

?>

<!-- wp:cover {"overlayColor":"theme-primary-contrast","isUserOverlayColor":true,"minHeight":100,"minHeightUnit":"vh","isDark":false,"align":"full"} -->
<div class="wp-block-cover alignfull is-light" style="min-height:100vh"><span aria-hidden="true" class="wp-block-cover__background has-theme-primary-contrast-background-color has-background-dim-100 has-background-dim"></span><div class="wp-block-cover__inner-container"><!-- wp:group {"align":"wide"} -->
<div class="wp-block-group alignwide"><!-- wp:spacer -->
<div style="height:100px" aria-hidden="true" class="wp-block-spacer"></div>
<!-- /wp:spacer -->

<!-- wp:group {"align":"wide","layout":{"type":"constrained"},"ghostkit":{"effects":{"reveal":{"x":-50,"y":0,"opacity":0,"scale":1,"transition":{"type":"easing","duration":0.9,"delay":0.1,"easing":[0.5,0,0,1]}}}}} -->
<div class="wp-block-group alignwide"><!-- wp:paragraph {"style":{"typography":{"lineHeight":"1","textTransform":"uppercase","letterSpacing":"1px"}}} -->
<p style="letter-spacing:1px;line-height:1;text-transform:uppercase">Plan your event</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"textAlign":"left","style":{"typography":{"textTransform":"uppercase","letterSpacing":"2px"}},"fontSize":"display-2"} -->
<h2 class="wp-block-heading has-text-align-left has-display-2-font-size" id="let-us-make-your-day-special" style="letter-spacing:2px;text-transform:uppercase">Let us Make your day special</h2>
<!-- /wp:heading -->

<!-- wp:paragraph {"align":"left"} -->
<p class="has-text-align-left">Choosing the perfect event venue can make or break any event. Whether you’re hosting a wedding, corporate event, or birthday party, having the right venue can make all the difference. When deciding on a venue, you should consider your budget, the size of your event, and the desired atmosphere. Learn more about hosting your event at <?php echo wp_kses_post( get_bloginfo( 'name' ) ) ?>.</p>
<!-- /wp:paragraph -->

<!-- wp:buttons {"className":"","layout":{"type":"flex","justifyContent":"left","orientation":"horizontal","flexWrap":"wrap","verticalAlignment":"center"}} -->
<div class="wp-block-buttons"><!-- wp:button {"className":"is-style-fill","style":{"border":{"radius":"0px"}}} -->
<div class="wp-block-button is-style-fill"><a class="wp-block-button__link wp-element-button" style="border-radius:0px">Events</a></div>
<!-- /wp:button -->

<!-- wp:button {"className":"is-style-fill","style":{"border":{"radius":"0px"}}} -->
<div class="wp-block-button is-style-fill"><a class="wp-block-button__link wp-element-button" style="border-radius:0px">Weddings</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons --></div>
<!-- /wp:group -->

<!-- wp:spacer {"height":"25px"} -->
<div style="height:25px" aria-hidden="true" class="wp-block-spacer"></div>
<!-- /wp:spacer -->

<!-- wp:columns {"ghostkit":{"effects":{"reveal":{"x":0,"y":0,"opacity":0,"scale":0.9,"transition":{"type":"easing","duration":0.9,"delay":0.5,"easing":[0.5,0,0,1]}}}}} -->
<div class="wp-block-columns"><!-- wp:column -->
<div class="wp-block-column"><!-- wp:group {"className":"venue-group"} -->
<div class="wp-block-group venue-group"><!-- wp:image {"id":499,"sizeSlug":"large","linkDestination":"none","align":"center"} -->
<figure class="wp-block-image aligncenter size-large"><img src="<?php echo esc_url_raw( $placeholder_1 ) ?>?w=1024" alt="" class="wp-image-499"/></figure>
<!-- /wp:image --></div>
<!-- /wp:group --></div>
<!-- /wp:column -->

<!-- wp:column -->
<div class="wp-block-column"><!-- wp:group -->
<div class="wp-block-group"><!-- wp:image {"id":163,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="<?php echo esc_url_raw( $placeholder_2 ) ?>?w=1024" alt="" class="wp-image-163"/></figure>
<!-- /wp:image --></div>
<!-- /wp:group --></div>
<!-- /wp:column -->

<!-- wp:column -->
<div class="wp-block-column"><!-- wp:group -->
<div class="wp-block-group"><!-- wp:image {"id":146,"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="<?php echo esc_url_raw( $placeholder_3 ) ?>?w=1024" alt="" class="wp-image-146"/></figure>
<!-- /wp:image --></div>
<!-- /wp:group --></div>
<!-- /wp:column --></div> 
<!-- /wp:columns -->

<!-- wp:spacer -->
<div style="height:100px" aria-hidden="true" class="wp-block-spacer"></div>
<!-- /wp:spacer --></div>
<!-- /wp:group --></div></div>
<!-- /wp:cover -->
