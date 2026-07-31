<nav class="mobile-nav burger-nav" data-menu="mobile">
	<div class="menu burger-nav__container">
		<div class="site-header__container">
			<div class="site-branding">
				<?php the_custom_logo(); ?>
			</div>
			<div class="site-header__menus-wrapper">
				<?php echo $secondary_menu_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
				<button
					class="site-header__burger"
					data-burger-close-handler
				><?php echo $burger_close_icon; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></button>
			</div>
		</div>
		<h2 class="burger-nav__heading"><?php echo esc_html( $burger_heading ); ?></h2>
		<div class="burger-nav__list-wrapper"><?php $render_items( 0 ); ?></div>
	</div>
</nav>
