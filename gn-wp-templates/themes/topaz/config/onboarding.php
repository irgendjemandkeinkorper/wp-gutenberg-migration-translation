<?php
/**
 * Topaz.
 *
 * Onboarding config to load plugins and homepage content on theme activation.
 *
 * @package Topaz
 * @author  Golfnow
 * @license GPL-2.0-or-later
 * @link    https://www.golfnow.com/
 */

$topaz_shared_content = genesis_get_config( 'onboarding-shared' );

return [
	'starter_packs' => [
		'black-white' => [
			'title'       => __( 'Standard Topaz', 'topaz' ),
			'description' => __( 'The standard Topaz install.', 'topaz' ),
			'thumbnail'   => get_stylesheet_directory_uri() . '/config/import/images/thumbnails/home-standard.jpg',
			'demo_url'    => 'https://vip.teeitup.com/topaz/',
			'config'      => [
				'dependencies'     => [
					'plugins' => $topaz_shared_content['plugins'],
				],
				'content'          => array_merge(
					[
						'homepage' => [
							'post_title'     => 'Homepage',
							'post_content'   => require dirname( __FILE__ ) . '/import/content/home-standard.php',
							'post_type'      => 'page',
							'post_status'    => 'publish',
							'comment_status' => 'closed',
							'ping_status'    => 'closed',
							'meta_input'     => [
								'_genesis_layout'     => 'full-width-content',
								'_genesis_hide_title' => true,
								'_genesis_hide_breadcrumbs' => true,
								'_genesis_hide_singular_image' => true,
							],
						],
					],
					$topaz_shared_content['content']
				),
				'navigation_menus' => $topaz_shared_content['navigation_menus'],
				'widgets'          => $topaz_shared_content['widgets'],
			],
		],
	],
];
