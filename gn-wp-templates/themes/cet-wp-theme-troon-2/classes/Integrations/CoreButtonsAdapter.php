<?php

namespace Cet\Theme\Troon2\Integrations;

class CoreButtonsAdapter {

    public function __construct() {
        add_filter( 'render_block', [ $this, 'render_button_size_class' ], 10, 2 );
        add_filter( 'render_block_core/button', [ $this, 'render_default_class'], 10, 2 );
    }

    /**
     * Add size class on frontend render only.
     * This avoids changing saved block markup and prevents validation issues.
     */
    public function render_button_size_class( $block_content, $block ) {
        if ( empty( $block['blockName'] ) || 'core/button' !== $block['blockName'] ) {
            return $block_content;
        }

        $size = isset( $block['attrs']['buttonSize'] ) ? $block['attrs']['buttonSize'] : 'medium';

        if ( ! in_array( $size, array( 'large', 'medium', 'small' ), true ) ) {
            $size = 'medium';
        }

        if ( ! class_exists( '\WP_HTML_Tag_Processor' ) ) {
            return $block_content;
        }

        $processor = new \WP_HTML_Tag_Processor( $block_content );

        if ( $processor->next_tag( array( 'class_name' => 'wp-block-button' ) ) ) {
            $processor->add_class( 'is-size-' . $size );
            return $processor->get_updated_html();
        }

        return $block_content;
    }

    /**
     * Add default is-style-fill class that omitted by WP
     */
    public function render_default_class( string $content ): string {
        if ( str_contains( $content, 'is-style-' ) ) {
            return $content;
        }

        return preg_replace(
            '/class="wp-block-button/',
            'class="wp-block-button is-style-fill',
            $content,
            1
        );
    }
}
