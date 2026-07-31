<?php
/**
 * Topaz.
 *
 * Contact page content optionally installed after theme activation.
 * Will create a form with WPForms and embed on the page as a WPForms block.
 *
 * Visit `/wp-admin/admin.php?page=genesis-getting-started` to trigger import.
 *
 * @package Topaz
 * @author  Golfnow
 * @license GPL-2.0-or-later
 * @link    https://www.golfnow.com/
 */

// Swaps the default content below with a WPForms contact form block if the WPForms plugin is active.
add_action( 'genesis_onboarding_after_import_content', 'studiopress_insert_contact_form', 10, 2 );

return <<<CONTENT
<!-- wp:html -->
<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3441.892388752182!2d-97.7454596848769!3d30.382413481760704!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8644cb78f24bb5d5%3A0x137687c170f12b0e!2s9111%20Jollyville%20Rd%20Unit%20108%2C%20Austin%2C%20TX%2078759!5e0!3m2!1sen!2sus!4v1620765410188!5m2!1sen!2sus" style="border:0;" allowfullscreen="" loading="lazy" width="100%" height="300"></iframe>
<!-- /wp:html -->

<!-- wp:spacer {"height":60} -->
<div style="height:60px" aria-hidden="true" class="wp-block-spacer"></div>
<!-- /wp:spacer -->

<!-- wp:ghostkit/grid -->
<div class="ghostkit-grid ghostkit-grid-gap-md"><div class="ghostkit-grid-inner"><!-- wp:ghostkit/grid-column {"md_size":"12","size":"7"} -->
<div class="ghostkit-col ghostkit-col-md-12 ghostkit-col-7"><div class="ghostkit-col-content"><!-- wp:heading {"className":"lined-heading h6 is-style-lined-heading"} -->
<h2 class="lined-heading h6 is-style-lined-heading">Contact Us</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Contact Form Goes Here</p>
<!-- /wp:paragraph --></div></div>
<!-- /wp:ghostkit/grid-column -->

<!-- wp:ghostkit/grid-column {"md_size":"12","size":"5"} -->
<div class="ghostkit-col ghostkit-col-md-12 ghostkit-col-5"><div class="ghostkit-col-content"><!-- wp:heading {"className":"lined-heading h6 is-style-lined-heading"} -->
<h2 class="lined-heading h6 is-style-lined-heading">Contact Info</h2>
<!-- /wp:heading -->

<!-- wp:group -->
<div class="wp-block-group"><div class="wp-block-group__inner-container"><!-- wp:ghostkit/icon-box {"icon":"\u003csvg class=\u0022ghostkit-svg-icon ghostkit-svg-icon-fa\u0022 aria-hidden=\u0022true\u0022 role=\u0022img\u0022 xmlns=\u0022http://www.w3.org/2000/svg\u0022 viewBox=\u00220 0 384 512\u0022\u003e\u003cpath fill=\u0022currentColor\u0022 d=\u0022M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0z\u0022\u003e\u003c/path\u003e\u003c/svg\u003e","iconColor":"#333333","className":"is-style-default ghostkit-has-frame ghostkit-custom-ptQGH","ghostkitStyles":{".ghostkit-custom-ptQGH":{"\u002d\u002dgkt-icon-box\u002d\u002dicon__color":"#333333","borderStyle":"solid","borderWidth":"0","borderColor":"#000000","paddingTop":"0","paddingBottom":"0"}},"ghostkitClassname":"ghostkit-custom-ptQGH","ghostkitId":"ptQGH","ghostkitFrame":{"borderStyle":"solid","borderWidth":"0","borderColor":"#000000"},"ghostkitSpacings":{"paddingTop":"0","paddingBottom":"0"}} -->
<div class="ghostkit-icon-box is-style-default ghostkit-has-frame ghostkit-custom-ptQGH"><div class="ghostkit-icon-box-icon ghostkit-icon-box-icon-align-left"><svg class="ghostkit-svg-icon ghostkit-svg-icon-fa" aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path fill="currentColor" d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0z"></path></svg></div><div class="ghostkit-icon-box-content"><!-- wp:paragraph {"className":"ghostkit-custom-1XdiYP","ghostkitStyles":{".ghostkit-custom-1XdiYP":{"marginBottom":"0"}},"ghostkitClassname":"ghostkit-custom-1XdiYP","ghostkitId":"1XdiYP","ghostkitSpacings":{"marginBottom":"0"}} -->
<p class="ghostkit-custom-1XdiYP"><strong>Address</strong>: 9111 Jollyville Rd<br>Unit 108, Austin, TX 78759</p>
<!-- /wp:paragraph --></div></div>
<!-- /wp:ghostkit/icon-box -->

<!-- wp:ghostkit/icon-box {"icon":"\u003csvg class=\u0022ghostkit-svg-icon ghostkit-svg-icon-fa\u0022 aria-hidden=\u0022true\u0022 role=\u0022img\u0022 xmlns=\u0022http://www.w3.org/2000/svg\u0022 viewBox=\u00220 0 512 512\u0022\u003e\u003cpath fill=\u0022currentColor\u0022 d=\u0022M502.3 190.8c3.9-3.1 9.7-.2 9.7 4.7V400c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V195.6c0-5 5.7-7.8 9.7-4.7 22.4 17.4 52.1 39.5 154.1 113.6 21.1 15.4 56.7 47.8 92.2 47.6 35.7.3 72-32.8 92.3-47.6 102-74.1 131.6-96.3 154-113.7zM256 320c23.2.4 56.6-29.2 73.4-41.4 132.7-96.3 142.8-104.7 173.4-128.7 5.8-4.5 9.2-11.5 9.2-18.9v-19c0-26.5-21.5-48-48-48H48C21.5 64 0 85.5 0 112v19c0 7.4 3.4 14.3 9.2 18.9 30.6 23.9 40.7 32.4 173.4 128.7 16.8 12.2 50.2 41.8 73.4 41.4z\u0022\u003e\u003c/path\u003e\u003c/svg\u003e","iconColor":"#333333","className":"is-style-default ghostkit-has-frame ghostkit-custom-bdLzX","ghostkitStyles":{".ghostkit-custom-bdLzX":{"\u002d\u002dgkt-icon-box\u002d\u002dicon__color":"#333333","borderStyle":"solid","borderWidth":"0","marginBottom":"0","paddingBottom":"0","paddingTop":"0"}},"ghostkitClassname":"ghostkit-custom-bdLzX","ghostkitId":"bdLzX","ghostkitFrame":{"borderStyle":"solid","borderWidth":"0"},"ghostkitSpacings":{"marginBottom":"0","paddingBottom":"0","paddingTop":"0"}} -->
<div class="ghostkit-icon-box is-style-default ghostkit-has-frame ghostkit-custom-bdLzX"><div class="ghostkit-icon-box-icon ghostkit-icon-box-icon-align-left"><svg class="ghostkit-svg-icon ghostkit-svg-icon-fa" aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M502.3 190.8c3.9-3.1 9.7-.2 9.7 4.7V400c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V195.6c0-5 5.7-7.8 9.7-4.7 22.4 17.4 52.1 39.5 154.1 113.6 21.1 15.4 56.7 47.8 92.2 47.6 35.7.3 72-32.8 92.3-47.6 102-74.1 131.6-96.3 154-113.7zM256 320c23.2.4 56.6-29.2 73.4-41.4 132.7-96.3 142.8-104.7 173.4-128.7 5.8-4.5 9.2-11.5 9.2-18.9v-19c0-26.5-21.5-48-48-48H48C21.5 64 0 85.5 0 112v19c0 7.4 3.4 14.3 9.2 18.9 30.6 23.9 40.7 32.4 173.4 128.7 16.8 12.2 50.2 41.8 73.4 41.4z"></path></svg></div><div class="ghostkit-icon-box-content"><!-- wp:paragraph {"className":"ghostkit-custom-weFTc","ghostkitStyles":{".ghostkit-custom-weFTc":{"marginBottom":"0"}},"ghostkitClassname":"ghostkit-custom-weFTc","ghostkitId":"weFTc","ghostkitSpacings":{"marginBottom":"0"}} -->
<p class="ghostkit-custom-weFTc"><strong>Email</strong>: info@lucacanyong.com</p>
<!-- /wp:paragraph --></div></div>
<!-- /wp:ghostkit/icon-box -->

<!-- wp:ghostkit/icon-box {"icon":"\u003csvg class=\u0022ghostkit-svg-icon ghostkit-svg-icon-fa\u0022 aria-hidden=\u0022true\u0022 role=\u0022img\u0022 xmlns=\u0022http://www.w3.org/2000/svg\u0022 viewBox=\u00220 0 512 512\u0022\u003e\u003cpath fill=\u0022currentColor\u0022 d=\u0022M493.4 24.6l-104-24c-11.3-2.6-22.9 3.3-27.5 13.9l-48 112c-4.2 9.8-1.4 21.3 6.9 28l60.6 49.6c-36 76.7-98.9 140.5-177.2 177.2l-49.6-60.6c-6.8-8.3-18.2-11.1-28-6.9l-112 48C3.9 366.5-2 378.1.6 389.4l24 104C27.1 504.2 36.7 512 48 512c256.1 0 464-207.5 464-464 0-11.2-7.7-20.9-18.6-23.4z\u0022\u003e\u003c/path\u003e\u003c/svg\u003e","iconColor":"#333333","className":"is-style-default ghostkit-has-frame ghostkit-custom-ZJAour","ghostkitStyles":{".ghostkit-custom-ZJAour":{"\u002d\u002dgkt-icon-box\u002d\u002dicon__color":"#333333","borderStyle":"solid","borderWidth":"0","marginBottom":"0","paddingBottom":"0","paddingTop":"0"}},"ghostkitClassname":"ghostkit-custom-ZJAour","ghostkitId":"ZJAour","ghostkitFrame":{"borderStyle":"solid","borderWidth":"0"},"ghostkitSpacings":{"marginBottom":"0","paddingBottom":"0","paddingTop":"0"}} -->
<div class="ghostkit-icon-box is-style-default ghostkit-has-frame ghostkit-custom-ZJAour"><div class="ghostkit-icon-box-icon ghostkit-icon-box-icon-align-left"><svg class="ghostkit-svg-icon ghostkit-svg-icon-fa" aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M493.4 24.6l-104-24c-11.3-2.6-22.9 3.3-27.5 13.9l-48 112c-4.2 9.8-1.4 21.3 6.9 28l60.6 49.6c-36 76.7-98.9 140.5-177.2 177.2l-49.6-60.6c-6.8-8.3-18.2-11.1-28-6.9l-112 48C3.9 366.5-2 378.1.6 389.4l24 104C27.1 504.2 36.7 512 48 512c256.1 0 464-207.5 464-464 0-11.2-7.7-20.9-18.6-23.4z"></path></svg></div><div class="ghostkit-icon-box-content"><!-- wp:paragraph {"className":"ghostkit-custom-Z11GcH0","ghostkitStyles":{".ghostkit-custom-Z11GcH0":{"marginBottom":"0"}},"ghostkitClassname":"ghostkit-custom-Z11GcH0","ghostkitId":"Z11GcH0","ghostkitSpacings":{"marginBottom":"0"}} -->
<p class="ghostkit-custom-Z11GcH0"><strong>Phone</strong>: <a href="tel:+1-614-877-9755">(614) 877-9755</a></p>
<!-- /wp:paragraph --></div></div>
<!-- /wp:ghostkit/icon-box -->

<!-- wp:ghostkit/icon-box {"icon":"\u003csvg class=\u0022ghostkit-svg-icon ghostkit-svg-icon-fa\u0022 aria-hidden=\u0022true\u0022 role=\u0022img\u0022 xmlns=\u0022http://www.w3.org/2000/svg\u0022 viewBox=\u00220 0 512 512\u0022\u003e\u003cpath fill=\u0022currentColor\u0022 d=\u0022M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm0 448c-110.5 0-200-89.5-200-200S145.5 56 256 56s200 89.5 200 200-89.5 200-200 200zm61.8-104.4l-84.9-61.7c-3.1-2.3-4.9-5.9-4.9-9.7V116c0-6.6 5.4-12 12-12h32c6.6 0 12 5.4 12 12v141.7l66.8 48.6c5.4 3.9 6.5 11.4 2.6 16.8L334.6 349c-3.9 5.3-11.4 6.5-16.8 2.6z\u0022\u003e\u003c/path\u003e\u003c/svg\u003e","iconColor":"#333333","className":"is-style-default ghostkit-has-frame ghostkit-custom-Z1WL3FC","ghostkitStyles":{".ghostkit-custom-Z1WL3FC":{"\u002d\u002dgkt-icon-box\u002d\u002dicon__color":"#333333","borderStyle":"solid","borderWidth":"0","paddingTop":"0","paddingBottom":"0"}},"ghostkitClassname":"ghostkit-custom-Z1WL3FC","ghostkitId":"Z1WL3FC","ghostkitFrame":{"borderStyle":"solid","borderWidth":"0"},"ghostkitSpacings":{"paddingTop":"0","paddingBottom":"0"}} -->
<div class="ghostkit-icon-box is-style-default ghostkit-has-frame ghostkit-custom-Z1WL3FC"><div class="ghostkit-icon-box-icon ghostkit-icon-box-icon-align-left"><svg class="ghostkit-svg-icon ghostkit-svg-icon-fa" aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm0 448c-110.5 0-200-89.5-200-200S145.5 56 256 56s200 89.5 200 200-89.5 200-200 200zm61.8-104.4l-84.9-61.7c-3.1-2.3-4.9-5.9-4.9-9.7V116c0-6.6 5.4-12 12-12h32c6.6 0 12 5.4 12 12v141.7l66.8 48.6c5.4 3.9 6.5 11.4 2.6 16.8L334.6 349c-3.9 5.3-11.4 6.5-16.8 2.6z"></path></svg></div><div class="ghostkit-icon-box-content"><!-- wp:paragraph {"className":"ghostkit-custom-2jJmnq","ghostkitStyles":{".ghostkit-custom-2jJmnq":{"marginBottom":"0"}},"ghostkitClassname":"ghostkit-custom-2jJmnq","ghostkitId":"2jJmnq","ghostkitSpacings":{"marginBottom":"0"}} -->
<p class="ghostkit-custom-2jJmnq"><strong>Hours</strong>: Monday - Friday — 08:00 - 8:00<br>Saturday &amp; Sunday — Closed</p>
<!-- /wp:paragraph --></div></div>
<!-- /wp:ghostkit/icon-box --></div></div>
<!-- /wp:group -->

<!-- wp:heading {"level":3,"className":"h4"} -->
<h3 class="h4">Get Social</h3>
<!-- /wp:heading -->

<!-- wp:social-links {"openInNewTab":true,"size":"has-normal-icon-size","className":"is-style-default"} -->
<ul class="wp-block-social-links has-normal-icon-size is-style-default"><!-- wp:social-link {"url":"facebook.com","service":"facebook"} /-->

<!-- wp:social-link {"url":"twitter.com","service":"twitter"} /-->

<!-- wp:social-link {"url":"instagram.com","service":"instagram"} /-->

<!-- wp:social-link {"url":"youtube.com","service":"youtube"} /-->

<!-- wp:social-link {"url":"yelp.com","service":"yelp"} /--></ul>
<!-- /wp:social-links --></div></div>
<!-- /wp:ghostkit/grid-column --></div></div>
<!-- /wp:ghostkit/grid -->
CONTENT;
