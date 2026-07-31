<?php

namespace Cet\Theme\Troon2\Integrations;

class WebresEzteeLinkAdapter {

	public function __construct() {
		add_filter( 'render_block_webres/eztee-link', [ $this, 'add_default_button_classes' ], 10, 2 );
	}

	public function add_default_button_classes( string $block_content, array $block ): string {
		if ( 'webres/eztee-link' !== ( $block['blockName'] ?? '' ) ) {
			return $block_content;
		}

		if ( ! class_exists( '\WP_HTML_Tag_Processor' ) ) {
			return $block_content;
		}

		$processor = new \WP_HTML_Tag_Processor( $block_content );

		if ( ! $processor->next_tag( [ 'class_name' => 'wp-block-button' ] ) ) {
			return $block_content;
		}

		$processor->add_class( 'is-style-fill' );
		$processor->add_class( 'is-size-medium' );

		return $processor->get_updated_html();
	}
}
