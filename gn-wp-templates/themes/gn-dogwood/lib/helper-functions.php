<?php
/**
 * GolfNow - Dogwood.
 *
 * This file adds the required helper functions used in the GolfNow - Dogwood Theme.
 *
 * @package GolfNow - Dogwood
 * @author  GolfNow
 * @license GPL-2.0-or-later
 * @link    https://business.golfnow.com/Website-Theme-Library/
 */

 /**
 * Returns array of all positions that needle found in haystack
 *
 * @since 1.0.0
 *
 * @param string $haystack String to be searched.
 * @param string $needle What we're looking for.
 * @param int    $offset strpos offset.
 * @return array/bool returns array of all positions that needle found in haystack.
 */

function strposa( $haystack, $needle, $offset=0 ) {
	$haystack_length = strlen( $haystack );
	$needle_length = strlen( $needle );
	$chr = [];
	
	do {
		$start = ( count( $chr )? end( $chr ) + $needle_length: $offset );
		$res = strpos( $haystack, $needle, $start );
		if ( $res !== false ) array_push( $chr, $res );

	} while ( $res !== false );

	if ( empty( $chr ) ) return false;

	return $chr;
	
}

/**
 * Used to find the closest number, without going over, from an array of unique positive integers
 *
 * @since 1.0.0
 *
 * @param string $haystack String to be searched.
 * @param string $needle Closest unique positive integer.
 * @return array/bool Returns closest position.
 */

function findcloseststr( $haystack, $needle ) {
	$search = 0;

	foreach ( $haystack as $straw ) {
		if ( $straw > $needle ) { return $search; }
		$search = $straw;
	}

	return false;
}