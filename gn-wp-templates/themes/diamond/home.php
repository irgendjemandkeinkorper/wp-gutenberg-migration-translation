<?php

add_action( 'genesis_archive_title_descriptions', 'diamond_archive_header_separator', 11 );
add_action( 'genesis_entry_header', 'diamond_content_separator' );

add_action( 'genesis_entry_header', 'diamond_post_date_box', 3 );
remove_action( 'genesis_entry_header', 'genesis_entry_header_markup_open', 5 );
remove_action( 'genesis_entry_header', 'genesis_entry_header_markup_close', 15 );
remove_action( 'genesis_entry_header', 'genesis_do_post_title' );
remove_action( 'genesis_entry_header', 'genesis_post_info', 12 );
remove_action( 'genesis_entry_header', 'diamond_content_separator' );

add_action( 'genesis_entry_content', 'genesis_entry_header_markup_open', 2 );
add_action( 'genesis_entry_content', 'genesis_entry_header_markup_close', 5 );
add_action( 'genesis_entry_content', 'genesis_do_post_title', 3 );
add_action( 'genesis_entry_content', 'genesis_post_info', 4 );

remove_action( 'genesis_entry_content', 'genesis_do_post_image', 8 );
add_action( 'genesis_entry_header', 'genesis_do_post_image', 2 );

function diamond_archive_header_separator() {
    genesis_markup( [
        'open'      => '<div %s>',
        'close'     => '</div>',
        'context'   => 'separator-2'
    ] );
}

function diamond_post_date_box() {
    global $post;

    if ( ! post_type_supports( get_post_type(), 'genesis-entry-meta-before-content' ) ) {
		return;
	}

    $the_date = '<span>' . get_the_date( 'j' ) . '</span>' . get_the_date( 'M Y' );

    genesis_markup( [
        'open'      => '<div %s>',
        'close'     => '</div>',
        'context'   => 'post-date',
        'content'   => $the_date,
    ] );
}

genesis();