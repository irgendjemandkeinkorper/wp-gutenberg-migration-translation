<?php

namespace Cet\Theme\Troon2\Integrations;

class CoreCoverAdapter {

	const COVER_STYLES = [ 'is-style-feature', 'is-style-hero-short-image', 'is-style-contact' ];

	public function __construct() {
		add_filter( 'render_block', [ $this, 'remove_dim_zero_for_feature_style' ], 10, 2 );
	}

	/**
	 * Remove has-background-dim-0 from the overlay span for the feature banner style.
	 *
	 * dim-0 sets overlay opacity to 0 via inline style, which conflicts with
	 * the feature banner's background treatment.
	 */
	public function remove_dim_zero_for_feature_style( string $block_content, array $block ): string {
		if ( 'core/cover' !== ( $block['blockName'] ?? '' ) ) {
			return $block_content;
		}

		$class_name = $block['attrs']['className'] ?? '';

		$classes = explode( ' ', $class_name );

		if ( ! array_intersect( $classes, self::COVER_STYLES ) ) {
			return $block_content;
		}

		$processor = new \WP_HTML_Tag_Processor( $block_content );

		while ( $processor->next_tag( 'span' ) ) {
			if (
				$processor->has_class( 'wp-block-cover__background' ) &&
				$processor->has_class( 'has-background-dim-0' )
			) {
				$processor->remove_class( 'has-background-dim-0' );
				break;
			}
		}

		return $processor->get_updated_html();
	}
}
