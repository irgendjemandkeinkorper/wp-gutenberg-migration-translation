<?php
/**
 * Outputs the Social menu at the top of every page.
 * 
 * @package sunstone-pro
 */
if ( has_nav_menu( 'header-social-menu' ) ) {
	echo '<nav aria-label="' . esc_attr__( 'Social Links', 'rkv' ) . '" class="sunstone-pre-header"><div class="wrap">';
		wp_nav_menu(
			array(
				'theme_location' => 'header-social-menu',
				'container'      => false,
				'menu_class'     => 'social-nav',
				'depth'          => 1,
			) 
		);
	echo '</div></nav>';
}