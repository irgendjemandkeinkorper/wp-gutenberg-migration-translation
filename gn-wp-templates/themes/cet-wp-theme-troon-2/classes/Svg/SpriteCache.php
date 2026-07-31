<?php

namespace Cet\Theme\Troon2\Svg;

readonly class SpriteCache
{
    protected string $path;
    protected string $baseCacheKey;
    protected string $cacheGroup;
    protected int $ttl;
    protected SpriteManager $spriteManager;

    public function setup(string $filePath, SpriteManager $manager, string $filterPrefix = '', int $ttl = HOUR_IN_SECONDS): void
    {
        $this->spriteManager = $manager;
        $this->path = $filePath;
        $this->baseCacheKey = 'cet/theme-' . $filterPrefix . '/svg_sprite_'. md5( $filePath . filemtime( $filePath ) ). '/';
        $this->cacheGroup = "cet/theme-{$filterPrefix}/svg_sprite";
        $this->ttl = $ttl;
    }

    public function get(string $key): string|array|false
    {
        return wp_cache_get( $this->baseCacheKey . $key, $this->cacheGroup );
    }

    public function set(string $key, string|array $value): void
    {
        wp_cache_set( $this->baseCacheKey . $key, $value, $this->cacheGroup, $this->ttl );
    }

    public function cacheDataFromSvg(string $svgContent): void
    {
        $viewBoxes = $this->get( 'svgData' );
        if ( is_array( $viewBoxes ) && count( $viewBoxes ) > 0 ) {
            $this->spriteManager->setViewBoxes( $viewBoxes );
            $this->spriteManager->setIds( array_keys( $viewBoxes ) );
            return;
        }

        $doc = new \DOMDocument();
        libxml_use_internal_errors(true);
        $doc->loadXML($svgContent);
        libxml_clear_errors();

        $symbolViewBoxes = [];
        foreach ($doc->getElementsByTagNameNS('http://www.w3.org/2000/svg', 'symbol') as $symbol) {
            $id = $symbol->getAttribute('id');
            if ($id) {
                $symbolViewBoxes[$id] = $symbol->getAttribute('viewBox') ?: '0 0 24 24';
            }
        }

        $this->spriteManager->setIds( array_keys( $symbolViewBoxes ) );
        $this->spriteManager->setViewBoxes( $symbolViewBoxes );
        $this->set( 'svgData', $symbolViewBoxes );
    }
}
