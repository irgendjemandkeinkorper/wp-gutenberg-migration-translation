<?php use Cet\Theme\Troon2\Navigation\MenuLocation; ?>
<nav class="header-tertiary-nav burger-nav" data-menu="tertiary">
	<div class="menu burger-nav__container">
		<div class="site-header__container">
			<div class="site-header__menus-wrapper">
				<button
					class="site-header__burger"
					data-burger-close-handler
				><?php echo $burger_close_icon; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></button>
			</div>
		</div>
		<h2 class="burger-nav__heading"><?php echo esc_html( $burger_heading ); ?></h2>
	</div>
	<?php if ( has_nav_menu( MenuLocation::Tertiary->value ) ) : ?>
		<?php
		// When tertiary is assigned, overflow items are prepended via the
		// prependOverflowItems filter on wp_nav_menu_objects (priority 5).
		wp_nav_menu( [
			'theme_location'       => MenuLocation::Tertiary->value,
			'container'            => 'div',
			'container_class'      => 'burger-nav__list-wrapper',
			'container_aria_label' => esc_attr__( 'Header tertiary menu', 'cet-wp-theme-troon-2' ),
			'menu_class'           => 'burger-nav__list',
		] );
		?>
	<?php elseif ( ! empty( $overflow_items ) ) : ?>
		<div class="burger-nav__list-wrapper" aria-label="<?php esc_attr_e( 'Header tertiary menu', 'cet-wp-theme-troon-2' ); ?>">
			<ul class="burger-nav__list">
				<?php
				// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
				echo walk_nav_menu_tree( $overflow_items, 0, (object) [ 'walker' => new \Walker_Nav_Menu() ] );
				?>
			</ul>
		</div>
	<?php endif; ?>
</nav>
