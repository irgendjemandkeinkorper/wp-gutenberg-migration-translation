<?php

declare(strict_types=1);

namespace Cet\Theme\Indigo\Customizer;

/**
 * Simple field DTO for text, color, select, checkbox, and image controls.
 *
 * @package cet-wp-theme-indigo
 */
class SimpleField extends AbstractField {

	protected string $type;

	/** @var callable|string */
	protected $sanitizeCallback;

	/** @var array<int|string, string> */
	protected array $choices;

	/**
	 * @param string          $id Setting ID.
	 * @param string          $sectionId Section ID.
	 * @param string          $label Field label.
	 * @param string          $type Control type (text, color, select, checkbox, image, ...).
	 * @param callable|string $sanitizeCallback Sanitize callback.
	 * @param string          $transport Transport method.
	 * @param mixed           $default Default value.
	 * @param string          $description Field description.
	 * @param int             $priority Control priority.
	 * @param callable|string $activeCallback Active callback.
	 * @param array           $choices Choices for select/radio controls.
	 */
	public function __construct(
		string $id,
		string $sectionId,
		string $label,
		string $type,
		$sanitizeCallback,
		string $transport = 'refresh',
		mixed  $default = '',
		string $description = '',
		int    $priority = 10,
		$activeCallback = '',
		array  $choices = []
	) {
		parent::__construct( $id, $sectionId, $label, $transport, $default, $description, $priority, $activeCallback );
		$this->type             = $type;
		$this->sanitizeCallback = $sanitizeCallback;
		$this->choices          = $choices;
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
					'section'         => $this->sectionId,
					'label'           => $this->label,
					'priority'        => $this->priority,
					'active_callback' => $this->activeCallback,
				]
			);
		}

		if ( $this->type === 'image' ) {
			return new \WP_Customize_Media_Control(
				$wp_customize,
				$this->id,
				[
					'section'         => $this->sectionId,
					'label'           => $this->label,
					'description'     => $this->description,
					'priority'        => $this->priority,
					'active_callback' => $this->activeCallback,
					'mime_type'       => 'image',
				]
			);
		}

		$args = [
			'section'         => $this->sectionId,
			'label'           => $this->label,
			'description'     => $this->description,
			'type'            => $this->type,
			'priority'        => $this->priority,
			'active_callback' => $this->activeCallback,
		];

		if ( ! empty( $this->choices ) ) {
			$args['choices'] = $this->choices;
		}

		return new \WP_Customize_Control(
			$wp_customize,
			$this->id,
			$args
		);
	}
}
