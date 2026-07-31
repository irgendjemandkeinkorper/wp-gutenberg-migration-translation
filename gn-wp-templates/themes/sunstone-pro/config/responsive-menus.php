<?php
/**
 * Sunstone Pro child theme.
 *
 * * @package Sunstone Pro
 */

/**
 * Genesis responsive menus settings. (Requires Genesis 3.0+.)
 */
return [
	'script' => [
		'mainMenu'    => sprintf(
			'<span class="screen-reader-text">%s</span>',
			esc_html__( 'Toggle Menu', 'sunstone-pro' )
		),
		'menuClasses' => [
			'others' => [ '.nav-primary' ],
		],
	],
	'extras' => [
		'media_query_width' => '960px',
	],
];
