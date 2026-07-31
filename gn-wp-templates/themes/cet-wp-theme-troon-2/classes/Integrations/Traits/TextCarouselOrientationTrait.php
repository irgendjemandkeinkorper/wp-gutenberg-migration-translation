<?php

namespace Cet\Theme\Troon2\Integrations\Traits;

use WP_HTML_Tag_Processor;

/**
 * Provides data-cet-block-orientation stamping for is-style-text-carousel blocks.
 *
 * Detects which column contains media by inspecting parsed innerBlocks.
 * First column has media → "left". Second column has media → "right".
 * Neither column has media → attribute is not stamped.
 */
trait TextCarouselOrientationTrait {

	/**
	 * Block names considered "media" for orientation detection.
	 */
	private const MEDIA_BLOCK_NAMES = [
		'core/image',
		'core/gallery',
		'core/cover',
		'core/video',
		'ghostkit/carousel',
	];

	/**
	 * Stamps data-cet-block-orientation on text-carousel blocks.
	 *
	 * Intended for use as a render_block_{name} filter callback.
	 */
	public function stamp_text_carousel_orientation( string $content, array $block ): string {
		$classes = explode( ' ', $block['attrs']['className'] ?? '' );

		if ( ! in_array( 'is-style-text-carousel', $classes, true ) ) {
			return $content;
		}

		$firstColumn  = $block['innerBlocks'][0] ?? null;
		$secondColumn = $block['innerBlocks'][1] ?? null;

		$firstHasMedia  = $this->columnContainsMedia( $firstColumn );
		$secondHasMedia = $this->columnContainsMedia( $secondColumn );

		if ( ! $firstHasMedia && ! $secondHasMedia ) {
			return $content;
		}

		$processor = new WP_HTML_Tag_Processor( $content );

		if ( ! $processor->next_tag() ) {
			return $content;
		}

		$processor->set_attribute( 'data-cet-block-orientation', $firstHasMedia ? 'left' : 'right' );

		return $processor->get_updated_html();
	}

	/**
	 * @param array<string, mixed>|null $column Parsed column block.
	 */
	private function columnContainsMedia( ?array $column ): bool {
		if ( ! $column ) {
			return false;
		}

		foreach ( $column['innerBlocks'] ?? [] as $innerBlock ) {
			if ( in_array( $innerBlock['blockName'], self::MEDIA_BLOCK_NAMES, true ) ) {
				return true;
			}
		}

		return false;
	}
}
