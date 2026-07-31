<?php

namespace Cet\Theme\Troon2\Customizer;

/**
 * Simple field DTO for text, color, and image controls.
 *
 * @package cet-wp-theme-troon-2
 */
class SimpleField extends AbstractField {

	protected string $type;

	/** @var callable|string */
	protected $sanitizeCallback;

	/**
	 * @param string          $id Setting ID.
	 * @param string          $sectionId Section ID.
	 * @param string          $label Field label.
	 * @param string          $type Control type (text, color, image).
	 * @param callable|string $sanitizeCallback Sanitize callback.
	 * @param string          $transport Transport method.
	 * @param mixed           $default Default value.
	 * @param string          $description Field description.
	 */
	public function __construct(
		string $id,
		string $sectionId,
		string $label,
		string $type,
		$sanitizeCallback,
		string $transport = 'refresh',
		mixed  $default = '',
		string $description = ''
	) {
		parent::__construct( $id, $sectionId, $label, $transport, $default, $description );
		$this->type             = $type;
		$this->sanitizeCallback = $sanitizeCallback;
	}

	public function getType(): string {
		return $this->type;
	}

	public function getSanitizeCallback() {
		return $this->sanitizeCallback;
	}

	public function createControl( \WP_Customize_Manager $wp_customize ): \WP_Customize_Control {
		if ( $this->type === 'color' ) {
			return new \WP_Customize_Color_Control(
				$wp_customize,
				$this->id,
				[
					'section' => $this->sectionId,
					'label'   => $this->label,
				]
			);
		}

		if ( $this->type === 'image' ) {
			$args = [
				'section' => $this->sectionId,
				'label'   => $this->label,
			];

			if ( ! empty( $this->description ) ) {
				$args['description'] = $this->description;
			}

			return new \WP_Customize_Image_Control( $wp_customize, $this->id, $args );
		}

		$args = [
			'section' => $this->sectionId,
			'label'   => $this->label,
			'type'    => $this->type,
		];

		if ( ! empty( $this->description ) ) {
			$args['description'] = $this->description;
		}

		return new \WP_Customize_Control(
			$wp_customize,
			$this->id,
			$args
		);
	}
}
