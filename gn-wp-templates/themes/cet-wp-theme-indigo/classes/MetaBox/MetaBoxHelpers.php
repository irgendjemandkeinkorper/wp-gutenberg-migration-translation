<?php

namespace Cet\Theme\Indigo\MetaBox;

trait MetaBoxHelpers
{
    private function createMetaArgs(string $field_type, int|string|null $default = ''): array
    {
        $default = in_array($field_type, ['range', 'image'], true)
            ? ('' === $default ? 0 : (int) $default)
            : $default;

        [$meta_type, $sanitize_callback] = match ($field_type) {
            'textarea' => ['string', 'sanitize_textarea_field'],
            'range', 'image' => ['integer', 'absint'],
            default => ['string', 'sanitize_text_field'],
        };

        return [
            'type'              => $meta_type,
            'single'            => true,
            'show_in_rest'      => true,
            'sanitize_callback' => $sanitize_callback,
            'default'           => $default,
            'auth_callback'     => fn() => current_user_can('edit_posts'),
        ];
    }

    private function cleanMetaValue(array $field, string $value): int|string
    {
        return match ($field['type'] ?? '') {
            'text' => sanitize_text_field(wp_unslash($value)),
            'textarea' => sanitize_textarea_field(wp_unslash($value)),
            'range' => max(
                (int) ($field['min'] ?? 0),
                min((int) ($field['max'] ?? PHP_INT_MAX), absint($value))
            ),
            'image' => absint($value),
            default => '',
        };
    }
}