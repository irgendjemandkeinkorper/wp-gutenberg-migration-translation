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

<!-- wp:group {"align":"full","className":"hero-slider ghostkit-custom-ZCED1E","ghostkitStyles":{".ghostkit-custom-ZCED1E":{"marginBottom":"0%20!important"}},"ghostkitClassname":"ghostkit-custom-ZCED1E","ghostkitId":"ZCED1E","ghostkitSpacings":{"marginBottom":"0","!important":true}} -->
<div class="wp-block-group alignfull hero-slider"><?php
echo wp_kses_post( nbcsn_block_patterns_get_pattern_template_content( ['title' => '', 'location' => 'hero/slide-1', 'type' => 'theme'] ) );
echo wp_kses_post( nbcsn_block_patterns_get_pattern_template_content( ['title' => '', 'location' => 'hero/slide-2', 'type' => 'theme'] ) );
echo wp_kses_post( nbcsn_block_patterns_get_pattern_template_content( ['title' => '', 'location' => 'hero/slide-3', 'type' => 'theme'] ) );
?></div>
<!-- /wp:group -->
