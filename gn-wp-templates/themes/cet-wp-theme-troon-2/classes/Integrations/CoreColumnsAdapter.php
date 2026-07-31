<?php

namespace Cet\Theme\Troon2\Integrations;

use Cet\Theme\Troon2\Integrations\Traits\TextCarouselOrientationTrait;
use WP_HTML_Tag_Processor;

/**
 * Adapts core/columns blocks for theme use.
 *
 * Responsibilities:
 * - Removes WP's generated layout container class to prevent inline flex-wrap
 *   styles from conflicting with theme CSS.
 * - Stamps data-cet-block-orientation on is-style-text-carousel blocks.
 */
class CoreColumnsAdapter {

	use TextCarouselOrientationTrait;

	public function __construct() {
		add_filter( 'render_block_core/columns', [ $this, 'remove_container_class' ], 11, 2 );
		add_filter( 'render_block_core/columns', [ $this, 'stamp_text_carousel_orientation' ], 12, 2 );
	}

	/**
	 * Strips the generated layout class from the first nested wp-block-columns inside
	 * the is-style-instructor block. Hooks the outer block because inner blocks are
	 * already fully rendered into $content by the time this filter fires.
	 */
	public function remove_container_class( string $content, array $block ): string {
		if ( ! in_array( 'is-style-instructor', explode( ' ', $block['attrs']['className'] ?? '' ), true ) ) {
			return $content;
		}

		$processor = new WP_HTML_Tag_Processor( $content );
		$count     = 0;

		while ( $processor->next_tag( [ 'tag_name' => 'DIV', 'class_name' => 'wp-block-columns' ] ) ) {
			if ( ++$count > 1 ) {
				$processor->set_attribute(
					'class',
					trim( preg_replace( '/\s*wp-block-[\w-]+/', '', $processor->get_attribute( 'class' ) ?? '', 1 ) )
				);
				break;
			}
		}

		return $processor->get_updated_html();
	}
}
