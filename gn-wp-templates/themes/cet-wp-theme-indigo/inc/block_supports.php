<?php

function add_block_indigo_supports($args, $block_type) {
	if ( 'core/list' !== $block_type ) {
		return $args;
	}

	if ( ! isset( $args['supports'] ) ) {
		$args['supports'] = [];
	}

	$args['supports']['align'] = [ 'left', 'right', 'center' ];

	return $args;
}

add_filter( 'register_block_type_args', 'add_block_indigo_supports', 10, 2 );
