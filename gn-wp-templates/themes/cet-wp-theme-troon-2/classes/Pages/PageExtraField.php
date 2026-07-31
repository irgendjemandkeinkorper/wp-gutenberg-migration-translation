<?php

declare(strict_types=1);

namespace Cet\Theme\Troon2\Pages;

use \WP_Post;

final class PageExtraField {
    private const POST_TYPE = 'page';

    private const META_KEY = '_page_subtitle';

    private const NONCE_ACTION = 'save_page_extra_field';

    private const NONCE_NAME = 'page_extra_field_nonce';

    private string $script_handle = 'page-extra-field-sidebar';

    private string $script_path;

    private string $script_url;

    public function __construct(string $script_path, string $script_url)
    {
        $this->script_path = rtrim($script_path, '/');
        $this->script_url = rtrim($script_url, '/');
        $this->register();
    }

    private function register(): void {
        add_action('init', [$this, 'register_meta']);
        add_action('enqueue_block_editor_assets', [$this, 'enqueue_block_editor_assets']);
        add_action('add_meta_boxes', [$this, 'register_classic_metabox']);
        add_action('save_post_' . self::POST_TYPE, [$this, 'save_classic_metabox']);
    }

    public function register_meta(): void {
        register_post_meta(self::POST_TYPE, self::META_KEY, [
            'type'              => 'string',
            'single'            => true,
            'default'           => '',
            'show_in_rest'      => [
                'schema' => [
                    'type'    => 'string',
                    'default' => '',
                ],
            ],
            'sanitize_callback' => [$this, 'sanitize_meta_value'],
            'auth_callback'     => [$this, 'can_edit_meta'],
        ]);
    }

    public function sanitize_meta_value(mixed $value): string
    {
        if (! is_string($value)) {
            return '';
        }

        return sanitize_text_field($value);
    }

    public function can_edit_meta(
        bool $allowed,
        string $meta_key,
        int $post_id,
        int $user_id
    ): bool {
        unset($allowed, $meta_key);

        return user_can($user_id, 'edit_post', $post_id);
    }

    public function enqueue_block_editor_assets(): void
    {
        $screen = get_current_screen();

        if (! $screen || $screen->post_type !== self::POST_TYPE) {
            return;
        }

        $asset_file = $this->script_path . '/page-extra-field.min.asset.php';
        $script_file = $this->script_path . '/page-extra-field.min.js';
        $script_url = $this->script_url . '/page-extra-field.min.js';

        if (! file_exists($script_file)) {
            return;
        }

        $asset = file_exists($asset_file)
            ? require $asset_file // phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.UsingVariable -- path built from trusted constructor argument
            : [
                'dependencies' => [
                    'wp-plugins',
                    'wp-edit-post',
                    'wp-editor',
                    'wp-element',
                    'wp-components',
                    'wp-data',
                    'wp-core-data',
                    'wp-i18n',
                ],
                'version' => filemtime($script_file),
            ];

        wp_enqueue_script(
            $this->script_handle,
            $script_url,
            $asset['dependencies'],
            $asset['version'],
            true
        );

        wp_set_script_translations(
            $this->script_handle,
            'cet-wp-theme-troon-2'
        );

        wp_add_inline_script(
            $this->script_handle,
            'window.PageExtraField = ' . wp_json_encode([
                'postType' => self::POST_TYPE,
                'metaKey'  => self::META_KEY,
                'panelName' => 'page-extra-field',
                'panelTitle' => __('Page settings', 'cet-wp-theme-troon-2'),
                'fieldLabel' => __('Page subtitle', 'cet-wp-theme-troon-2'),
            ]) . ';',
            'before'
        );
    }

    public function register_classic_metabox(string $post_type): void
    {
        if ($post_type !== self::POST_TYPE) {
            return;
        }

        if (use_block_editor_for_post_type(self::POST_TYPE)) {
            return;
        }

        add_meta_box(
            'page_extra_field',
            __('Page settings', 'cet-wp-theme-troon-2'),
            [$this, 'render_classic_metabox'],
            self::POST_TYPE,
            'side',
            'default'
        );
    }

    public function render_classic_metabox(WP_Post $post): void
    {
        $value = get_post_meta($post->ID, self::META_KEY, true);

        if (! is_string($value)) {
            $value = '';
        }

        get_template_part(
            'template-parts/admin/page/extra-field',
            null,
            [
                'value'        => $value,
                'nonce_action' => self::NONCE_ACTION,
                'nonce_name'   => self::NONCE_NAME,
                'label'        => __('Page subtitle', 'cet-wp-theme-troon-2'),
            ]
        );
    }

    public function save_classic_metabox(int $post_id): void
    {
        if (! $this->can_save_classic_metabox($post_id)) {
            return;
        }

        $value = isset($_POST['page_subtitle']) // phpcs:ignore WordPress.Security.NonceVerification.Missing -- verified in can_save_classic_metabox()
            ? sanitize_text_field(wp_unslash($_POST['page_subtitle']))
            : '';

        update_post_meta($post_id, self::META_KEY, $value);
    }

    private function can_save_classic_metabox(int $post_id): bool
    {
        if (! isset($_POST[self::NONCE_NAME])) {
            return false;
        }

        $nonce = sanitize_text_field(wp_unslash($_POST[self::NONCE_NAME]));

        if (! wp_verify_nonce($nonce, self::NONCE_ACTION)) {
            return false;
        }

        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
            return false;
        }

        if (wp_is_post_revision($post_id)) {
            return false;
        }

        if (! current_user_can('edit_post', $post_id)) {
            return false;
        }

        return true;
    }
}
