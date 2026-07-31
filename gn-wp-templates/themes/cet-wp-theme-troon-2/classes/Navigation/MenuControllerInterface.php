<?php

namespace Cet\Theme\Troon2\Navigation;

interface MenuControllerInterface {

	public function init(): void;

	public function render(): void;
}
