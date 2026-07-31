<?php
/**
 * Troon.
 *
 * Theme Supports
 *
 * @package Troon
 * @author  NBCU Sports Next
 * @license GPL-2.0-or-later
 * @link    https://business.golfnow.com/Website-Theme-Library/
 */

return [
    'genesis-custom-logo'             => [
        'height'        => 120,
        'width'         => 350,
        'flex-height'   => true,
        'flex-width'    => true,
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
        '404-page',
        'rems',
    ],
    'genesis-menus'                   => [
        'primary'   => __( 'Header Menu', 'troon' ),
    ],
    'nbcsn-frameworks'                => [
        'framework'                   => 'gn-basic',
        'footer-widgets'              => 3,
        'header-right',
    ],
];
