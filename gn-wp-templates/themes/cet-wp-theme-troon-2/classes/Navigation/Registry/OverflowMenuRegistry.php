<?php

namespace Cet\Theme\Troon2\Navigation\Registry;

class OverflowMenuRegistry {

	private array $items = [];

	public function set( array $items ): void {
		$this->items = $items;
	}

	public function get(): array {
		return $this->items;
	}

	public function isEmpty(): bool {
		return empty( $this->items );
	}
}
