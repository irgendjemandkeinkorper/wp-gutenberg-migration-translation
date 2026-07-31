<?php use Cet\Theme\Troon2\Navigation\MenuLocation; ?>
<nav
	class="header-primary-nav"
	data-menu="primary"
	aria-label="<?php esc_attr_e( 'Header primary menu', 'cet-wp-theme-troon-2' ); ?>"
>
	<?php
	wp_nav_menu( [
		'theme_location' => MenuLocation::Primary->value,
		'container'      => false,
		'menu_class'     => 'header-primary-nav__list',
	] );
	?>
</nav>
