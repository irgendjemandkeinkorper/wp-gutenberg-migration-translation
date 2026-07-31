<?php

use Cet\Theme\Indigo\MetaBox\HeroMetaBox;

$autoloadPath = __DIR__ . '/vendor/autoload.php';
if (file_exists($autoloadPath)) {
    require $autoloadPath;
}

if (class_exists(HeroMetaBox::class)) {
    $postTypes = ['page', 'post', 'tribe_events', 'product'];
    $fieldSupports = array_fill_keys( HeroMetaBox::getFieldNames(), $postTypes);
    $fieldSupports['hero_title'] = ['tribe_events', 'product'];
    $fieldSupports['hero_image'] = ['product'];

    new HeroMetaBox($postTypes, $fieldSupports);
}

