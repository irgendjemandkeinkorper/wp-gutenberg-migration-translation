<?php

namespace Cet\Theme\Troon2\Blocks\Contracts;

/**
 * Block Contract Configuration Validator
 *
 * Validates the block-contracts config array at boot time when WP_DEBUG
 * is enabled. Catches configuration errors early (missing keys, shape
 * mismatches, ambiguous registrations) rather than allowing silent
 * mis-resolution at render time.
 *
 * @package cet-wp-theme-troon-2
 */
class ConfigValidator {

	/**
	 * Validate the configuration array.
	 *
	 * Stub — Phase 2 fills in assertions.
	 *
	 * @param array<string, mixed> $config Configuration from inc/block-contracts.php.
	 */
	public static function validate( array $config ): void {
		// Phase 2: Add assertions for:
		// - Every section_blocks entry has 'enabled' + 'type'
		// - Every nested_blocks entry has 'enabled' + 'type'
		// - Multi-style arrays are sequential (array_is_list)
		// - Dual-registered blocks flagged with log notice
		// - Config references known container/spacing values
	}
}
