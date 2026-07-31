<?php

namespace Cet\Theme\Troon2\Blocks;

class TestimonialsSlider {

	public function __construct() {
		add_filter( 'render_block', [ $this, 'apply_slider_to_first_nested_columns' ], 10, 2 );
	}

	public function apply_slider_to_first_nested_columns( $block_content, $block ) {
		if ( 'core/columns' !== ( $block['blockName'] ?? '' ) ) {
			return $block_content;
		}

		$class_name = $block['attrs']['className'] ?? '';
		if ( ! str_contains( $class_name, 'is-style-testimonials' ) ) {
			return $block_content;
		}

		if ( ! class_exists( '\WP_HTML_Tag_Processor' ) ) {
			return $block_content;
		}

		$processor = new \WP_HTML_Tag_Processor( $block_content );

		if ( $processor->next_tag( [ 'class_name' => 'wp-block-columns' ] ) ) {
			$processor->add_class( 'splide' );
		}

		if ( $processor->next_tag( [ 'class_name' => 'wp-block-columns' ] ) ) {
			$processor->add_class( 'splide__track' );
		}

		$block_content = $processor->get_updated_html();

		return $this->wrap_slide_children( $block_content );
	}

	private function wrap_slide_children( string $html ): string {
		libxml_use_internal_errors( true );

		try {
			$dom = new \DOMDocument();
			$dom->loadHTML(
				mb_convert_encoding( '<div id="__splide_root__">' . $html . '</div>', 'HTML-ENTITIES', 'UTF-8' ),
				LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD
			);
			libxml_clear_errors();

			$xpath       = new \DOMXPath( $dom );
			$track_nodes = $xpath->query( '//*[contains(concat(" ",normalize-space(@class)," ")," splide__track ")]' );

			if ( 0 === $track_nodes->length ) {
				return $html;
			}

			$track          = $track_nodes->item( 0 );
			$slide_children = [];

			foreach ( $track->childNodes as $child ) {
				if (
					XML_ELEMENT_NODE === $child->nodeType &&
					str_contains( $child->getAttribute( 'class' ), 'wp-block-column' )
				) {
					$slide_children[] = $child;
				}
			}

			if ( empty( $slide_children ) ) {
				return $html;
			}

			$list = $dom->createElement( 'div' );
			$list->setAttribute( 'class', 'splide__list' );

			foreach ( $slide_children as $child ) {
				$child->setAttribute( 'class', trim( $child->getAttribute( 'class' ) . ' splide__slide' ) );
				$list->appendChild( $track->removeChild( $child ) );
			}

			$track->appendChild( $list );

			$root   = $dom->getElementById( '__splide_root__' );
			$result = '';
			foreach ( $root->childNodes as $child ) {
				$result .= $dom->saveHTML( $child );
			}

			return $result;
		} catch ( \Exception ) {
			libxml_clear_errors();
			return $html;
		}
	}
}
