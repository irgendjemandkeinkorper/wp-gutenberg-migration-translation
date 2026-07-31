<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/vendor/autoload.php';

// WP class stubs — must be loaded before any test that instantiates WP objects.
require_once __DIR__ . '/stubs/class-wp-block.php';
require_once __DIR__ . '/stubs/class-wp-html-tag-processor.php';
