<?php 
/**
 * Register block styles for the editor.
 * 
 * @package sunstone-pro
 */

namespace SunstonePro\Blocks\Styles;

/**
 * Registers block styles.
 *
 * @return void
 */
function register_styles() {
	register_block_style( 
		'core/cover',
		[
			'name'  => 'full-height',
			'label' => __( 'Full Height', 'sunstone-pro' ),
		]
	);

	register_block_style( 
		'core/columns',
		[
			'name'  => 'no-gap',
			'label' => __( 'No Gap', 'sunstone-pro' ),
		]
	);

	register_block_style( 
		'core/media-text',
		[
			'name'  => 'drawer',
			'label' => __( 'Slide Out', 'sunstone-pro' ),
		]
	);
}
add_action( 'init', __NAMESPACE__ . '\register_styles' );
