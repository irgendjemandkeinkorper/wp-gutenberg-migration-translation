<?php

/**
 * NBCSN Block Patterns - Home Page Pattern.
 *
 * @package NBCSN Block Patterns
 * @author  GolfNow
 * @license GPL-2.0-or-later
 */

echo wp_kses_post( nbcsn_block_patterns_get_pattern_template_content(
    [
        'title' => '',
        'location' => 'hero/hero',
        'type' => 'theme'
    ]
) );
echo wp_kses_post( nbcsn_block_patterns_get_pattern_template_content(
    [
        'title' => '',
        'location' => 'pre-builts/greeting',
        'type' => 'theme'
    ]
) );
echo wp_kses_post( nbcsn_block_patterns_get_pattern_template_content(
    [
        'title' => '',
        'location' => 'pre-builts/promo-tiles',
        'type' => 'theme'
    ]
) );
echo wp_kses_post( nbcsn_block_patterns_get_pattern_template_content(
    [
        'title' => '',
        'location' => 'pre-builts/special-day',
        'type' => 'theme'
    ]
) );
echo wp_kses_post( nbcsn_block_patterns_get_pattern_template_content(
    [
        'title' => '',
        'location' => 'pre-builts/review',
        'type' => 'theme'
    ]
) );
echo wp_kses_post( nbcsn_block_patterns_get_pattern_template_content(
    [
        'title' => '',
        'location' => 'pre-builts/events',
        'type' => 'theme'
    ]
) );
echo wp_kses_post( nbcsn_block_patterns_get_pattern_template_content(
    [
        'title' => '',
        'location' => 'pre-builts/book-now',
        'type' => 'theme'
    ]
) );

?>
