<?php

remove_action( 'genesis_entry_header', 'diamond_content_separator' );

add_action( 'genesis_before_entry_content', 'diamond_entry_aside_markup_open', 2 );
add_action( 'genesis_before_entry_content', 'diamond_entry_aside_markup_close', 5 );
add_action( 'genesis_before_entry_content', 'diamond_post_date_box', 3 );
add_action( 'genesis_after_entry_content', 'diamond_entry_wrapper_close', 4 );


remove_action( 'genesis_entry_header', 'genesis_post_info', 12 );
add_action( 'genesis_entry_content', 'genesis_post_info', 4 );

function diamond_entry_aside_markup_open() {
    genesis_markup( [
        'open'      => '<section %s>',
        'context'   => 'entry-content-wrapper'
    ] );

    genesis_markup( [
        'open'      => '<aside %s>',
        'context'   => 'entry-aside'
    ] );
}

function diamond_entry_aside_markup_close() {
    genesis_markup( [
        'close'     => '</aside>',
        'context'   => 'entry-aside'
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

function diamond_entry_wrapper_close() {
    genesis_markup( [
        'close'     => '</section>',
        'contenxt'  => 'entry-content-wrapper'
    ] );
}

genesis();