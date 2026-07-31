<?php

add_filter( 'nbcsn_blocks_page_patterns', 'golfnow_aspen_page_patterns' );

function golfnow_aspen_page_patterns( $pattern_array ) {
    $pattern_array['page/home']['type']                 = 'theme';
    $pattern_array['pre-builts/greeting']['type']       = 'theme';
    $pattern_array['pre-builts/promo-row']['type']      = 'theme';
    $pattern_array['pre-builts/promo-image']['type']    = 'theme';
    $pattern_array['pre-builts/promo-text']['type']     = 'theme';
    $pattern_array['pre-builts/signup']['type']         = 'theme';

    return $pattern_array;
}