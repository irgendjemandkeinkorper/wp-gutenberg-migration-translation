<?php

namespace Cet\Theme\Troon2\Navigation;

abstract class AbstractMenuController implements MenuControllerInterface {

	public function init(): void {}

	abstract protected function getTemplateName(): string;

	/**
	 * Load a navigation template via output buffering, passing $data into scope.
	 *
	 * @param array $data Variables to extract into the template scope.
	 * @return string Rendered HTML.
	 */
	protected function renderTemplate( array $data = [] ): string {
		// phpcs:ignore WordPress.PHP.DontExtract.extract_extract
		extract( $data );

		ob_start();

		$template = locate_template( 'template-parts/navigation/' . $this->getTemplateName() . '.php' );

		if ( $template ) {
			include $template;
		}

		return (string) ob_get_clean();
	}

	public function render(): void {
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo $this->renderTemplate();
	}
}
