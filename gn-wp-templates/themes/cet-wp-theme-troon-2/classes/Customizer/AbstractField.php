<?php

namespace Cet\Theme\Troon2\Customizer;

/**
 * Base field DTO for Customizer settings.
 *
 * @package cet-wp-theme-troon-2
 */
abstract class AbstractField {

	protected string $id;
	protected string $sectionId;
	protected string $label;
	protected string $transport;
	protected $default;
	protected string $description;

	public function __construct(
		string $id,
		string $sectionId,
		string $label,
		string $transport = 'refresh',
		$default = '',
		string $description = ''
	) {
		$this->id          = $id;
		$this->sectionId   = $sectionId;
		$this->label       = $label;
		$this->transport   = $transport;
		$this->default     = $default;
		$this->description = $description;
	}

	public function getId(): string {
		return $this->id;
	}

	public function getSectionId(): string {
		return $this->sectionId;
	}

	public function getLabel(): string {
		return $this->label;
	}

	public function getTransport(): string {
		return $this->transport;
	}

	public function getDefault() {
		return $this->default;
	}

	public function getDescription(): string {
		return $this->description;
	}

	/**
	 * Get sanitize callback for this field.
	 *
	 * @return callable|string
	 */
	abstract public function getSanitizeCallback();

	/**
	 * Create the appropriate WP_Customize_Control.
	 *
	 * @param \WP_Customize_Manager $wp_customize Customizer manager.
	 * @return \WP_Customize_Control
	 */
	abstract public function createControl( \WP_Customize_Manager $wp_customize ): \WP_Customize_Control;
}
