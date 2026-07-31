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

$placeholder_video = "https://videopress.com/v/BfmHyFr0?resizeToParent=true&amp;cover=true&amp;autoPlay=true&amp;loop=true&amp;muted=true&amp;persistVolume=false&amp;playsinline=true&amp;preloadContent=metadata&amp;useAverageColor=true";
?>

<!-- wp:video {"autoplay":true,"guid":"BfmHyFr0","id":131,"loop":true,"muted":true,"playsinline":true,"videoPressTracks":[],"videoPressClassNames":"wp-block-embed is-type-video is-provider-videopress","align":"full","className":"ghostkit-custom-4Qq5W","ghostkitStyles":{".ghostkit-custom-4Qq5W":{"marginBottom":"0%20!important"}},"ghostkitClassname":"ghostkit-custom-4Qq5W","ghostkitId":"4Qq5W","ghostkitSpacings":{"marginBottom":"0","!important":true}} -->
<figure class="wp-block-video alignfull ghostkit-custom-4Qq5W wp-block-embed is-type-video is-provider-videopress"><div class="wp-block-embed__wrapper">
<?php echo esc_url_raw( $placeholder_video ) ?>
</div></figure>
<!-- /wp:video -->