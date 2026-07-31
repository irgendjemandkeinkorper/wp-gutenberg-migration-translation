<?php
/**
 * Block supports adjustments
 *
 * Reserved for future block support customizations.
 *
 * @package cet-wp-theme-troon-2
 */

/**
 * Adjust block supports.
 *
 * @param array  $args       Block registration arguments.
 * @param string $block_type Block type name.
 * @return array
 */
function cet_troon_2_block_supports( array $args, string $block_type ): array {

	// remove is-layout-constrained CSS class from the block with PHP,
	// to not override default block styles
	if ( 'core/cover' === $block_type ) {
		unset( $args['supports']['layout'] );
	}

	// Disable layout controls that conflict with the entity-host contract system.
	// When core/group acts as an entity host the contract owns width and spacing;
	// Justification, Content Width, and Wide Width would produce inline style/class
	// overrides (is-layout-constrained, contentSize, wideSize) that fight contract CSS.
	// Ideally this would target only host groups, but register_block_type_args is
	// per-type — disabling globally is the PHP-level compromise.
	if ( 'core/group' === $block_type ) {
		$layout = $args['supports']['layout'] ?? [];
		if ( ! is_array( $layout ) ) {
			$layout = [];
		}
		$layout['allowJustification']            = false;
		$layout['allowCustomContentAndWideSize'] = false;
		$args['supports']['layout']              = $layout;
	}

	return $args;
}

add_filter( 'register_block_type_args', 'cet_troon_2_block_supports', 10, 2 );