<?php

/**
 * NBCSN Block Patterns - Review Section.
 *
 * @package NBCSN Block Patterns
 * @author  GolfNow
 * @license GPL-2.0-or-later
 */

$placeholder_1 = 'https://vip.teeitup.com/gn-basic/wp-content/uploads/sites/8604/2023/07/pine-testimonial.jpg';
$placeholder_2 = 'https://vip.teeitup.com/gn-basic/wp-content/uploads/sites/8604/2023/07/quote.png';

?>

<!-- wp:cover {"url":"<?php echo esc_url_raw( $placeholder_1 ) ?>","id":493,"hasParallax":true,"dimRatio":50,"minHeight":100,"minHeightUnit":"vh","align":"full"} -->
<div class="wp-block-cover alignfull has-parallax" style="min-height:100vh"><span aria-hidden="true" class="wp-block-cover__background has-background-dim"></span><div class="wp-block-cover__image-background wp-image-493 has-parallax" style="background-position:50% 50%;background-image:url(<?php echo esc_url_raw( $placeholder_1 ) ?>)"></div><div class="wp-block-cover__inner-container"><!-- wp:spacer {"className":"ghostkit-d-none ghostkit-d-md-block"} -->
<div style="height:100px" aria-hidden="true" class="wp-block-spacer ghostkit-d-none ghostkit-d-md-block"></div>
<!-- /wp:spacer -->

<!-- wp:group {"align":"wide","className":"pine-testimonial","layout":{"type":"constrained"},"ghostkit":{"effects":{"reveal":{"x":0,"y":0,"opacity":0,"scale":0.9,"transition":{"type":"easing","duration":0.9,"delay":0.2,"easing":[0.5,0,0,1]}}}}} -->
<div class="wp-block-group alignwide pine-testimonial"><!-- wp:spacer {"height":"50px"} -->
<div style="height:50px" aria-hidden="true" class="wp-block-spacer"></div>
<!-- /wp:spacer -->

<!-- wp:image {"id":496,"width":"39px","height":"30px","sizeSlug":"full","linkDestination":"none","align":"center"} -->
<figure class="wp-block-image aligncenter size-full is-resized"><img src="<?php echo esc_url_raw( $placeholder_2 ) ?>" alt="" class="wp-image-496" style="width:39px;height:30px"/></figure>
<!-- /wp:image -->

<!-- wp:pullquote {"className":"ghostkit-custom-2ejlgm","textColor":"theme-primary-contrast","ghostkit":{"id":"2ejlgm","styles":{"media_md":{"padding-left":"10px","padding-right":"10px"},"padding-left":"40px","padding-right":"40px","padding-top":"0px"}}} -->
<figure class="wp-block-pullquote ghostkit-custom-2ejlgm has-theme-primary-contrast-color has-text-color"><blockquote><p>The course was very well taken care of. There were lots of wildlife to enjoy while you play. The carts provided were very nice and the Pro Shop staff were great. I will play again next time I'm in the area.</p><cite>- Google Reviewer</cite></blockquote></figure>
<!-- /wp:pullquote -->

<!-- wp:spacer {"height":"50px"} -->
<div style="height:50px" aria-hidden="true" class="wp-block-spacer"></div>
<!-- /wp:spacer --></div>
<!-- /wp:group -->

<!-- wp:spacer {"className":"ghostkit-d-none ghostkit-d-md-block"} -->
<div style="height:100px" aria-hidden="true" class="wp-block-spacer ghostkit-d-none ghostkit-d-md-block"></div>
<!-- /wp:spacer --></div></div>
<!-- /wp:cover -->