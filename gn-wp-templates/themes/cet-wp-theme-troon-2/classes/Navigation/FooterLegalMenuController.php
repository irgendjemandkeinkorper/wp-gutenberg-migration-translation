<?php

namespace Cet\Theme\Troon2\Navigation;

class FooterLegalMenuController extends AbstractMenuController {

	protected function getTemplateName(): string {
		return 'footer-legal-menu';
	}

	public function init(): void {
		add_filter( 'nav_menu_link_attributes', [ $this, 'addLinkAttributes' ], 10, 3 );
	}

	public function addLinkAttributes( array $atts, $item, $args ): array {
		if ( empty( $args->theme_location ) || MenuLocation::FooterLegal->value !== $args->theme_location ) {
			return $atts;
		}

		$atts['class'] = 'footer-legal-navigation__link';

		return $atts;
	}

	public function render(): void {
		if ( ! has_nav_menu( MenuLocation::FooterLegal->value ) ) {
			return;
		}

		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo $this->renderTemplate();
	}
}
