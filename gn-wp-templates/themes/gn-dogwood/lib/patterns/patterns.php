<?php

add_filter( 'nbcsn_blocks_page_patterns', 'gn_dogwood_page_patterns' );

function gn_dogwood_page_patterns( $pattern_array ) {
    $pattern_array['page/home']['type']                     = 'theme';
    $pattern_array['pre-builts/greeting']['type']           = 'theme';
    $pattern_array['pre-builts/promo-tiles']['type']        = 'theme';
    $pattern_array['pre-builts/course-info']['type']        = 'theme';
    $pattern_array['pre-builts/review']['type']             = 'theme';
    $pattern_array['pre-builts/upcoming-events']['type']    = 'theme';
    $pattern_array['pre-builts/book-now']['type']           = 'theme';

    return $pattern_array;
}