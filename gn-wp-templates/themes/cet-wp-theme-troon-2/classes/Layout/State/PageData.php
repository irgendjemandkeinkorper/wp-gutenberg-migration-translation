<?php
/**
 * Page state DTO.
 *
 * @package cet-wp-theme-troon-2
 */

namespace Cet\Theme\Troon2\Layout\State;

/**
 * Mutable snapshot of resolved page state for the current request.
 */
class PageData {

	/**
	 * @param \WP_Post|null                       $post             Queried post, null for non-singular requests.
	 * @param array<int,array<string,mixed>>      $blocks           Parsed, non-null content blocks.
	 * @param bool                                $hasFeaturedHero  Whether a programmatic hero banner will be rendered above content.
	 * @param TransparentHeaderRegistry           $registry         Injected at construction; update via PageState::update(['registry' => ...]).
	 */
	public function __construct(
		public ?\WP_Post $post,
		public array $blocks,
		public bool $hasFeaturedHero = false,
		private TransparentHeaderRegistry $registry = new TransparentHeaderRegistry(),
	) {}

	public function set( string $prop, mixed $value ): void {
		if ( property_exists( $this, $prop ) ) {
			$this->$prop = $value;
		}
	}

	public function firstBlockIsTransparent(): bool {
		return $this->registry->matchesBlock( $this->firstBlock() );
	}

	public function hasFeaturedHeroTemplate(): bool {
		return $this->hasFeaturedHero;
	}

	/**
	 * First parsed content block, or an empty array when there are none.
	 *
	 * @return array<string,mixed>
	 */
	public function firstBlock(): array {
		$block = $this->blocks[0] ?? [];

		return is_array( $block ) ? $block : [];
	}
}
