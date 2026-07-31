<?php

namespace Cet\Theme\Troon2\Customizer;

/**
 * Represents a customizer section.
 *
 * @package cet-wp-theme-troon-2
 */
class Section {

	/**
	 * Section ID.
	 *
	 * @var string
	 */
	private string $id;

	/**
	 * Section title.
	 *
	 * @var string
	 */
	private string $title;

	/**
	 * Section priority.
	 *
	 * @var int
	 */
	private int $priority;

	/**
	 * Section description.
	 *
	 * @var string
	 */
	private string $description;

	/**
	 * Optional panel ID to nest this section under.
	 *
	 * @var string
	 */
	private string $panel;

	/**
	 * Constructor.
	 *
	 * @param string $id Section ID.
	 * @param string $title Section title.
	 * @param int    $priority Section priority.
	 * @param string $description Section description.
	 * @param string $panel Optional panel ID.
	 */
	public function __construct(
		string $id,
		string $title,
		int $priority = 160,
		string $description = '',
		string $panel = ''
	) {
		$this->id          = $id;
		$this->title       = $title;
		$this->priority    = $priority;
		$this->description = $description;
		$this->panel       = $panel;
	}

	/**
	 * Get section ID.
	 *
	 * @return string
	 */
	public function getId(): string {
		return $this->id;
	}

	/**
	 * Convert to array for WordPress Customizer API.
	 *
	 * @return array
	 */
	public function toArray(): array {
		$args = [
			'title'       => $this->title,
			'priority'    => $this->priority,
			'description' => $this->description,
		];

		if ( $this->panel ) {
			$args['panel'] = $this->panel;
		}

		return $args;
	}
}

