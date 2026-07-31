<?php

namespace Cet\Theme\Troon2\Blocks;

use \WP_HTML_Tag_Processor;

/**
 * Instructors Tabs Handler
 *
 * Adds tab data attributes (JS contracts) and cet-* CSS classes to instructors
 * section blocks. Runs after BlockContracts (priority 10).
 *
 * Data attributes — JS only:
 *   data-cet-tab-trigger="N"  index used by frontend/editor JS to find and activate triggers
 *   data-cet-tab-panel="N"    index used by frontend/editor JS to find and show/hide panels
 *
 * CSS classes — styling only:
 *   cet-tabs-trigger-link     on the interactive trigger element (<a> or <button>)
 *
 * @package cet-wp-theme-troon-2
 */
class InstructorsTabs {

	public function __construct() {
		add_filter( 'render_block', [ $this, 'applyTabContracts' ], 20, 2 );
	}

	/**
	 * Dispatch tab contracts to the appropriate handler.
	 *
	 * @param string               $blockContent Rendered block HTML.
	 * @param array<string, mixed> $block        Block data.
	 * @return string
	 */
	public function applyTabContracts( string $blockContent, array $block ): string {
		$blockName = $block['blockName'] ?? '';

		if ( $blockName === 'core/columns' ) {
			$classes = explode( ' ', $block['attrs']['className'] ?? '' );
			if ( ! in_array( 'is-style-instructors', $classes, true ) ) {
				return $blockContent;
			}

			$blockContent = $this->addTriggerContracts( $blockContent );
			$blockContent = $this->addPanelContracts( $blockContent );
			$blockContent = $this->addClassToElement( $blockContent, 'is-style-instructors-panels', 'cet-tabs-panels' );

			return $blockContent;
		}

		if ( $blockName === 'ghostkit/tabs-v2' ) {
			return $this->addGhostkitTabClasses( $blockContent );
		}

		return $blockContent;
	}

	/**
	 * Add data-cet-tab-trigger index and cet-tabs-trigger-link class to each
	 * trigger link inside the nav container.
	 *
	 * Uses depth tracking so links inside instructor cards are not tagged.
	 *
	 * @param string $html Block HTML.
	 * @return string
	 */
	private function addTriggerContracts( string $html ): string {
		$processor = new WP_HTML_Tag_Processor( $html );
		$index     = 0;
		$in_nav    = false;
		$depth     = 0;

		while ( $processor->next_tag( [ 'tag_closers' => 'visit' ] ) ) {
			if ( $processor->is_tag_closer() ) {
				if ( $in_nav && --$depth === 0 ) {
					break;
				}
				continue;
			}

			if ( ! $in_nav ) {
				if ( $processor->has_class( 'cet-tabs-nav' ) ) {
					$in_nav = true;
					$depth  = 1;
				}
				continue;
			}

			$depth++;

			if ( $processor->has_class( 'wp-block-button' ) ) {
				$processor->remove_class( 'is-style-fill' );
			}

			if ( $processor->has_class( 'wp-block-button__link' ) ) {
				$processor->set_attribute( 'data-cet-tab-trigger', (string) $index );
				$processor->add_class( 'cet-tabs-trigger-link' );
				$index++;
			}
		}

		return $processor->get_updated_html();
	}

	/**
	 * Add data-cet-tab-panel index to each panel column.
	 *
	 * @param string $html Block HTML.
	 * @return string
	 */
	private function addPanelContracts( string $html ): string {
		$processor = new WP_HTML_Tag_Processor( $html );
		$index     = 0;

		while ( $processor->next_tag( [ 'class_name' => 'is-style-instructors-panel' ] ) ) {
			$processor->set_attribute( 'data-cet-tab-panel', (string) $index );
			$index++;
		}

		return $processor->get_updated_html();
	}

	/**
	 * Add cet-* CSS classes to ghostkit/tabs-v2 elements.
	 *
	 * No data attributes — ghostkit manages its own tab switching logic.
	 *
	 * @param string $html Block HTML.
	 * @return string
	 */
	private function addGhostkitTabClasses( string $html ): string {
		$html = $this->addClassToElement( $html, 'ghostkit-tabs-buttons', 'cet-tabs-nav' );
		$html = $this->addClassToAllElements( $html, 'ghostkit-tabs-buttons-item', 'cet-tabs-trigger-link' );
		$html = $this->addClassToElement( $html, 'ghostkit-tabs-content', 'cet-tabs-panels' );

		return $html;
	}

	/**
	 * Add a CSS class to the first element matching a given class name.
	 *
	 * @param string $html       Block HTML.
	 * @param string $matchClass Class to match.
	 * @param string $addClass   Class to add.
	 * @return string
	 */
	private function addClassToElement( string $html, string $matchClass, string $addClass ): string {
		$processor = new WP_HTML_Tag_Processor( $html );

		if ( $processor->next_tag( [ 'class_name' => $matchClass ] ) ) {
			$processor->add_class( $addClass );
		}

		return $processor->get_updated_html();
	}

	/**
	 * Add a CSS class to all elements matching a given class name.
	 *
	 * @param string $html       Block HTML.
	 * @param string $matchClass Class to match.
	 * @param string $addClass   Class to add.
	 * @return string
	 */
	private function addClassToAllElements( string $html, string $matchClass, string $addClass ): string {
		$processor = new WP_HTML_Tag_Processor( $html );

		while ( $processor->next_tag( [ 'class_name' => $matchClass ] ) ) {
			$processor->add_class( $addClass );
		}

		return $processor->get_updated_html();
	}
}
