<?php

namespace Cet\Theme\Troon2\Blocks\Contracts\Definitions;

/**
 * DTO for a v2 Wrapper registration.
 *
 * @package cet-wp-theme-troon-2
 */
class WrapperDefinition {
	public function __construct(
		public readonly string $block,
	) {}
}
