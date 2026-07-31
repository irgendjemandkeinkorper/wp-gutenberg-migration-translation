<?php
/**
 * View: Default Template for Events
 *
 * Override this template in your own theme by creating a file at:
 * [your-theme]/tribe/events/v2/default-template.php
 *
 * See more documentation about our views templating system.
 *
 * @link http://evnt.is/1aiy
 *
 * @version 5.0.0
 *
 * Migrated from themes/troon: removed genesis_get_config() dependency.
 * Header image is driven solely by the 'troon_default_header_image' Customizer
 * setting (attachment ID). If not set, the title block renders without an image.
 */

use Tribe\Events\Views\V2\Template_Bootstrap;

get_header();

$attachment_id    = get_theme_mod( 'troon_default_header_image' );
$header_image_url = $attachment_id ? wp_get_attachment_image_url( (int) $attachment_id, 'full' ) : '';

?>

<div class="entry-header-custom entry-header alignfull">
	<div class="cet-container text-center">
		<h1 class="entry-title woocommerce-products-header__title page-title"><?php esc_html_e( 'Upcoming Events', 'cet-wp-theme-troon-2' ); ?></h1>
	</div>
	<?php if ( $header_image_url ) : ?>
		<img
			alt="<?php esc_attr_e( 'Image of golf ball on tee on grass.', 'cet-wp-theme-troon-2' ); ?>"
			src="<?php echo esc_url( $header_image_url ); ?>"
			class="singular-image entry-image"
		>
	<?php endif; ?>
</div>

<?php

echo tribe( Template_Bootstrap::class )->get_view_html(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

get_footer();
