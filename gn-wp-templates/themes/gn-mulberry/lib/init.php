<?php 
/**
 * GolfNow - Mulberry.
 *
 * This file adds the default theme settings to the GolfNow - Mulberry Theme.
 *
 * @package GolfNow - Mulberry
 * @author  NBCU Sports Next
 * @license GPL-2.0-or-later
 * @link    https://business.golfnow.com/Website-Theme-Library/
 */

require_once get_stylesheet_directory() . '/lib/custom-header.php';
require_once get_stylesheet_directory() . '/lib/custom-layout.php';
require_once get_stylesheet_directory() . '/lib/custom-footer.php';
require_once get_stylesheet_directory() . '/lib/patterns/patterns.php';

function golfnow_mulberry_is_home() {
    return in_array( 'home', get_body_class(), true ) || in_array( 'genesis-singular-image-visible', get_body_class(), true );
}
