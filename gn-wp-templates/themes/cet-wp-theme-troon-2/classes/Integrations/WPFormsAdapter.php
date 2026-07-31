<?php

namespace Cet\Theme\Troon2\Integrations;

/**
 * WPForms integration.
 *
 * Handles WPForms configuration and customization for the theme.
 */
class WPFormsAdapter {

	/**
	 * Initialize WPForms integration.
	 */
	public function __construct() {
		$this->register_hooks();
	}

	/**
	 * Register WordPress hooks.
	 *
	 * @return void
	 */
	private function register_hooks(): void {
		add_filter( 'wpforms_setting', [ $this, 'filter_wpforms_setting' ], 10, 4 );
		add_filter( 'wpforms_frontend_form_atts', [ $this, 'filter_frontend_form_atts' ], 10, 2 );
		add_filter( 'wpforms_field_properties', [ $this, 'filter_field_properties' ], 10, 3 );
	}

	/**
	 * Filter WPForms settings.
	 *
	 * Forces modern markup for better accessibility and HTML structure.
	 *
	 * @param mixed  $value         Setting value.
	 * @param string $key           Setting key.
	 * @param mixed  $default_value Default setting value.
	 * @param string $option        Option name.
	 * @return mixed
	 */
	public function filter_wpforms_setting( $value, string $key, $default_value, string $option ) {
		if ( 'modern-markup' === $key ) {
			return '1';
		}

        if ( 'disable-css' === $key ) {
            return '3';
        }

		return $value;
	}

	/**
	 * Modify form attributes.
	 *
	 * Adds custom data attributes to form elements for theme-specific targeting.
	 *
	 * @param array $form_atts Form attributes.
	 * @param array $form_data Form data.
	 * @return array
	 */
	public function filter_frontend_form_atts( array $form_atts, array $form_data ): array {
		// Add custom CSS class.
		$form_atts['class'][] = 'cet-wp-form';

		// Add custom data attributes.
		$form_atts['atts']['data-cet-wp-form'] = 'true';

		return $form_atts;
	}

	/**
	 * Modify field properties.
	 *
	 * Adds BEM-style CSS classes to form field elements.
	 *
	 * @param array $properties Field properties.
	 * @param array $field      Field settings.
	 * @param array $form_data  Form data.
	 * @return array
	 */
	public function filter_field_properties( array $properties, array $field, array $form_data ): array {
		$field_type = $field['type'] ?? '';

		// Add class to field container.
		if ( isset( $properties['container']['class'] ) ) {
			$properties['container']['class'][] = 'cet-wp-form__field';
            $properties['container']['class'][] = "cet-wp-form__field__{$field_type}";
		}

		// Add class to field label.
		if ( isset( $properties['label']['class'] ) ) {
			$properties['label']['class'][] = 'cet-wp-form__label';
		}

		// Add class to field description.
		if ( isset( $properties['description']['class'] ) ) {
			$properties['description']['class'][] = 'cet-wp-form__description';
		}


        // Add class to primary input (works for text, email, textarea, etc.).
		if ( isset( $properties['inputs']['primary']['class'] ) ) {
			$properties['inputs']['primary']['class'][] = 'cet-wp-form__input';
            $properties['inputs']['primary']['class'][] = "cet-wp-form__{$field_type}";
		}

		// Add class to all inputs (for multi-input fields like name, address, etc.).
		if ( isset( $properties['inputs'] ) && is_array( $properties['inputs'] ) ) {
			foreach ( $properties['inputs'] as $key => $input ) {
				if ( is_array( $input ) && isset( $input['class'] ) ) {
					$properties['inputs'][ $key ]['class'][] = 'cet-wp-form__input';
                    $properties['inputs'][ $key ]['class'][] = "cet-wp-form__{$field_type}";
				}
			}

            //For Date-time fields
            if ( isset( $properties['inputs']['date']['container']['class'] ) ) {
                $properties['inputs']['date']['container']['class'][] = "cet-wp-form__field__date";
            }

            if ( isset( $properties['inputs']['time']['container']['class'] ) ) {
                $properties['inputs']['time']['container']['class'][] = "cet-wp-form__field__time";
            }

            //For Address fields
            foreach ( [ 'address1', 'address2', 'city', 'state', 'postal' ] as $field ) {
                if ( isset( $properties['inputs'][ $field ]['container']['class'] ) ) {
                    $properties['inputs'][ $field ]['container']['class'][] = 'cet-wp-form__field__address';

                    if ( 'state' === $field ) {
                        $properties['inputs'][ $field ]['container']['class'][] = 'cet-wp-form__field__state';
                    }
                }
            }
		}


		// Add class for select.
		if ( $field_type === 'select' && isset( $properties['input_container']['class'] ) ) {
			$properties['input_container']['class'][] = 'cet-wp-form__select';
		}

		return $properties;
	}
}
