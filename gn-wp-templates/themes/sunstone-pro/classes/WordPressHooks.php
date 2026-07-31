<?php
/**
 * Typed hook adapter for WordPress actions and filters.
 *
 * @package Sunstone Pro
 */

declare( strict_types=1 );

namespace SunstonePro;

/**
 * Typed hook adapter for WordPress actions and filters.
 *
 * @package Sunstone Pro
 */
final class WordPressHooks {

	/**
	 * Registers a filter callback.
	 *
	 * @param string   $hook         Hook name.
	 * @param callable $callback     Callback function.
	 * @param int      $priority     Priority.
	 * @param int      $accepted_args Number of accepted arguments.
	 */
	public function add_filter( string $hook, callable $callback, int $priority = 10, int $accepted_args = 1 ) {
		add_filter( $hook, $callback, $priority, $accepted_args );
	}

	/**
	 * Registers an action callback.
	 *
	 * @param string   $hook         Hook name.
	 * @param callable $callback     Callback function.
	 * @param int      $priority     Priority.
	 * @param int      $accepted_args Number of accepted arguments.
	 */
	public function add_action( string $hook, callable $callback, int $priority = 10, int $accepted_args = 1 ) {
		add_action( $hook, $callback, $priority, $accepted_args );
	}

	/**
	 * Removes a previously registered action callback.
	 *
	 * @param string   $hook     Hook name.
	 * @param callable $callback Callback function.
	 * @param int      $priority Priority.
	 */
	public function remove_action( string $hook, callable $callback, int $priority = 10 ) {
		remove_action( $hook, $callback, $priority );
	}
}
