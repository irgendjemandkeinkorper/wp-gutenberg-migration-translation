<?php

namespace Cet\Theme\Troon2\Blocks\Contracts\Definitions;

/**
 * DTO for a v2 Part registration.
 *
 * @package cet-wp-theme-troon-2
 */
class PartDefinition {
	public function __construct(
		public readonly string $block,
		public readonly string $type,
	) {}
}
