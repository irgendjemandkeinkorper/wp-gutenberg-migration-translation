<?php
/**
 * Multi-checkbox Customizer control template.
 *
 * @package cet-wp-theme-troon-2
 *
 * @var array $args {
 *     @type string $label       Control label.
 *     @type string $description Control description.
 *     @type array  $choices     Available choices (id => name).
 *     @type array  $values      Currently selected values.
 *     @type string $setting_id  Customizer setting ID.
 *     @type string $link_attr   Output of $this->link() for the hidden input.
 *     @type string $value       Current comma-separated value.
 * }
 */

defined( 'ABSPATH' ) || exit;

$label       = $args['label'] ?? '';
$description = $args['description'] ?? '';
$choices     = $args['choices'] ?? [];
$values      = $args['values'] ?? [];
$setting_id  = $args['setting_id'] ?? '';
$link_attr   = $args['link_attr'] ?? '';
$value       = $args['value'] ?? '';
?>
<span class="customize-control-title"><?php echo esc_html( $label ); ?></span>

<?php if ( ! empty( $description ) ) : ?>
	<span class="description customize-control-description"><?php echo esc_html( $description ); ?></span>
<?php endif; ?>

<?php if ( empty( $choices ) ) : ?>
	<p><?php esc_html_e( 'No product categories found.', 'cet-wp-theme-troon-2' ); ?></p>
	<?php return; ?>
<?php endif; ?>

<div
	data-cet-control="multi-checkbox"
	data-cet-setting-id="<?php echo esc_attr( $setting_id ); ?>"
>
	<ul class="cet-multi-checkbox-control__list">
		<?php foreach ( $choices as $choice_id => $choice_label ) : ?>
			<li>
				<label>
					<input
						type="checkbox"
						value="<?php echo esc_attr( $choice_id ); ?>"
						<?php checked( in_array( (int) $choice_id, $values, true ) ); ?>
					/>
					<?php echo esc_html( $choice_label ); ?>
				</label>
			</li>
		<?php endforeach; ?>
	</ul>

	<input
		type="hidden"
		data-cet-multi-checkbox-value
		<?php echo $link_attr; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Pre-escaped by WP_Customize_Control::get_link(). ?>
		value="<?php echo esc_attr( $value ); ?>"
	/>
</div>