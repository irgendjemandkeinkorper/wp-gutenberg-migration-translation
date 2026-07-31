<?php

namespace Cet\Theme\Indigo\MetaBox;

/**
 * CET – Hero Description Meta Box
 * Description: Adds a “Hero description” meta box to Pages and exposes it via REST.
 *
 */
class HeroMetaBox {
    use MetaBoxHelpers;

    private static array $fieldDefinitions = [
        'hero_title' => [
            'type' => 'text',
        ],
        'hero_description' => [
            'type' => 'textarea',
        ],
        'hero_image' => [
            'type' => 'image',
        ],
        'hero_image_focus' => [
            'type'    => 'range',
            'min'     => 0,
            'max'     => 100,
            'default' => 50,
        ],
    ];

    private array $metaFields = [];

    private array $enabledPostTypes = [];
    private array $metaSupports = [];

    public function __construct(array $postTypes = [], array $metaSupports = []) {
        $this->enabledPostTypes = $postTypes;
        if (count($this->enabledPostTypes) < 1) {
            return;
        }

        $validFieldNames = static::getFieldNames();
        foreach ($metaSupports as $metaKey => $postTypeSupport) {
            if (!in_array($metaKey, $validFieldNames, true)) {
                throw new \InvalidArgumentException("Unknown meta field: {$metaKey}");
            }
        }

        $this->metaSupports = $metaSupports;
        $this->buildMeta( $metaSupports );
        $this->registerActions();
    }

    public static function getFieldNames(): array
    {
        return array_keys(static::$fieldDefinitions);
    }

    protected function registerActions(): void
    {
        add_action( 'init', [ $this, 'registerMeta' ] );
        add_action( 'add_meta_boxes', [ $this, 'addMetaBoxes' ], 10, 2 );
        add_action( 'save_post', [ $this, 'save_meta' ], 10, 3 );
        add_action( 'admin_enqueue_scripts', [ $this, 'enqueueAdminAssets' ] );
    }

    protected function buildMeta(array $metaSupports): void
    {
        foreach ($metaSupports as $metaKey => $postTypeSupport) {
            $args = static::$fieldDefinitions[$metaKey] ?? null;
            if ( empty( $args['type'] ) ) {
                continue;
            }

            $meta = [
                'name' => $metaKey,
                'postTypes' => is_array($postTypeSupport) ? $postTypeSupport : [$postTypeSupport],
                ...$args,
            ];
            $meta['default'] = $meta['default'] ?? '';
            $meta['args'] = $this->createMetaArgs( $meta['type'], $meta['default'] ?? '' );
            $this->metaFields[$metaKey] = $meta;
        }
    }

    protected function supports(string $fieldName, string $postType): bool
    {
        return in_array($postType, $this->metaFields[$fieldName]['postTypes'] ?? [], true);
    }

    public function registerMeta(): void {
        foreach ($this->metaFields as $metaField) {
            foreach ( $metaField['postTypes'] ?? [] as $postType ) {
                register_post_meta( $postType, $metaField['name'], $metaField['args'] );
            }
        }
    }

    public function addMetaBoxes( $post_type, $post ): void {
        // Only on posts, pages and events
        if ( ! in_array( $post_type, $this->enabledPostTypes, true ) ) {
            return;
        }

        $front_id = (int) get_option( 'page_on_front' );

        // Skip meta box on the static front page
        if ( in_array('page', $this->enabledPostTypes, true) &&
            'page' === $post_type && $front_id && isset( $_GET['post'] ) && (int) $_GET['post'] === $front_id ) {
            return;
        }

        add_meta_box(
            'hero_settings_metabox',
            __( 'Hero Settings', 'cet-wp-theme-indigo' ),
            [ $this, 'renderHeroSettingsMetabox' ],
            $post_type,
            'side',
            'default'
        );
    }

    public function renderHeroSettingsMetabox( $post ): void {
        wp_nonce_field( 'save_hero', 'hero_nonce' );

        if ($this->supports('hero_image', $post->post_type)) {
            $hero_image_id  = (int) get_post_meta( $post->ID, 'hero_image', true );
            $hero_image_url = $hero_image_id ? wp_get_attachment_image_url( $hero_image_id, 'medium' ) : '';
            include locate_template('admin/templates//hero-metabox/metabox-image.tmpl.php');
        }

        $focus = get_post_meta( $post->ID, 'hero_image_focus', true );
        $focus = (float) (! empty( $focus ) ? $focus : 50); // default center
        include locate_template('admin/templates/hero-metabox/metabox-focus.tmpl.php');

        if ($this->supports('hero_title', $post->post_type)) {
            $hero_title = get_post_meta( $post->ID, 'hero_title', true );
            echo '<br>';
            include locate_template('admin/templates/hero-metabox/metabox-title.tmpl.php');
        }

        echo '<br>';
        $hero_desc = get_post_meta( $post->ID, 'hero_description', true );
        include locate_template('admin/templates/hero-metabox/metabox-description.tmpl.php');
    }

    public function save_meta( $post_id, $post, $update ) {
        // Correct post types only
        if ( ! in_array( $post->post_type, $this->enabledPostTypes, true ) ) {
            return;
        }

        // Autosave / revisions
        if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
            return;
        }

        if ( wp_is_post_autosave( $post_id ) || wp_is_post_revision( $post_id ) ) {
            return;
        }

        // Nonce
        if ( ! isset( $_POST['hero_nonce'] ) || ! wp_verify_nonce( $_POST['hero_nonce'], 'save_hero' ) ) {
            return;
        }

        // Capability (edit_post works for both posts and pages)
        if ( ! current_user_can( 'edit_post', $post_id ) ) {
            return;
        }

        foreach ($this->metaFields as $metaField) {
            $fieldName = $metaField['name'] ?? '';
            if (!$this->supports($fieldName, $post->post_type)) {
                continue;
            }

            if ( ! empty( $fieldName ) ) {
                if ( isset( $_POST[$fieldName] ) ) {
                    $clean = $this->cleanMetaValue( $metaField, (string) $_POST[$fieldName] );
                    update_post_meta( $post_id, $fieldName, $clean );
                } else {
                    delete_post_meta( $post_id, $fieldName );
                }
            }
        }
    }

    public function enqueueAdminAssets( $hook ) {
        global $post;
        if ( ! $post || ! $this->supports('hero_image', $post->post_type) ) {
            return;
        }

        wp_enqueue_media();
        wp_enqueue_script(
            'cet-admin-hero-image',
            get_stylesheet_directory_uri() . '/admin/js/hero-metabox-image-upload.js',
            [ 'jquery' ],
            _S_VERSION,
            true
        );
    }
}