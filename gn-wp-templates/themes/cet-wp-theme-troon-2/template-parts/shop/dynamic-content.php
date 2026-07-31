<?php
/**
 * Shop Dynamic Content area.
 *
 * Renders the Shop page's Gutenberg post_content.
 * Editors use this area to place CTA blocks, promotional content, or any other blocks.
 * Content is rendered only once here — not duplicated in Hero or other sections.
 *
 * @package cet-wp-theme-troon-2
 *
 * @var array $args {
 *     @type int $page_id Shop page ID.
 * }
 */

defined( 'ABSPATH' ) || exit;

$page_id = $args['page_id'] ?? 0;

if ( ! $page_id ) {
	return;
}

$content = get_post_field( 'post_content', $page_id );

if ( empty( $content ) ) {
	return;
}

$content = apply_filters( 'the_content', $content );
?>
<div class="cet-wc-dynamic">
	<?php echo $content; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Content filtered via the_content. ?>
</div>
