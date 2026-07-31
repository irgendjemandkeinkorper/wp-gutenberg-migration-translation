<?php
/**
 * WPForms accessibility helpers.
 */

// Force WPForms Modern Markup when WPForms requests this setting.
add_filter( 'wpforms_setting', function( $value, $key, $default_value, $option ) {
	if ( 'modern-markup' === $key ) {
		return '1';
	}

	return $value;
}, 10, 4 );

add_filter( 'wpforms_frontend_confirmation_message', 'sunstone_pro_wpforms_confirmation_live_region', 10, 4 );

/**
 * Wrap WPForms confirmation message in an accessible status region (together with the frontend live-region patch).
 *
 * Official WPForms hook:
 * https://wpforms.com/developers/wpforms_frontend_confirmation_message/
 *
 * @param string $message   Confirmation message HTML.
 * @param array  $form_data Processed form settings/data.
 * @param array  $fields    Sanitized field data.
 * @param int    $entry_id  Entry ID.
 * @return string
 */
function sunstone_pro_wpforms_confirmation_live_region( $message, $form_data, $fields, $entry_id ) {
	return sprintf(
		'<div class="wpforms-confirmation-container sunstone-wpf-confirmation-status" role="status" aria-live="polite" aria-atomic="true">%s</div>',
		$message
	);
}

/**
 * Add a dedicated data attribute for accessibility JS targeting.
 */
add_filter( 'wpforms_frontend_form_atts', function( $form_atts, $form_data ) {
	$form_atts['atts']['data-sunstone-wpf-a11y'] = 'true';

	return $form_atts;
}, 10, 2 );