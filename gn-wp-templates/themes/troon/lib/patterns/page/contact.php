<?php

/**
 * NBCSN Block Patterns - Contact Page.
 *
 * @package NBCSN Block Patterns
 * @author  GolfNow
 * @license GPL-2.0-or-later
 */

$map_link = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3317.558024041774!2d-111.86094438446531!3d33.7462432412402!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x872b78068ca5d9dd%3A0x9b02ffb08b10d483!2sTroon+North+Golf+Club!5e0!3m2!1sen!2sus!4v1532549551337";
$appearance = genesis_get_config( 'appearance' );

$primary_color = $appearance['primary-color'];
?>
<!-- wp:ghostkit/grid {"align":"full"} -->
<div class="alignfull ghostkit-grid ghostkit-grid-gap-md"><div class="ghostkit-grid-inner"><!-- wp:ghostkit/grid-column {"md_size":"12","size":"6"} -->
<div class="ghostkit-col ghostkit-col-md-12 ghostkit-col-6"><div class="ghostkit-col-content"><!-- wp:html -->
<iframe src="<?php echo esc_url_raw( $map_link ) ?>" style="border:0" allowfullscreen="" width="100%" height="650" frameborder="0"></iframe>
<!-- /wp:html --></div></div>
<!-- /wp:ghostkit/grid-column -->

<!-- wp:ghostkit/grid-column {"md_size":"12","size":"6","className":"ghostkit-custom-Z1gGNRD","ghostkitStyles":{".ghostkit-grid%20.ghostkit-custom-Z1gGNRD":{"paddingTop":"80","paddingRight":"50","paddingBottom":"30","paddingLeft":"60"}},"ghostkitClassname":"ghostkit-custom-Z1gGNRD","ghostkitId":"Z1gGNRD","ghostkitSpacings":{"paddingTop":"80","paddingRight":"50","paddingBottom":"30","paddingLeft":"60"}} -->
<div class="ghostkit-col ghostkit-col-md-12 ghostkit-col-6 ghostkit-custom-Z1gGNRD"><div class="ghostkit-col-content"><!-- wp:heading {"fontSize":"display-2"} -->
<h2 class="wp-block-heading has-display-2-font-size" id="contact-us">Contact Us</h2>
<!-- /wp:heading -->

<!-- wp:wpforms/form-selector /--></div></div>
<!-- /wp:ghostkit/grid-column --></div></div>
<!-- /wp:ghostkit/grid -->

<?php
echo wp_kses_post( nbcsn_block_patterns_get_pattern_template_content( ['title' => '', 'location' => 'pre-builts/contact-details', 'type' => 'theme'] ) );
?>
