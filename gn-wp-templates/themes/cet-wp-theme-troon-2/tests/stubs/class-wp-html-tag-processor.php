<?php

declare(strict_types=1);

/**
 * Minimal WP_HTML_Tag_Processor polyfill for unit tests.
 *
 * Implements only the methods ContractEngineV2 uses:
 *   next_tag(), add_class(), set_attribute(), get_updated_html()
 *
 * Uses regex-based mutation against double-quoted HTML attributes, which
 * matches WordPress block output. Does NOT handle single-quoted attributes,
 * self-closing tags, or CDATA — sufficient for the test HTML we exercise.
 */
class WP_HTML_Tag_Processor {

	private string $html;

	/** Byte offset of < for the currently matched tag. */
	private int $matchStart = -1;

	/** Byte offset of the character after > for the currently matched tag. */
	private int $matchEnd = -1;

	/** Next search offset — advanced past each match so while-loops work. */
	private int $cursor = 0;

	public function __construct( string $html ) {
		$this->html = $html;
	}

	/**
	 * Advance to the next opening HTML tag.
	 *
	 * @param array<string,string>|null $query Optional. Supports 'class_name' to
	 *                                         seek a tag that carries a specific class.
	 */
	public function next_tag( ?array $query = null ): bool {
		$requiredClass = $query['class_name'] ?? null;
		$offset        = $this->cursor;

		while ( preg_match( '/<([a-zA-Z][a-zA-Z0-9]*)(\s[^>]*)?>/', $this->html, $m, PREG_OFFSET_CAPTURE, $offset ) ) {
			$tagFull  = $m[0][0];
			$tagStart = (int) $m[0][1];
			$attrs    = isset( $m[2] ) ? $m[2][0] : '';
			$tagEnd   = $tagStart + strlen( $tagFull );

			if ( $requiredClass !== null ) {
				if ( ! preg_match( '/\bclass="([^"]*)"/', $attrs, $cm ) ) {
					$offset = $tagEnd;
					continue;
				}
				$classes = preg_split( '/\s+/', trim( $cm[1] ), -1, PREG_SPLIT_NO_EMPTY );
				if ( ! in_array( $requiredClass, $classes, true ) ) {
					$offset = $tagEnd;
					continue;
				}
			}

			$this->matchStart = $tagStart;
			$this->matchEnd   = $tagEnd;
			$this->cursor     = $tagEnd;
			return true;
		}

		$this->matchStart = -1;
		$this->matchEnd   = -1;
		return false;
	}

	/**
	 * Add a class to the current tag.
	 * Appends to the existing class attribute, or creates one if absent.
	 */
	public function add_class( string $class ): void {
		if ( $this->matchStart < 0 ) {
			return;
		}

		$this->mutateTag( function ( string $tag ) use ( $class ): string {
			if ( preg_match( '/\bclass="([^"]*)"/', $tag, $m, PREG_OFFSET_CAPTURE ) ) {
				$current = trim( $m[1][0] );
				$newVal  = $current !== '' ? $current . ' ' . $class : $class;
				$newAttr = 'class="' . $newVal . '"';
				return substr( $tag, 0, $m[0][1] ) . $newAttr . substr( $tag, $m[0][1] + strlen( $m[0][0] ) );
			}

			// No class attribute — insert before the closing >.
			return rtrim( substr( $tag, 0, -1 ) ) . ' class="' . $class . '">';
		} );
	}

	/**
	 * Set an attribute on the current tag.
	 * Replaces the value if the attribute already exists, adds it otherwise.
	 */
	public function set_attribute( string $name, string $value ): void {
		if ( $this->matchStart < 0 ) {
			return;
		}

		$escaped = htmlspecialchars( $value, ENT_QUOTES | ENT_HTML5, 'UTF-8', false );
		$nameEsc = preg_quote( $name, '/' );

		$this->mutateTag( function ( string $tag ) use ( $name, $escaped, $nameEsc ): string {
			if ( preg_match( '/\b' . $nameEsc . '="[^"]*"/', $tag, $m, PREG_OFFSET_CAPTURE ) ) {
				$newAttr = $name . '="' . $escaped . '"';
				return substr( $tag, 0, $m[0][1] ) . $newAttr . substr( $tag, $m[0][1] + strlen( $m[0][0] ) );
			}

			// Attribute absent — insert before the closing >.
			return rtrim( substr( $tag, 0, -1 ) ) . ' ' . $name . '="' . $escaped . '">';
		} );
	}

	public function get_updated_html(): string {
		return $this->html;
	}

	/**
	 * Apply a mutation function to the currently matched tag substring.
	 * Updates $html in-place and adjusts cursor/matchEnd for the length delta.
	 */
	private function mutateTag( callable $fn ): void {
		$tag    = substr( $this->html, $this->matchStart, $this->matchEnd - $this->matchStart );
		$newTag = $fn( $tag );
		$delta  = strlen( $newTag ) - strlen( $tag );

		$this->html     = substr( $this->html, 0, $this->matchStart ) . $newTag . substr( $this->html, $this->matchEnd );
		$this->matchEnd += $delta;
		$this->cursor   += $delta;
	}
}
