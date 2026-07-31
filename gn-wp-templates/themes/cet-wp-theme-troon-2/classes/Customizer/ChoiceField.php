<?php

namespace Cet\Theme\Troon2\Customizer;

/**
 * Choice-based field DTO for multi-checkbox and select controls.
 *
 * Supports deferred choices via callable for late-bound taxonomy data.
 *
 * @package cet-wp-theme-troon-2
 */
class ChoiceField extends AbstractField {

	/** @var array|callable */
	protected $choices;

	/**
	 * @param string         $id Setting ID.
	 * @param string         $sectionId Section ID.
	 * @param string         $label Field label.
	 * @param array|callable $choices Choices array or callable returning choices.
	 * @param string         $transport Transport method.
	 * @param mixed          $default Default value.
	 * @param string         $description Field description.
	 */
	public function __construct(
		string $id,
		string $sectionId,
		string $label,
		$choices,
		string $transport = 'refresh',
		$default = '',
		string $description = ''
	) {
		parent::__construct( $id, $sectionId, $label, $transport, $default, $description );
		$this->choices = $choices;
	}

	/**
	 * Resolve and return choices.
	 *
	 * @return array<int|string, string>
	 */
	public function getChoices(): array {
		if ( is_callable( $this->choices ) ) {
			$this->choices = call_user_func( $this->choices );
		}

		return $this->choices;
	}

	public function getSanitizeCallback() {
		return [ $this, 'sanitize' ];
	}

	/**
	 * Sanitize comma-separated IDs.
	 *
	 * @param string $value Raw input.
	 * @return string Cleaned comma-separated integer IDs.
	 */
	public function sanitize( string $value ): string {
		$ids = array_filter( array_map( 'absint', explode( ',', $value ) ) );

		return implode( ',', $ids );
	}

	public function createControl( \WP_Customize_Manager $wp_customize ): \WP_Customize_Control {
		return new MultiCheckboxControl(
			$wp_customize,
			$this->id,
			[
				'section'     => $this->sectionId,
				'label'       => $this->label,
				'description' => $this->description,
				'choices'     => $this->getChoices(),
			]
		);
	}
}
