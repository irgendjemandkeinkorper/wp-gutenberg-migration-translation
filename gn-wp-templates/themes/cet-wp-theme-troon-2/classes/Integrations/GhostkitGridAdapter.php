<?php

namespace Cet\Theme\Troon2\Integrations;

use Cet\Theme\Troon2\Integrations\Traits\TextCarouselOrientationTrait;

/**
 * Adapts ghostkit/grid blocks for theme use.
 *
 * Stamps data-cet-block-orientation on is-style-text-carousel blocks.
 */
class GhostkitGridAdapter {

	use TextCarouselOrientationTrait;

	public function __construct() {
		add_filter( 'render_block_ghostkit/grid', [ $this, 'stamp_text_carousel_orientation' ], 12, 2 );
	}
}
