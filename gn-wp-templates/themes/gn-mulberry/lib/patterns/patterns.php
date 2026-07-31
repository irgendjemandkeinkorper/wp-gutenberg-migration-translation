<?php

add_filter( 'nbcsn_blocks_page_patterns', 'gn_mulberry_page_patterns' );

function gn_mulberry_page_patterns( $pattern_array ) {
    $pattern_array['page/home']['type']                 = 'theme';
    $pattern_array['pre-builts/greeting']['type']       = 'theme';
    $pattern_array['pre-builts/promo-row']['type']      = 'theme';
    $pattern_array['pre-builts/looking-for']['type']    = 'theme';
    $pattern_array['pre-builts/networking']['type']     = 'theme';
    $pattern_array['pre-builts/join-a-league']['type']  = 'theme';
    $pattern_array['pre-builts/review']['type']         = 'theme';
    $pattern_array['pre-builts/events']['type']         = 'theme';
    $pattern_array['pre-builts/book-now']['type']       = 'theme';

    return $pattern_array;
}