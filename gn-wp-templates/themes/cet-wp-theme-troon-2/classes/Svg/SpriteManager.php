<?php

namespace Cet\Theme\Troon2\Svg;

class SpriteManager {

    protected static ?self $instance = null;
    protected const ALLOWED_HTML = [
        'svg' => [
            'xmlns' => true,
            'xmlns:xlink' => true,
            'width' => true,
            'height' => true,
            'viewBox' => true,
            'viewbox' => true,
            'fill' => true,
            'version' => true,
        ],
        'symbol' => [
            'id' => true,
            'viewBox' => true,
            'viewbox' => true,
            'fill' => true,
            'xmlns' => true,
        ],
        'path' => [
            'd' => true,
            'fill' => true,
            'fill-rule' => true,
            'clip-rule' => true,
            'stroke' => true,
        ],
        'circle' => [
            'cx' => true,
            'cy' => true,
            'r' => true,
            'fill' => true,
        ],
        'rect' => [
            'x' => true,
            'y' => true,
            'width' => true,
            'height' => true,
            'fill' => true,
        ],
        'g' => [
            'fill' => true,
            'stroke' => true,
        ],
    ];

    protected SpriteCache $cache;
    protected array $svgPaths;
    protected array $sprites = [];
    protected array $symbolViewBoxes = [];
    protected array $symbolIds = [];
    protected string $filterPrefix = '';
    public function __construct(array $svgPaths, SpriteCache $cache, string $filterPrefix = '') {
        $this->svgPaths = $svgPaths;
        $this->filterPrefix = $filterPrefix;
        $this->cache = $cache;
        $this->init();
        $this->events();
        self::$instance = $this;
    }

    public static function getInstance(): ?self {
        return self::$instance;
    }

    public function getViewBoxes(): array
    {
        return $this->symbolViewBoxes;
    }

    public function setViewBoxes(array $viewBoxes): void
    {
        $this->symbolViewBoxes = $viewBoxes;
    }

    public function setIds(array $ids): void
    {
        $this->symbolIds = $ids;
    }

    public function getIds(): array
    {
        return $this->symbolIds;
    }

    protected function events(): void
    {
        //TODO: Should we wrap filters with Loader as we do in plugins?
        add_action('wp_footer', [$this, 'insertSvg']);
        add_action('admin_footer', [$this, 'insertSvg']);
    }

    protected function init(): void
    {
        //TODO: Should we wrap filters with Loader as we do in plugins?
        foreach (apply_filters("cet/{$this->filterPrefix}/svg/sprite_paths", $this->svgPaths) as $svgPath) {
            $this->cache->setup( $svgPath, $this, $this->filterPrefix );
            $svg = $this->loadSvg($svgPath);
            if (!empty($svg)) {
                $this->cache->cacheDataFromSvg($svg);
                $this->sprites[$svgPath] = $svg;
            }
        }
    }

    public function insertSvg(): void
    {
        echo sprintf(
            '<div style="display: none;" class="cet-svg-sprite-set">%s</div>',
            wp_kses(
                array_reduce($this->sprites, function ($carry, $sprite): string {
                    $carry .= $sprite;
                    return $carry;
                }, ''),
                apply_filters( "cet/{$this->filterPrefix}/svg/allowed_tags", static::ALLOWED_HTML )
            )
        );
    }

    protected function loadSvg(string $path): string
    {
        $content = '';

        if ('svg' === pathinfo( $path, PATHINFO_EXTENSION ) && file_exists( $path ) ) {
            $sprite = $this->cache->get( 'sprite' );
            if ( ! empty( $sprite ) && is_string( $sprite ) ) {
                return $sprite;
            }

            $handle = fopen( $path, 'r' );
            if ( $handle ) {
                while ( ! feof( $handle ) ) {
                    $content .= fread( $handle, 8192 ); // Load by 8 KB
                }
                fclose( $handle );
            }

            $this->cache->set( 'sprite', $content );
        }

        return $content;
    }

    public static function getRenderedSvg(string $name): string
    {
        if ( ! self::$instance ) {
            return '';
        }

        if ( ! in_array( $name, self::$instance->symbolIds, true ) ) {
            return '';
        }

        $viewBox = self::$instance->symbolViewBoxes[$name] ?? '0 0 24 24';
        $parts   = explode( ' ', $viewBox );
        $w       = $parts[2] ?? '24';
        $h       = $parts[3] ?? '24';
        $style   = sprintf( 'width:var(--cet-svg-icon-width,%spx);height:var(--cet-svg-icon-height,%spx)', $w, $h );
        return sprintf(
            '<svg style="%s" viewBox="%s" aria-hidden="true" focusable="false"><use href="#%s"></use></svg>',
            esc_attr($style),
            esc_attr($viewBox),
            esc_attr($name)
        );
    }
}
