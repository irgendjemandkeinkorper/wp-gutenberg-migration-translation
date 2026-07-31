<?php
/**
 * GolfNow - Pine
 *
 * Theme Settings for Genesis
 *
 * @package GolfNow - Pine
 * @author  NBCU Sports Next
 * @license GPL-2.0-or-later
 * @link    https://business.golfnow.com/Website-Theme-Library/
 */

return [
    GENESIS_SETTINGS_FIELD => [
        'blog_cat_num'              => 6,
        'breadcrumb_home'           => 0,
        'breadcrumb_front_page'     => 0,
        'breadcrumb_posts_page'     => 0,
        'breadcrumb_single'         => 0,
        'breadcrumb_page'           => 0,
        'breadcrumb_archive'        => 0,
        'breadcrumb_404'            => 0,
        'breadcrumb_attachment'     => 0,
        'content_archive'           => 'full',
        'content_archive_limit'     => 0,
        'content_archive_thumbnail' => 1,
        'show_featured_image_page'  => 1,
        'show_featured_image_post'  => 1,
        'entry_meta_after_content'  => '[post_categories before=""][post_tags before=""]',
        'entry_meta_before_content' => '<span><span class="bi bi-person-circle"></span> [post_author_posts_link]</span> <span><span class="bi bi-calendar3"></span> [post_date]</span> [post_edit]',
        'image_size'                => 'genesis-singular-images',
        'image_alignment'           => 'aligncenter',
        'posts_nav'                 => 'numeric',
        'site_layout'               => 'full-width-content',
    ],
    'posts_per_page'                => 6,
    'child_override_logo_color'     => 'black',
];
