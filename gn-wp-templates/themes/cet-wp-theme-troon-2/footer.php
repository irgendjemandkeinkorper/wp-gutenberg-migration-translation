<?php
/**
 * The footer template.
 *
 * @package cet-wp-theme-troon-2
 */

?>
	<footer id="colophon" class="site-footer">
		<div class="site-footer__container">
			<div class="site-footer__content">
				<div class="site-footer__column site-footer__column--left">
					<div class="site-footer__logo-container">
						<?php the_custom_logo(); ?>
						<?php if ( is_active_sidebar( 'footer-logo' ) ) : ?>
							<?php dynamic_sidebar( 'footer-logo' ); ?>
						<?php endif; ?>
					</div>
					<?php \Cet\Theme\Troon2\Navigation\NavigationFactory::social()->render(); ?>
				</div>

				<div class="site-footer__column site-footer__column--center">

					<div class="site-footer__primary-info">
						<?php
						$site_name = get_bloginfo( 'name' );
						$address   = get_option( 'child_override_address' );
						$phone     = get_option( 'child_override_phone' );
						?>
						<?php if ( $site_name || $address || $phone ) : ?>
							<p class="site-footer__primary-text p3">
								<?php if ( $site_name ) : ?>
									<span class="site-footer__primary-item site-footer__primary-item--name">
										<?php echo esc_html( $site_name ); ?>
									</span>
								<?php endif; ?>

								<?php if ( $address ) : ?>
									<span class="site-footer__primary-separator" aria-hidden="true">•</span>
									<span class="site-footer__primary-item site-footer__primary-item--address">
										<?php echo esc_html( $address ); ?>
									</span>
								<?php endif; ?>

								<?php if ( $phone ) : ?>
									<span class="site-footer__primary-separator" aria-hidden="true">•</span>
									<span class="site-footer__primary-item site-footer__primary-item--phone">
										<?php echo esc_html( $phone ); ?>
									</span>
								<?php endif; ?>
							</p>
						<?php endif; ?>
					</div>

					<div class="site-footer__copyright">
						<p class="site-footer__copyright-text p3">
							<?php
							printf(
								// translators: %1$s: current year, %2$s: site name.
								esc_html__( 'Copyright © %1$s %2$s. All Rights Reserved.', 'cet-wp-theme-troon-2' ),
								esc_html( gmdate( 'Y' ) ),
								esc_html( get_bloginfo( 'name' ) )
							);
							?>
						</p>
					</div>

					<div class="site-footer__powered-by">
						<p class="site-footer__powered-by-label p3"><?php echo esc_html__( 'Powered by', 'cet-wp-theme-troon-2' ); ?></p>
						<img src="<?php echo esc_url( get_template_directory_uri() . '/images/golfnow-logo.svg' ); ?>" alt="<?php echo esc_attr__( 'GolfNow', 'cet-wp-theme-troon-2' ); ?>">
					</div>
				</div>

				<div class="site-footer__column site-footer__column--right">
					<img
						class="site-footer__partner-logo"
						src="<?php echo esc_url( get_template_directory_uri() . '/images/troon-golf-logo.png' ); ?>"
						alt="<?php echo esc_attr__( 'Troon Golf', 'cet-wp-theme-troon-2' ); ?>">

					<?php
					// TODO: Re-enable footer legal navigation once final design/requirements are confirmed.
					// phpcs:ignore Squiz.Commenting.InlineComment.InvalidEndChar -- Commented-out code.
					// \Cet\Theme\Troon2\Navigation\NavigationFactory::legal()->render();
					?>
				</div>
			</div>

		</div>

		<?php if ( is_active_sidebar( 'footer-after' ) ) : ?>
			<?php dynamic_sidebar( 'footer-after' ); ?>
		<?php endif; ?>

	</footer>
	</div><!-- #page -->



	<?php wp_footer(); ?>

	</body>
	</html>
