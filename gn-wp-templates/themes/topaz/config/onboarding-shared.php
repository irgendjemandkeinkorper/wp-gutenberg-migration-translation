<?php
/**
 * Topaz.
 *
 * Onboarding config shared between Starter Packs.
 *
 * Genesis Starter Packs give you a choice of content variation when activating
 * the theme. The content below is common to all packs for this theme.
 *
 * @package Topaz
 * @author  Golfnow
 * @license GPL-2.0-or-later
 * @link    https://www.golfnow.com/
 */

return [
	'plugins'          => [
		[
			'name'       => __( 'Sugar Calendar', 'sugar-calendar' ),
			'slug'       => 'sugar-calendar/sugar-calendar.php',
			'public_url' => 'https://sugarcalendar.com/',
		],
	],
	'content'          => [
		'contact' => [
			'post_title'     => 'Contact Us',
			'post_content'   => require dirname( __FILE__ ) . '/import/content/contact.php',
			'post_type'      => 'page',
			'post_status'    => 'publish',
			'comment_status' => 'closed',
			'ping_status'    => 'closed',
		],
	],
	'navigation_menus' => [
		'primary' => [
			'homepage' => [
				'title' => 'Home',
			],
			'contact'  => [
				'title' => 'Contact Us',
			],
		],
	],
	'widgets'          => [
		'before-header' => [
			[
				'type' => 'text',
				'args' => [
					'title'  => '',
					'text'   => '<p>Social icons go here</p>',
					'filter' => 1,
					'visual' => 1,
				],
			],
			[
				'type' => 'text',
				'args' => [
					'title'  => '',
					'text'   => '<ul><li><a href="https://vip.teeitup.test/topaz-test/eclub-signup/">E-Club Signup</a></li><li><a href="https://vip.teeitup.test/topaz-test/book-a-tee-time/">Book a Tee Time</a></li></ul>',
					'filter' => 1,
					'visual' => 1,
				],
			],
		],
		'footer-1' => [
			[
				'type' => 'text',
				'args' => [
					'title'  => 'About Us',
					'text'   => '<p>Prepare yourself for an unparalleled golfing experience. Our course is a pleasure for golfers of any skill level to play. Test your accuracy with our fairways, water hazards and sand traps; we have everything you need to challenge you and improve your game.</p>',
					'filter' => 1,
					'visual' => 1,
				],
			],
			[
				'type' => 'text',
				'args' => [
					'title'  => '',
					'text'   => '<p>Social Icons go here</p>',
					'filter' => 1,
					'visual' => 1,
				],
			],
		],
		'footer-2' => [
			[
				'type' => 'text',
				'args' => [
					'title'  => 'Weather',
					'text'   => '[weather src="https://www.meteoblue.com/en/weather/widget/daily/orient_united-states-of-america_4520642?geoloc=fixed&amp;days=4&amp;tempunit=FAHRENHEIT&amp;windunit=MILE_PER_HOUR&amp;precipunit=INCH&amp;coloured=monochrome&amp;pictoicon=0&amp;pictoicon=1&amp;maxtemperature=0&amp;maxtemperature=1&amp;mintemperature=0&amp;mintemperature=1&amp;windspeed=0&amp;windspeed=1&amp;windgust=0&amp;winddirection=0&amp;winddirection=1&amp;uv=0&amp;uv=1&amp;humidity=0&amp;precipitation=0&amp;precipitation=1&amp;precipitationprobability=0&amp;precipitationprobability=1&amp;spot=0&amp;pressure=0&amp;layout=dark" width="378" height="420"]',
					'filter' => 1,
					'visual' => 1,
				],
			],
		],
		'footer-3' => [
			[
				'type' => 'text',
				'args' => [
					'title'  => 'Contact',
					'text'   => '<p>Contact Info Goes Here</p>',
					'filter' => 1,
					'visual' => 1,
				],
			],
		],
	],
];
