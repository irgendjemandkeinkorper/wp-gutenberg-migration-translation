<?php
/**
 * Sunstone Pro theme settings.
 *
 * Genesis 2.9+ updates these settings when themes are activated.
 *
 * @package Sunstone Pro
 */

return [
	GENESIS_SETTINGS_FIELD => [
		'blog_cat_num'              => 6,
		'breadcrumb_home'           => 0,
		'breadcrumb_front_page'     => 0,
		'breadcrumb_posts_page'     => 0,
		'breadcrumb_single'         => 1,
		'breadcrumb_page'           => 1,
		'breadcrumb_archive'        => 1,
		'breadcrumb_404'            => 0,
		'breadcrumb_attachment'     => 0,
		'content_archive'           => 'full',
		'content_archive_limit'     => 0,
		'content_archive_thumbnail' => 0,
		'entry_meta_after_content'  => '[post_categories] [post_tags]',
		'entry_meta_before_content' => '[post_date] ' . __( 'by', 'sunstone-pro' ) . ' [post_author_posts_link] [post_comments] [post_edit]',
		'image_size'                => 'genesis-singular-images',
		'image_alignment'           => 'aligncenter',
		'posts_nav'                 => 'numeric',
		'site_layout'               => 'full-width-content',
	],
	'posts_per_page'       => 9,
];
