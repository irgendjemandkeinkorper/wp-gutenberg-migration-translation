<?php
/**
 * Entry markup customizations for pages.
 *
 * @package Sunstone Pro
 */

declare( strict_types=1 );

namespace SunstonePro;

/**
 * Entry markup customizations for pages.
 *
 * Replaces article elements with divs and adjusts entry headers on pages.
 *
 * @package Sunstone Pro
 */
final class EntryMarkup {

	/**
	 * Hook adapter instance.
	 *
	 * @var WordPressHooks
	 */
	private WordPressHooks $hooks;

	/**
	 * Constructor.
	 *
	 * @param WordPressHooks $hooks Hook adapter.
	 */
	public function __construct( WordPressHooks $hooks ) {
		$this->hooks = $hooks;
	}

	/**
	 * Registers all entry markup hooks.
	 */
	public function register_hooks() {
		$this->hooks->add_filter( 'genesis_markup_entry_open', [ $this, 'replace_article_open_with_div' ] );
		$this->hooks->add_filter( 'genesis_attr_entry', [ $this, 'remove_entry_aria_label' ] );
		$this->hooks->add_filter( 'genesis_markup_entry_close', [ $this, 'replace_article_close_with_div' ] );

		$this->hooks->remove_action( 'genesis_entry_header', 'genesis_entry_header_markup_open', 5 );
		$this->hooks->remove_action( 'genesis_entry_header', 'genesis_entry_header_markup_close', 15 );

		$this->hooks->add_action( 'genesis_entry_header', [ $this, 'entry_header_open' ], 5 );
		$this->hooks->add_action( 'genesis_entry_header', [ $this, 'entry_header_close' ], 15 );
	}

	/**
	 * Replaces the entry opening article tag with a div on pages.
	 *
	 * @param string $open Opening markup.
	 * @return string Modified opening markup.
	 */
	public function replace_article_open_with_div( string $open ): string {
		if ( is_page() ) {
			$open = str_replace( '<article', '<div', $open );
		}

		return $open;
	}

	/**
	 * Removes the aria-label attribute from entry elements on pages.
	 *
	 * @param array $attributes Entry element attributes.
	 * @return array Modified attributes.
	 */
	public function remove_entry_aria_label( array $attributes ): array {
		if ( is_page() ) {
			unset( $attributes['aria-label'] );
		}

		return $attributes;
	}

	/**
	 * Replaces the entry closing article tag with a div on pages.
	 *
	 * @param string $close Closing markup.
	 * @return string Modified closing markup.
	 */
	public function replace_article_close_with_div( string $close ): string {
		if ( is_page() ) {
			$close = str_replace( '</article>', '</div>', $close );
		}

		return $close;
	}

	/**
	 * Outputs the opening tag for the entry header.
	 *
	 * Uses div on pages and header elsewhere.
	 */
	public function entry_header_open() {
		if ( genesis_entry_header_hidden_on_current_page() ) {
			return;
		}

		if ( is_page() ) {
			// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- genesis_attr() returns pre-escaped attribute string.
			printf( '<div %s>', genesis_attr( 'entry-header' ) );
		} else {
			// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- genesis_attr() returns pre-escaped attribute string.
			printf( '<header %s>', genesis_attr( 'entry-header' ) );
		}
	}

	/**
	 * Outputs the closing tag for the entry header.
	 *
	 * Uses div on pages and header elsewhere.
	 */
	public function entry_header_close() {
		if ( genesis_entry_header_hidden_on_current_page() ) {
			return;
		}

		if ( is_page() ) {
			echo '</div>';
		} else {
			echo '</header>';
		}
	}
}
