<?php
/**
 * First block decorator.
 *
 * @package cet-wp-theme-troon-2
 */

namespace Cet\Theme\Troon2\Layout;

use Cet\Theme\Troon2\Layout\State\PageState;

/**
 * Adds a hero class to the outermost element of the first content block.
 *
 * - cet-video-hero-block when the first block is a core/video that slides under the header
 */
class FirstBlockDecorator {

	private bool $decorated = false;

	public function __construct() {
		add_filter( 'render_block', [ $this, 'addHeroClass' ], PHP_INT_MAX, 2 );
	}

	/**
	 * @param string               $block_content
	 * @param array<string,mixed>  $block
	 * @return string
	 */
	public function addHeroClass( string $block_content, array $block ): string {
		if ( $this->decorated || ! is_singular() || empty( $block_content ) ) {
			return $block_content;
		}

		$state = PageState::get();
		$first = $state->firstBlock();

		if ( ( $block['blockName'] ?? '' ) !== ( $first['blockName'] ?? '' )
			|| $block['attrs'] !== $first['attrs'] ) {
			return $block_content;
		}

		$this->decorated = true;

		$class = ($state->firstBlockIsTransparent() && $block['blockName'] === 'core/video') ? 'cet-video-hero-block' : '';

		$processor = new \WP_HTML_Tag_Processor( $block_content );
		if ( $processor->next_tag() ) {
			$processor->add_class( $class );
		}

		return $processor->get_updated_html();
	}
}
