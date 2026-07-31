<?php

namespace Cet\Theme\Troon2\Customizer;

/**
 * Customizer controller for theme customization settings.
 *
 * @package cet-wp-theme-troon-2
 */
class CustomizerController {

	/**
	 * Section definitions.
	 *
	 * @var Section[]
	 */
	private array $sections = [];

	/**
	 * Field definitions.
	 *
	 * @var AbstractField[]
	 */
	private array $fields = [];

	/**
	 * Initialize the controller and register hooks.
	 */
	public function init(): void {
		add_action( 'customize_register', [ $this, 'register' ] );
	}

	/**
	 * Add a section to the customizer.
	 *
	 * @param Section $section Section configuration.
	 * @return self
	 */
	public function addSection( Section $section ): self {
		$this->sections[] = $section;

		return $this;
	}

	/**
	 * Add a field to the customizer.
	 *
	 * @param AbstractField $field Field configuration.
	 * @return self
	 */
	public function addField( AbstractField $field ): self {
		$this->fields[] = $field;

		return $this;
	}

	/**
	 * Register sections and fields with WordPress Customizer.
	 *
	 * @param \WP_Customize_Manager $wp_customize Theme Customizer object.
	 */
	public function register( \WP_Customize_Manager $wp_customize ): void {
		// Register sections.
		foreach ( $this->sections as $section ) {
			$wp_customize->add_section(
				$section->getId(),
				$section->toArray()
			);
		}

		// Register fields.
		foreach ( $this->fields as $field ) {
			$this->registerField( $wp_customize, $field );
		}
	}

	/**
	 * Register a single field with the customizer.
	 *
	 * @param \WP_Customize_Manager $wp_customize Theme Customizer object.
	 * @param AbstractField         $field Field configuration.
	 */
	private function registerField( \WP_Customize_Manager $wp_customize, AbstractField $field ): void {
		$wp_customize->add_setting(
			$field->getId(),
			[
				'default'           => $field->getDefault(),
				'transport'         => $field->getTransport(),
				'sanitize_callback' => $field->getSanitizeCallback(),
			]
		);

		$control = $field->createControl( $wp_customize );
		if ( $control instanceof \WP_Customize_Control ) {
			$wp_customize->add_control( $control );
		}
	}
}
