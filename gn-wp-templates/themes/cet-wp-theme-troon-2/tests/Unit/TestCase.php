<?php

declare(strict_types=1);

namespace Cet\Theme\Troon2\Tests\Unit;

use Brain\Monkey;
use PHPUnit\Framework\TestCase as BaseTestCase;

/**
 * Base test case for all unit tests.
 *
 * Sets up / tears down Brain Monkey so WP global functions (add_filter, etc.)
 * are available as stubs without a full WordPress bootstrap.
 */
abstract class TestCase extends BaseTestCase {

	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();
		// Stub all WP hook functions used by ContractEngineV2's constructor.
		Monkey\Functions\stubs( [ 'add_filter', 'add_action' ] );
	}

	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	// -------------------------------------------------------------------------
	// HTML assertion helpers
	// -------------------------------------------------------------------------

	/**
	 * Return the class list of the first HTML tag in $html.
	 *
	 * @return string[]
	 */
	protected function getClasses( string $html ): array {
		if ( preg_match( '/\bclass="([^"]*)"/', $html, $m ) ) {
			return preg_split( '/\s+/', trim( $m[1] ), -1, PREG_SPLIT_NO_EMPTY ) ?: [];
		}
		return [];
	}

	/**
	 * Return the value of a named attribute from the first HTML tag in $html,
	 * or null when the attribute is absent.
	 */
	protected function getAttribute( string $html, string $attr ): ?string {
		$pattern = '/\b' . preg_quote( $attr, '/' ) . '="([^"]*)"/' ;
		if ( preg_match( $pattern, $html, $m ) ) {
			return $m[1];
		}
		return null;
	}
}
