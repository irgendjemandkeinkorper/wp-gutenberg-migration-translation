<?php
/**
 * Page extra field classic metabox template.
 *
 * @package cet-wp-theme-troon-2
 *
 * @var array $args {
 *     @type string $value        Current field value.
 *     @type string $nonce_action Nonce action for wp_nonce_field().
 *     @type string $nonce_name   Nonce field name for wp_nonce_field().
 *     @type string $label        Field label.
 * }
 */

defined( 'ABSPATH' ) || exit;

$value        = $args['value'] ?? '';
$nonce_action = $args['nonce_action'] ?? '';
$nonce_name   = $args['nonce_name'] ?? '';
$label        = $args['label'] ?? '';
?>
<?php wp_nonce_field( $nonce_action, $nonce_name ); ?>

<p>
	<label for="page_subtitle">
		<?php echo esc_html( $label ); ?>
	</label>

	<input
		type="text"
		id="page_subtitle"
		name="page_subtitle"
		value="<?php echo esc_attr( $value ); ?>"
		class="widefat"
	/>
</p>
