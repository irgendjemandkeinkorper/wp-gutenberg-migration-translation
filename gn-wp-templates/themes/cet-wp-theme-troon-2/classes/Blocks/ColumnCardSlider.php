<?php

namespace Cet\Theme\Troon2\Blocks;

class ColumnCardSlider {

	public function __construct() {
		add_filter( 'render_block', [ $this, 'add_attributes_for_sliders' ], 10, 2 );
	}

	public function add_attributes_for_sliders( $block_content, $block ) {
        if ( empty( $block['blockName'] ) || 'core/columns' !== $block['blockName'] ) {
            return $block_content;
        }

        $carousel      = ! empty( $block['attrs']['carousel'] );
        $mobile_only   = ! empty( $block['attrs']['mobileOnlyCarousel'] );

        if ( ! $carousel && ! $mobile_only ) {
            return $block_content;
        }

        if ( ! class_exists( '\WP_HTML_Tag_Processor' ) ) {
            return $block_content;
        }

        $processor = new \WP_HTML_Tag_Processor( $block_content );

        if ( ! $processor->next_tag() ) {
            return $block_content;
        }

        $processor->set_attribute( 'data-cet-carousel', $mobile_only ? 'mobile-only' : 'all' );

        $slides_per_view = ! empty( $block['attrs']['slidesPerView'] ) ? (int) $block['attrs']['slidesPerView'] : null;
        if ( $slides_per_view ) {
            $processor->set_attribute( 'data-cet-slides-per-view', $slides_per_view );
        }

        return $processor->get_updated_html();
	}
}
