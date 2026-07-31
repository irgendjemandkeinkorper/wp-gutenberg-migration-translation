<?php

namespace Cet\Theme\Troon2\Integrations;

class CoreLoginoutAdapter {

	public function __construct() {
		add_filter( 'render_block_core/loginout', [ $this, 'add_button_classes' ], 10, 2 );
	}

	public function add_button_classes( string $block_content, array $block ): string {
		if ( 'core/loginout' !== ( $block['blockName'] ?? '' ) ) {
			return $block_content;
		}

		if ( ! class_exists( '\WP_HTML_Tag_Processor' ) ) {
			return $block_content;
		}

		$processor = new \WP_HTML_Tag_Processor( $block_content );

		if ( ! $processor->next_tag( [ 'class_name' => 'wp-block-loginout' ] ) ) {
			return $block_content;
		}

		$processor->add_class( 'wp-block-button' );
		$processor->add_class( 'is-style-fill' );
		$processor->add_class( 'is-size-medium' );

		if ( ! $processor->next_tag( [ 'tag_name' => 'A' ] ) ) {
			return $processor->get_updated_html();
		}

		$processor->add_class( 'wp-block-button__link' );
		$processor->add_class( 'wp-element-button' );

		return $processor->get_updated_html();
	}
}
