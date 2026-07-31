<?php

/**
 * NBCSN Block Patterns - Contact Details.
 *
 * @package NBCSN Block Patterns
 * @author  GolfNow
 * @license GPL-2.0-or-later
 */

?>

<?php
echo wp_kses_post( nbcsn_block_patterns_get_pattern_template_content( ['title' => '', 'location' => 'hero/hero', 'type' => 'theme'] ) );

echo wp_kses_post( nbcsn_block_patterns_get_pattern_template_content( ['title' => '', 'location' => 'pre-builts/promo-row', 'type' => 'theme'] ) );

echo wp_kses_post( nbcsn_block_patterns_get_pattern_template_content( ['title' => '', 'location' => 'pre-builts/greeting', 'type' => 'theme'] ) );
?>
