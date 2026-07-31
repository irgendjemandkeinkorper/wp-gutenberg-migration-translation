<?php
/**
 * Widget area registrar.
 *
 * @package cet-wp-theme-troon-2
 */

namespace Cet\Theme\Troon2\Layout;

/**
 * Registers custom widget areas for the theme.
 */
class WidgetAreaRegistrar {

	/**
	 * Hook into WordPress to register widget areas.
	 *
	 * @return void
	 */
	public static function init() {
		add_action( 'widgets_init', [ self::class, 'register' ] );
	}

	/**
	 * Register widget areas.
	 *
	 * @return void
	 */
	public static function register() {
		register_sidebar(
			[
				'name'          => __( 'Footer After', 'cet-wp-theme-troon-2' ),
				'id'            => 'footer-after',
				'description'   => __( 'Widget area at the end of the footer for the cookie consent banner.', 'cet-wp-theme-troon-2' ),
				'before_widget' => '<div id="%1$s" class="widget %2$s">',
				'after_widget'  => '</div>',
				'before_title'  => '',
				'after_title'   => '',
			]
		);

		register_sidebar(
			[
				'name'          => __( 'Footer Logo', 'cet-wp-theme-troon-2' ),
				'id'            => 'footer-logo',
				'description'   => __( 'Widget area for an additional logo in the footer.', 'cet-wp-theme-troon-2' ),
				'before_widget' => '<div id="%1$s" class="widget %2$s">',
				'after_widget'  => '</div>',
				'before_title'  => '',
				'after_title'   => '',
			]
		);
	}
}
