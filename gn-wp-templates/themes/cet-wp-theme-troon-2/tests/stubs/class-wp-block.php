<?php

declare(strict_types=1);

/**
 * Minimal WP_Block stub for unit tests.
 *
 * Provides only the properties ContractEngineV2 reads:
 * - $parsed_block — mutable attrs bag (engine side-effects write cetV2EntityHost here)
 * - $name         — block name shortcut
 */
class WP_Block {

	public array $parsed_block;
	public string $name;

	public function __construct( array $parsed_block ) {
		$this->parsed_block = $parsed_block;
		$this->name         = $parsed_block['blockName'] ?? '';
	}
}
