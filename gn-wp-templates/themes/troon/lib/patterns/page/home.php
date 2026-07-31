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

$placeholder_1      = "https://vip.teeitup.com/gn-basic/wp-content/uploads/sites/8604/2023/04/tr.png";
$placeholder_1_link = "https://vip.teeitup.com/gn-basic/wp-content/uploads/sites/8604/2023/04/tr";

echo wp_kses_post( nbcsn_block_patterns_get_pattern_template_content( ['title' => '', 'location' => 'hero/video', 'type' => 'theme'] ) );
?>

<!-- wp:ghostkit/button {"align":"center","gap":"no","className":"ghostkit-custom-OAJfz","ghostkitStyles":{".ghostkit-custom-OAJfz":{"marginBottom":"0"}},"ghostkitClassname":"ghostkit-custom-OAJfz","ghostkitId":"OAJfz","ghostkitSpacings":{"marginBottom":"0"},"ghostkitCustomCSS":"selector%20%7B%0A%20%20position%3A%20relative%3B%0A%20%20z-index%3A%2020%3B%0A%7D%0A%0A%40keyframes%20small-bounce%20%7B%0A%20%200%25%20%7B%0A%20%20%20%20transform%3A%20translateY(0)%3B%0A%20%20%7D%0A%20%20%0A%20%20100%25%20%7B%0A%20%20%20%20transform%3A%20translateY(0.5rem)%3B%0A%20%20%7D%0A%7D%0A%0Aselector%20.ghostkit-button%20%7B%0A%20%20position%3A%20absolute%3B%0A%20%20bottom%3A%202.5rem%3B%0A%20%20margin%3A%200%20auto%3B%0A%20%20font-size%3A%204rem%3B%0A%20%20animation%3A%20small-bounce%202.1s%3B%0A%20%20animation-delay%3A%202s%3B%0A%20%20animation-iteration-count%3A%20infinite%3B%0A%20%20animation-direction%3A%20alternate%3B%0A%20%20animation-timing-function%3A%20%20ease-in-out%3B%0A%20%20_u002d__u002d_gkt-button-icon-only__padding-v%3A%201rem%3B%0A%20%20_u002d__u002d_gkt-button-icon-only__padding-h%3A%202rem%3B%0A%7D"} -->
<div class="ghostkit-button-wrapper ghostkit-button-wrapper-gap-no ghostkit-button-wrapper-align-center ghostkit-custom-OAJfz"><div class="ghostkit-button-wrapper-inner"><!-- wp:ghostkit/button-single {"hideText":true,"icon":"%3Csvg%20class%3D%22ghostkit-svg-icon%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20clip-rule%3D%22evenodd%22%20d%3D%22M17.7803%209.21967C18.0732%209.51256%2018.0732%209.98744%2017.7803%2010.2803L12.5303%2015.5303C12.2374%2015.8232%2011.7626%2015.8232%2011.4697%2015.5303L6.21967%2010.2803C5.92678%209.98744%205.92678%209.51256%206.21967%209.21967C6.51256%208.92678%206.98744%208.92678%207.28033%209.21967L12%2013.9393L16.7197%209.21967C17.0126%208.92678%2017.4874%208.92678%2017.7803%209.21967Z%22%20fill%3D%22currentColor%22%2F%3E%3C%2Fsvg%3E","size":"xl","color":"rgba(233, 235, 240, 0)","borderRadius":0,"borderWeight":0,"focusOutlineWeight":2,"hoverColor":"rgba(24, 26, 31, 0.27)","focusOutlineColor":"#9c5816","className":"ghostkit-custom-ZWINGR","ghostkitStyles":{".ghostkit-custom-ZWINGR":{"_u002d__u002d_gkt-button__background-color":"rgba(233%2C%20235%2C%20240%2C%200)","_u002d__u002d_gkt-button__border-radius":"0px","_u002d__u002d_gkt-button-hover__background-color":"rgba(24%2C%2026%2C%2031%2C%200.27)","_u002d__u002d_gkt-button-focus__background-color":"rgba(24%2C%2026%2C%2031%2C%200.27)","_u002d__u002d_gkt-button__border-width":"0px","_u002d__u002d_gkt-button-focus__box-shadow":"0%200%200%202px%20%239c5816"}},"ghostkitClassname":"ghostkit-custom-ZWINGR","ghostkitId":"ZWINGR"} -->
<a class="ghostkit-button ghostkit-button-xl ghostkit-button-icon-only ghostkit-button-with-outline ghostkit-custom-ZWINGR" href="#promo-tiles" aria-label="View Promo Tiles"><span class="ghostkit-button-icon ghostkit-button-icon-left"><svg class="ghostkit-svg-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M17.7803 9.21967C18.0732 9.51256 18.0732 9.98744 17.7803 10.2803L12.5303 15.5303C12.2374 15.8232 11.7626 15.8232 11.4697 15.5303L6.21967 10.2803C5.92678 9.98744 5.92678 9.51256 6.21967 9.21967C6.51256 8.92678 6.98744 8.92678 7.28033 9.21967L12 13.9393L16.7197 9.21967C17.0126 8.92678 17.4874 8.92678 17.7803 9.21967Z" fill="currentColor"/></svg></span></a>
<!-- /wp:ghostkit/button-single --></div></div>
<!-- /wp:ghostkit/button -->

<?php
echo wp_kses_post( nbcsn_block_patterns_get_pattern_template_content( ['title' => '', 'location' => 'pre-builts/promo-grid-text', 'type' => 'theme'] ) );
echo wp_kses_post( nbcsn_block_patterns_get_pattern_template_content( ['title' => '', 'location' => 'pre-builts/greeting', 'type' => 'theme'] ) );
?>

<!-- wp:cover {"customOverlayColor":"#ffffff","minHeight":150,"isDark":false,"align":"full","className":"ghostkit-custom-1QRQ0j","ghostkitStyles":{".ghostkit-custom-1QRQ0j":{"paddingBottom":"100","paddingTop":"100"}},"ghostkitClassname":"ghostkit-custom-1QRQ0j","ghostkitId":"1QRQ0j","ghostkitSpacings":{"paddingBottom":"100","paddingTop":"100"}} -->
<div class="wp-block-cover alignfull is-light ghostkit-custom-1QRQ0j" style="min-height:150px"><span aria-hidden="true" class="wp-block-cover__background has-background-dim-100 has-background-dim" style="background-color:#ffffff"></span><div class="wp-block-cover__inner-container"><!-- wp:group {"className":"site-inner","layout":{"type":"constrained"}} -->
<div class="wp-block-group site-inner"><!-- wp:paragraph {"align":"center","placeholder":"Write title…","className":"ghostkit-custom-tLYqa","fontSize":"large","ghostkitStyles":{".ghostkit-custom-tLYqa":{"marginBottom":"0"}},"ghostkitClassname":"ghostkit-custom-tLYqa","ghostkitId":"tLYqa","ghostkitSpacings":{"marginBottom":"0"}} -->
<p class="has-text-align-center ghostkit-custom-tLYqa has-large-font-size"><em>Pure. Desert. Classic.</em></p>
<!-- /wp:paragraph --></div>
<!-- /wp:group --></div></div>
<!-- /wp:cover -->

<?php
echo wp_kses_post( nbcsn_block_patterns_get_pattern_template_content( ['title' => '', 'location' => 'pre-builts/signup', 'type' => 'theme'] ) );
?>

<!-- wp:cover {"customOverlayColor":"#ffffff","minHeight":150,"isDark":false} -->
<div class="wp-block-cover is-light" style="min-height:150px"><span aria-hidden="true" class="wp-block-cover__background has-background-dim-100 has-background-dim" style="background-color:#ffffff"></span><div class="wp-block-cover__inner-container"><!-- wp:media-text {"align":"","mediaPosition":"right","mediaId":70,"mediaLink":"<?php echo esc_url_raw( $placeholder_1_link ) ?>","mediaType":"image","mediaWidth":35,"imageFill":false,"className":"ghostkit-custom-ZJSC87","ghostkitClassname":"ghostkit-custom-ZJSC87","ghostkitId":"ZJSC87","ghostkitCustomCSS":"%40media%20(max-width%3A%20991px)%20%7B%0A%20%20selector%20%7B%0A%20%20%20%20text-align%3A%20center%20!important%3B%0A%20%20%7D%0A%20%20%0A%20%20selector%20.ghostkit-button%20%7B%0A%20%20%20%20text-align%3A%20center%20!important%3B%0A%20%20%7D%0A%7D%0A%0Aselector%20img%20%7B%0A%20%20max-height%3A%20170px%3B%0A%20%20width%3A%20auto%3B%0A%7D","ghostkitSR":"fade-right;distance:100px"} -->
<div class="wp-block-media-text has-media-on-the-right is-stacked-on-mobile ghostkit-custom-ZJSC87" style="grid-template-columns:auto 35%" data-ghostkit-sr="fade-right;distance:100px"><div class="wp-block-media-text__content"><!-- wp:quote {"style":{"typography":{"fontStyle":"normal","fontWeight":"600"}},"className":"is-style-default ghostkit-custom-ZifnUK","fontSize":"h3","ghostkitStyles":{".ghostkit-custom-ZifnUK":{"media_lg":{"marginTop":"0","marginRight":"0","marginBottom":"0","marginLeft":"0"}}},"ghostkitClassname":"ghostkit-custom-ZifnUK","ghostkitId":"ZifnUK","ghostkitSpacings":{"media_lg":{"marginTop":"0","marginRight":"0","marginBottom":"0","marginLeft":"0"}},"ghostkitSR":"fade-left;distance:200px"} -->
<blockquote class="wp-block-quote is-style-default ghostkit-custom-ZifnUK has-h-3-font-size" style="font-style:normal;font-weight:600" data-ghostkit-sr="fade-left;distance:200px"><!-- wp:paragraph {"className":"ghostkit-custom-Z1GWfGs","fontSize":"h1","ghostkitStyles":{".ghostkit-custom-Z1GWfGs":{"marginBottom":"0%20!important"}},"ghostkitClassname":"ghostkit-custom-Z1GWfGs","ghostkitId":"Z1GWfGs","ghostkitSpacings":{"marginBottom":"0","!important":true}} -->
<p class="ghostkit-custom-Z1GWfGs has-h-1-font-size">The More you Play, the More you save</p>
<!-- /wp:paragraph -->

<!-- wp:ghostkit/button {"align":"left","className":"ghostkit-custom-1GdD6d","ghostkitStyles":{".ghostkit-custom-1GdD6d":{"paddingTop":"0%20!important","paddingRight":"0%20!important","paddingBottom":"0%20!important","paddingLeft":"0%20!important"}},"ghostkitClassname":"ghostkit-custom-1GdD6d","ghostkitId":"1GdD6d","ghostkitSpacings":{"paddingTop":"0","paddingRight":"0","paddingBottom":"0","paddingLeft":"0","!important":true}} -->
<div class="ghostkit-button-wrapper ghostkit-button-wrapper-gap-md ghostkit-button-wrapper-align-left ghostkit-custom-1GdD6d"><div class="ghostkit-button-wrapper-inner"><!-- wp:ghostkit/button-single {"size":"xl","color":"rgba(0, 0, 0, 0)","textColor":"#1c1f24","borderRadius":0,"hoverColor":"rgba(255, 255, 255, 0)","hoverTextColor":"#00519b","className":"ghostkit-custom-Z1bbl9c ghostkit-d-lg-none","ghostkitStyles":{".ghostkit-custom-Z1bbl9c":{"_u002d__u002d_gkt-button__background-color":"rgba(0%2C%200%2C%200%2C%200)","_u002d__u002d_gkt-button__color":"%231c1f24","_u002d__u002d_gkt-button__border-radius":"0px","_u002d__u002d_gkt-button-hover__background-color":"rgba(255%2C%20255%2C%20255%2C%200)","_u002d__u002d_gkt-button-hover__color":"%2300519b","_u002d__u002d_gkt-button-focus__background-color":"rgba(255%2C%20255%2C%20255%2C%200)","_u002d__u002d_gkt-button-focus__color":"%2300519b","paddingLeft":"0","paddingTop":"0","paddingRight":"0","paddingBottom":"0"}},"ghostkitClassname":"ghostkit-custom-Z1bbl9c","ghostkitId":"Z1bbl9c","ghostkitSpacings":{"paddingLeft":"0","paddingTop":"0","paddingRight":"0","paddingBottom":"0"},"ghostkitCustomCSS":"selector%20%7B%0A%20%20text-align%3A%20left%3B%0A%7D"} -->
<a class="ghostkit-button ghostkit-button-xl ghostkit-custom-Z1bbl9c ghostkit-d-lg-none" href="#"><span class="ghostkit-button-text">Sign up or Login for Golf's<br>Premier Loyalty Program</span></a>
<!-- /wp:ghostkit/button-single --></div></div>
<!-- /wp:ghostkit/button -->

<!-- wp:ghostkit/button {"align":"center"} -->
<div class="ghostkit-button-wrapper ghostkit-button-wrapper-gap-md ghostkit-button-wrapper-align-center"><div class="ghostkit-button-wrapper-inner"><!-- wp:ghostkit/button-single {"color":"#121212","className":"ghostkit-custom-17Sj3v ghostkit-d-none ghostkit-d-lg-block","ghostkitStyles":{".ghostkit-custom-17Sj3v":{"_u002d__u002d_gkt-button__background-color":"%23121212"}},"ghostkitClassname":"ghostkit-custom-17Sj3v","ghostkitId":"17Sj3v"} -->
<a class="ghostkit-button ghostkit-button-md ghostkit-custom-17Sj3v ghostkit-d-none ghostkit-d-lg-block" href="#"><span class="ghostkit-button-text">Sign up or Login for Golf's<br>Premier Loyalty Program</span></a>
<!-- /wp:ghostkit/button-single --></div></div>
<!-- /wp:ghostkit/button --></blockquote>
<!-- /wp:quote --></div><figure class="wp-block-media-text__media"><img src="<?php echo esc_url_raw( $placeholder_1 ) ?>" alt="" class="wp-image-70 size-full"/></figure></div>
<!-- /wp:media-text --></div></div>
<!-- /wp:cover -->

<?php
echo wp_kses_post( nbcsn_block_patterns_get_pattern_template_content( ['title' => '', 'location' => 'pre-builts/promo-grid', 'type' => 'theme'] ) );
?>
