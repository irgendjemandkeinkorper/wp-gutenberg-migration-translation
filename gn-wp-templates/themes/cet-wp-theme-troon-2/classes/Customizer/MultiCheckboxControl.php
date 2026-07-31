<?php

namespace Cet\Theme\Troon2\Customizer;

/**
 * Multi-checkbox Customizer control.
 *
 * Prepares data and delegates rendering to a template part.
 * Synchronization between checkboxes and the hidden input
 * is handled by the enqueued cet-customizer-controls.js.
 *
 * @package cet-wp-theme-troon-2
 */
class MultiCheckboxControl extends \WP_Customize_Control {

	/**
	 * Control type.
	 *
	 * @var string
	 */
	public $type = 'multi-checkbox';

	/**
	 * Render the control content via template part.
	 */
	protected function render_content(): void {
		// Capture link() output for the template.
		ob_start();
		$this->link();
		$link_attr = ob_get_clean();

		get_template_part(
			'template-parts/admin/customizer/multi-checkbox-control',
			null,
			[
				'label'       => $this->label,
				'description' => $this->description,
				'choices'     => $this->choices,
				'values'      => array_filter( array_map( 'absint', explode( ',', (string) $this->value() ) ) ),
				'setting_id'  => $this->id,
				'link_attr'   => $link_attr,
				'value'       => $this->value(),
			]
		);
	}
}
