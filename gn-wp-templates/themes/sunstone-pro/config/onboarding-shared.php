<?php
/**
 * Sunstone Pro.
 *
 * Onboarding config shared between Starter Packs.
 *
 * Genesis Starter Packs give you a choice of content variation when activating
 * the theme. The content below is common to all packs for this theme.
 *
 * @package Sunstone Pro
 */

return [
	'plugins'          => [],
	'content'          => [],
	'navigation_menus' => [],
	'widgets'          => [
		'footer-1' => [
			[
				'type' => 'text',
				'args' => [
					'title'  => 'Design',
					'text'   => '<p>With an emphasis on typography, white space, and mobile-optimized design, your website will look absolutely breathtaking.</p><p><a href="#">Learn more about design</a>.</p>',
					'filter' => 1,
					'visual' => 1,
				],
			],
		],
		'footer-2' => [
			[
				'type' => 'text',
				'args' => [
					'title'  => 'Content',
					'text'   => '<p>Our team will teach you the art of writing audience-focused content that will help you achieve the success you truly deserve.</p><p><a href="#">Learn more about content</a>.</p>',
					'filter' => 1,
					'visual' => 1,
				],
			],
		],
		'footer-3' => [
			[
				'type' => 'text',
				'args' => [
					'title'  => 'Strategy',
					'text'   => '<p>We help creative entrepreneurs build their digital business by focusing on three key elements of a successful online platform.</p><p><a href="#">Learn more about strategy</a>.</p>',
					'filter' => 1,
					'visual' => 1,
				],
			],
		],
	],
];
