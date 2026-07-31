<?php

/**
 * NBCSN Block Patterns - Review Section.
 *
 * @package NBCSN Block Patterns
 * @author  GolfNow
 * @license GPL-2.0-or-later
 */

$placeholder_1 = 'https://vip.teeitup.com/gn-basic/wp-content/uploads/sites/8604/2023/07/dogwood-quote.jpg';

?>

<!-- wp:cover {"url":"<?php echo esc_url_raw( $placeholder_1 ) ?>","id":323,"hasParallax":true,"dimRatio":50,"isDark":false,"align":"full"} -->
<div class="wp-block-cover alignfull is-light has-parallax"><span aria-hidden="true" class="wp-block-cover__background has-background-dim"></span><div class="wp-block-cover__image-background wp-image-323 has-parallax" style="background-position:50% 50%;background-image:url(<?php echo esc_url_raw( $placeholder_1 ) ?>)"></div><div class="wp-block-cover__inner-container"><!-- wp:pullquote {"align":"wide","textColor":"theme-white","ghostkit":{"effects":{"reveal":{"x":-50,"y":0,"opacity":0,"scale":0.9,"transition":{"type":"easing","duration":0.9,"delay":0.3,"easing":[0.5,0,0,1]}}}}} -->
<figure class="wp-block-pullquote alignwide has-theme-white-color has-text-color"><blockquote><p><em>“This is a spectacular facility. The course was in pristine condition! Not one blade of grass out of place. Top notch service all around. This just might be the best course in the area. I highly recommend playing your next round here.”</em></p><cite>- Google Reviewer</cite></blockquote></figure>
<!-- /wp:pullquote --></div></div>
<!-- /wp:cover -->
