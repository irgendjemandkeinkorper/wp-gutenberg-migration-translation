<?php
/**
 * Page state manager.
 *
 * @package cet-wp-theme-troon-2
 */

namespace Cet\Theme\Troon2\Layout\State;

class PageState {

	private static ?self $instance = null;

	private ?PageData $data = null;

	private function __construct() {}

	public static function getInstance(): static {
		return static::$instance ??= new static();
	}

	// ------------------------------------------------------------------
	// Static aliases
	// ------------------------------------------------------------------

	public static function init( TransparentHeaderRegistry $registry ): void {
		static::getInstance()->setup( $registry );
	}

	public static function get(): PageData {
		return static::getInstance()->getState();
	}

	public static function set( PageData $data ): void {
		static::getInstance()->setState( $data );
	}

	/** @param array<string,mixed> $props */
	public static function update( array $props ): void {
		static::getInstance()->applyUpdate( $props );
	}

	// ------------------------------------------------------------------
	// Instance methods — injectable for testing.
	// ------------------------------------------------------------------

	public function setup( TransparentHeaderRegistry $registry ): void {
		add_action( 'wp', function () use ( $registry ): void {
			$this->applyUpdate( [ 'registry' => $registry ] );
		}, 1 );
	}

	public function getState(): PageData {
		return $this->data ??= $this->resolve();
	}

	public function setState( PageData $data ): void {
		$this->data = $data;
	}

	/** @param array<string,mixed> $props */
	public function applyUpdate( array $props ): void {
		foreach ( $props as $prop => $value ) {
			$this->getState()->set( $prop, $value );
		}
	}

	private function resolve(): PageData {
		$queried = is_singular() ? get_queried_object() : null;
		$post    = $queried instanceof \WP_Post ? $queried : null;

		$blocks = $post !== null
			? array_values(
				array_filter(
					parse_blocks( $post->post_content ),
					static fn( array $block ): bool => ! empty( $block['blockName'] )
				)
			)
			: [];

		return new PageData( $post, $blocks );
	}
}
