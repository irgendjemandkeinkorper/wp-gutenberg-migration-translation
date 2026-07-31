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

?>
<!-- wp:cover {"customOverlayColor":"#ffffff","minHeight":150,"isDark":false,"align":"full","className":"ghostkit-custom-Z2fpBnu","ghostkitStyles":{".ghostkit-custom-Z2fpBnu":{"paddingBottom":"3rem","paddingTop":"3rem"}},"ghostkitClassname":"ghostkit-custom-Z2fpBnu","ghostkitId":"Z2fpBnu","ghostkitSpacings":{"paddingBottom":"3rem","paddingTop":"3rem"},"ghostkitCustomCSS":".page%20selector%20h1%20%7B%0A%20%20clip%3A%20rect(0%2C0%2C0%2C0)%20!important%3B%0A%20%20border%3A%200%20!important%3B%0A%20%20height%3A%201px%20!important%3B%0A%20%20margin%3A%20-1px%20!important%3B%0A%20%20overflow%3A%20hidden%20!important%3B%0A%20%20padding%3A%200%20!important%3B%0A%20%20position%3A%20absolute%20!important%3B%0A%20%20white-space%3A%20nowrap%20!important%3B%0A%20%20width%3A%201px%20!important%3B%0A%7D%0A%0Aselector%20.ghostkit-col-content%20a%20%7B%0A%20%20position%3A%20relative%3B%0A%20%20display%3A%20block%3B%0A%20%20margin-right%3A%20var(_u002d__u002d_gkt-grid__gap)%3B%0A%20%20padding%3A%202.3rem%200%204.6rem%3B%0A%20%20color%3A%20var(%20_u002d__u002d_theme-appearance_u002d__u002d_dark%20)%3B%0A%20%20font-size%3A%202rem%3B%0A%20%20font-weight%3A%20600%3B%0A%20%20line-height%3A%201.5%3B%0A%20%20letter-spacing%3A%200.13rem%3B%0A%20%20text-decoration%3A%20none%3B%0A%20%20transition%3A%20color%200.6s%20ease%3B%0A%7D%0A%0Aselector%20.ghostkit-col-content%20a%3Ahover%2C%0Aselector%20.ghostkit-col-content%20a%3Afocus%20%7B%0A%20%20color%3A%20var(%20_u002d__u002d_theme-appearance_u002d__u002d_secondary%20)%3B%0A%7D%0A%0Aselector%20.ghostkit-col%3Afirst-child%20a%20%7B%0A%20%20margin-left%3A%20var(_u002d__u002d_gkt-grid__gap)%3B%0A%7D%0A%0A%40media%20(max-width%3A%20767px)%20%7B%0A%20%20selector%20.ghostkit-col%20a%20%7B%0A%20%20%20%20margin-left%3A%20var(_u002d__u002d_gkt-grid__gap)%3B%0A%20%20%7D%0A%7D%0A%0A.page%20selector%20.ghostkit-col-content%20a%3A%3Aafter%20%7B%0A%20%20position%3A%20absolute%3B%0A%20%20bottom%3A%202.3rem%3B%0A%20%20left%3A%200%3B%0A%20%20right%3A%200%3B%0A%20%20display%3A%20inline-block%3B%0A%20%20margin%3A%200.643rem%20auto%200.375rem%3B%0A%20%20color%3A%20var(%20_u002d__u002d_theme-appearance_u002d__u002d_gray-700%20)%3B%0A%20%20font-family%3A%20bootstrap-icons%20!important%3B%0A%20%20font-style%3A%20normal%3B%0A%20%20font-variant%3A%20normal%3B%0A%20%20text-align%3A%20center%3B%0A%20%20text-transform%3A%20none%3B%0A%20%20line-height%3A%201%3B%0A%20%20vertical-align%3A%20-.125rem%3B%0A%20%20content%3A%20%22%5CF138%22%3B%0A%20%20transition%3A%20transform%200.6s%20ease%2C%20color%200.6s%20ease%3B%0A%20%20transform%3A%20translateX(0)%3B%0A%7D%0A%0Aselector%20.ghostkit-col-content%20a%3Ahover%3A%3Aafter%2C%0Aselector%20.ghostkit-col-content%20a%3Afocus%3A%3Aafter%20%7B%0A%20%20transform%3A%20translateX(3.58rem)%3B%0A%20%20color%3A%20var(%20_u002d__u002d_theme-appearance_u002d__u002d_secondary%20)%3B%0A%7D%0A%0Aselector%20.ghostkit-col-content%20a%3Ahover%3A%3Abefore%2C%0Aselector%20.ghostkit-col-content%20a%3Afocus%3A%3Abefore%20%7B%0A%20%20width%3A%20100%25%3B%0A%7D%0A%0Aselector%20.ghostkit-col-content%20a%20%3E%20mark%20%7B%0A%20%20display%3A%20block%3B%0A%20%20margin-bottom%3A%200.643rem%3B%0A%20%20background-color%3A%20var(_u002d__u002d_theme-appearance_u002d__u002d_white)%3B%0A%20%20color%3A%20var(_u002d__u002d_theme-appearance_u002d__u002d_primary)%3B%0A%20%20padding%3A%200%3B%0A%20%20font-family%3A%20var(%20_u002d__u002d_theme-appearance_u002d__u002d_body-font-family%20)%3B%0A%20%20font-weight%3A%20200%3B%0A%20%20font-size%3A%201.16rem%3B%0A%20%20text-transform%3A%20uppercase%3B%0A%7D%0A%0A%40media%20(min-width%3A%20991px)%20%7B%0A%20%20selector%20.ghostkit-col%3Anot(%3Alast-child)%20%7B%0A%20%20%20%20border-right%3A%201px%20solid%20var(_u002d__u002d_theme-appearance_u002d__u002d_primary)%3B%0A%20%20%7D%0A%7D"} -->
<div class="wp-block-cover alignfull is-light ghostkit-custom-Z2fpBnu" style="min-height:150px" id="promo-tiles"><span aria-hidden="true" class="wp-block-cover__background has-background-dim-100 has-background-dim" style="background-color:#ffffff"></span><div class="wp-block-cover__inner-container"><!-- wp:heading {"textAlign":"center","level":1} -->
<h1 class="wp-block-heading has-text-align-center" id="welcome-to-troon-1"><?php echo wp_kses_post( get_bloginfo( 'name' ) ) ?></h1>
<!-- /wp:heading -->

<!-- wp:ghostkit/grid {"verticalAlign":"center","horizontalAlign":"around"} -->
<div class="ghostkit-grid ghostkit-grid-gap-md ghostkit-grid-align-items-center ghostkit-grid-justify-content-around"><div class="ghostkit-grid-inner"><!-- wp:ghostkit/grid-column {"lg_size":"12","size":"4","className":""} -->
<div class="ghostkit-col ghostkit-col-lg-12 ghostkit-col-4"><div class="ghostkit-col-content"><!-- wp:heading {"textAlign":"center","className":"ghostkit-custom-2ib9eg","ghostkitStyles":{".ghostkit-custom-2ib9eg":{"marginBottom":"0"}},"ghostkitClassname":"ghostkit-custom-2ib9eg","ghostkitId":"2ib9eg","ghostkitSpacings":{"marginBottom":"0"}} -->
<h2 class="wp-block-heading has-text-align-center ghostkit-custom-2ib9eg" id="book-tee-times"><a href="#"><mark class="has-inline-color has-theme-primary-color">Book </mark>Tee Times</a></h2>
<!-- /wp:heading --></div></div>
<!-- /wp:ghostkit/grid-column -->

<!-- wp:ghostkit/grid-column {"lg_size":"12","size":"4","className":""} -->
<div class="ghostkit-col ghostkit-col-lg-12 ghostkit-col-4"><div class="ghostkit-col-content"><!-- wp:heading {"textAlign":"center","className":"ghostkit-custom-Z4n8ox","ghostkitStyles":{".ghostkit-custom-Z4n8ox":{"marginBottom":"0"}},"ghostkitClassname":"ghostkit-custom-Z4n8ox","ghostkitId":"Z4n8ox","ghostkitSpacings":{"marginBottom":"0"}} -->
<h2 class="wp-block-heading has-text-align-center ghostkit-custom-Z4n8ox" id="plan-group-outings"><a href="#"><mark class="has-inline-color has-theme-primary-color">Plan </mark>Group Outings</a></h2>
<!-- /wp:heading --></div></div>
<!-- /wp:ghostkit/grid-column -->

<!-- wp:ghostkit/grid-column {"lg_size":"12","size":"4","className":""} -->
<div class="ghostkit-col ghostkit-col-lg-12 ghostkit-col-4"><div class="ghostkit-col-content"><!-- wp:heading {"textAlign":"center","className":"ghostkit-custom-1IMYik","ghostkitStyles":{".ghostkit-custom-1IMYik":{"marginBottom":"0"}},"ghostkitClassname":"ghostkit-custom-1IMYik","ghostkitId":"1IMYik","ghostkitSpacings":{"marginBottom":"0"}} -->
<h2 class="wp-block-heading has-text-align-center ghostkit-custom-1IMYik" id="join-troon"><a href="#"><mark class="has-inline-color has-theme-primary-color">Join </mark>Troon</a></h2>
<!-- /wp:heading --></div></div>
<!-- /wp:ghostkit/grid-column --></div></div>
<!-- /wp:ghostkit/grid --></div></div>
<!-- /wp:cover -->