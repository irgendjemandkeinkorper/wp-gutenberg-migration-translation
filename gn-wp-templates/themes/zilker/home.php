<?php

add_action( 'genesis_archive_title_descriptions', 'zilker_archive_header_separator', 11 );
remove_action( 'genesis_entry_header', 'zilker_content_separator' );

remove_action( 'genesis_entry_header', 'genesis_do_breadcrumbs', 11 );
add_action( 'genesis_archive_title_descriptions', 'genesis_do_breadcrumbs' );

add_action( 'genesis_entry_content', 'zilker_read_more_button' );

function zilker_read_more_button() {
    global $post;

    genesis_markup( [
        'open'          => '<a %s>',
        'close'         => '</a>',
        'context'       => 'read-more-button',
        'content'       => 'Read More',
        'atts'          => [
            'href'      => get_permalink( $post ),
            'class'     => 'btn btn-outline btn-small read-more-button'
        ],
    ] );
}

function zilker_archive_header_separator() {
    genesis_markup( [
        'open'      => '<div %s>',
        'close'     => '</div>',
        'context'   => 'separator-2'
    ] );
}

genesis();