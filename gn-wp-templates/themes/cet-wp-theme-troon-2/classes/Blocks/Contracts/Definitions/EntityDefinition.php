<?php

namespace Cet\Theme\Troon2\Blocks\Contracts\Definitions;

/**
 * DTO for a v2 Entity registration.
 *
 * @package cet-wp-theme-troon-2
 */
class EntityDefinition {
	public function __construct(
		public readonly string  $block,
		public readonly string  $type,
		public readonly ?string $style,
		public readonly string  $container,
		public readonly string  $spacing,
		public readonly array   $subElements,
		public readonly ?string $orientationAttr = null,
	) {}
}
