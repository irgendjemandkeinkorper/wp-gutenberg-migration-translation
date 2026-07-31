<?php
/**
 * Zilker Simple Social Icons default settings.
 *
 * @package Zilker
 * @author  NBCU Sports Next
 * @license GPL-2.0-or-later
 * @link    https://business.golfnow.com/Website-Theme-Library/
 */

$appearance = genesis_get_config( 'appearance' );

return [
	'alignment'              => 'alignleft',
	'background_color'       => $appearance['color-palette']['gray'],
	'background_color_hover' => $appearance['color-palette']['dark-gray'],
	'border_radius'          => 1000,
	'border_width'           => 0,
	'icon_color'             => $appearance['color-palette']['dark-gray'],
	'icon_color_hover'       => $appearance['color-palette']['gray'],
	'size'                   => 30,
];
