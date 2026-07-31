<?php
/**
 * GolfNow - Aspen.
 *
 * Theme Supports
 *
 * @package GolfNow - Aspen
 * @author  NBCU Sports Next
 * @license GPL-2.0-or-later
 * @link    https://business.golfnow.com/Website-Theme-Library/
 */


$logo_aspect    = get_theme_mod( 'nbcsn_basic_frameworks_logo_aspect', 'rectangle' );
$height         = 512;
$width          = 128;

if ( $logo_aspect === 'square' ) {
    $height     = 512;
    $width      = 512;
}

return [
    'genesis-custom-logo'             => [
        'flex-height' => true,
        'flex-width'  => true,
        'height'      => $width,
		'width'       => $height,
    ],
    'html5'                           => [
        'caption',
        'comment-form',
        'comment-list',
        'gallery',
        'navigation-widgets',
        'search-form',
        'script',
        'style',
    ],
    'genesis-accessibility'           => [
        'headings',
        'search-form',
        'skip-links',
    ],
    'genesis-menus'                   => [
        'primary'   => __( 'Header Menu', 'gn-aspen' ),
    ],
    'nbcsn-frameworks'                => [
        'framework'                   => 'gn-basic',
        'footer-widgets'              => 3,
    ],
];
