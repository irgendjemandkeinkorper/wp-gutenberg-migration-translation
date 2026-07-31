<?php

namespace Cet\Theme\Troon2\Navigation;

enum MenuLocation: string {
	case Primary      = 'primary';
	case Secondary    = 'secondary';
	case Tertiary     = 'tertiary';
	case FooterSocial = 'footer-social';
	case FooterLegal  = 'footer-legal';

	public function getLabel(): string {
		return match( $this ) {
			self::Primary      => esc_html__( 'Primary Menu', 'cet-wp-theme-troon-2' ),
			self::Secondary    => esc_html__( 'Secondary Menu', 'cet-wp-theme-troon-2' ),
			self::Tertiary     => esc_html__( 'Tertiary Menu', 'cet-wp-theme-troon-2' ),
			self::FooterSocial => esc_html__( 'Footer Social', 'cet-wp-theme-troon-2' ),
			self::FooterLegal  => esc_html__( 'Footer Legal', 'cet-wp-theme-troon-2' ),
		};
	}
}
