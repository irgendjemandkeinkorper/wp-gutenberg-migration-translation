<?php

namespace Cet\Theme\Troon2\Integrations;

/**
 * Restores the wp-block-group__inner-container wrapper removed in WP 6.3.
 *
 * Ghostkit per-block inline CSS (stored in the database as ghostkit-custom-*
 * selectors) was generated when WP wrapped group content in an inner-container
 * div. That wrapper acted as a single flex child of the Ghostkit-positioned
 * group, allowing the group's display:flex centering to work correctly while
 * content stacked vertically inside the container.
 *
 * WP 6.3 dropped the wrapper, making all content elements direct flex children.
 * Combined with WP core's is-layout-constrained applying margin:auto to each
 * child, the content collapses to min-content width in a flex row.
 *
 * This adapter restores the wrapper only for groups that carry a ghostkit-custom-*
 * className — a reliable signal that the block has old stored CSS with this
 * structural assumption. New blocks re-saved after WP 6.3 don't have this
 * assumption and are unaffected.
 *
 * Remove this adapter once all affected blocks have been re-saved through the
 * block editor (Ghostkit regenerates CSS for the new structure on save).
 */
class CoreGroupAdapter {

	public function __construct() {
		add_filter( 'render_block', [ $this, 'restore_inner_container' ], 10, 2 );
	}

	public function restore_inner_container( string $block_content, array $block ): string {
		if ( 'core/group' !== ( $block['blockName'] ?? '' ) ) {
			return $block_content;
		}

		// Only for blocks with Ghostkit per-block CSS generated against the old structure.
		if ( ! preg_match( '/\bghostkit-custom-\S+/', $block['attrs']['className'] ?? '' ) ) {
			return $block_content;
		}

		// Already has the inner container — old WP generated it natively, nothing to do.
		if ( str_contains( $block_content, 'wp-block-group__inner-container' ) ) {
			return $block_content;
		}

		// Read layout classes from the outer group div.
		$processor = new \WP_HTML_Tag_Processor( $block_content );

		if ( ! $processor->next_tag( [ 'tag_name' => 'DIV', 'class_name' => 'wp-block-group' ] ) ) {
			return $block_content;
		}

		$raw_classes   = explode( ' ', $processor->get_attribute( 'class' ) ?? '' );
		$layout_classes = array_values( array_filter( $raw_classes, static function ( string $c ): bool {
			return str_starts_with( $c, 'is-layout-' ) || str_starts_with( $c, 'wp-block-group-is-layout-' );
		} ) );

		// No layout classes — the constrained-layout issue doesn't apply.
		if ( empty( $layout_classes ) ) {
			return $block_content;
		}

		// Move layout classes off the outer div; they belong on the inner container.
		foreach ( $layout_classes as $cls ) {
			$processor->remove_class( $cls );
		}

		$updated = $processor->get_updated_html();

		// Inject the inner-container after the outer opening div's closing >.
		// The outer div is always the first tag in the rendered group output.
		$open_end = strpos( $updated, '>' );
		if ( false === $open_end ) {
			return $block_content;
		}

		// The outer closing </div> is always the last one in the block output.
		$last_close = strrpos( $updated, '</div>' );
		if ( false === $last_close ) {
			return $block_content;
		}

		$inner_cls = implode( ' ', $layout_classes );

		return substr( $updated, 0, $open_end + 1 )
			. sprintf( '<div class="wp-block-group__inner-container %s">', $inner_cls )
			. substr( $updated, $open_end + 1, $last_close - ( $open_end + 1 ) )
			. '</div>'
			. substr( $updated, $last_close );
	}
}
