<?php
/**
 * The template for displaying the footer
 *
 * Contains the closing of the #content div and all content after.
 *
 * @link https://developer.wordpress.org/themes/basics/template-files/#template-partials
 *
 * @package cet-wp-theme-indigo
 */


$hide_logo      = (bool) get_theme_mod( 'indigo_hide_logo', false );
$brand_logo_id  = get_theme_mod( 'brand_logo', '' );
?>

<?php if ( is_active_sidebar( 'before-footer' ) ) : ?>
    <div class="before-footer-widgets">
		<?php dynamic_sidebar( 'before-footer' ); ?>
    </div>
<?php endif; ?>

<footer id="colophon" class="site-footer py-4 py-lg-5">
    <div class="container">
        <div class="footer-main row flex-md-row-reverse mb-md-5">
            <div class="footer-content col-12 col-md-7 col-xxl-6">
                <div class="footer-branding row pb-4">
                    <!-- Main logo section -->
                    <div class="logo-container col-12 mt-xxl-5">
                        <?php the_custom_logo(); ?>
                    </div>

                    <!-- `Managed by` section -->
                    <div class="logo-container col-12 mt-5">
                        <?php if ( ! $hide_logo ) : ?>
                            <p><?php echo esc_html__( 'Managed by:', 'cet-wp-theme-indigo' ); ?></p>
                            <?php if ( ! empty( $brand_logo_id ) ) : ?>
                                <?php echo wp_get_attachment_image( $brand_logo_id, 'thumbnail', false, [ 'decoding' => 'async', 'loading' => 'lazy' ] ); ?>
                            <?php else : ?>
                                <img width="114" height="58" src="https://vip.teeitup.com/wp-content/uploads/2025/10/indigo-logo.png" alt="Indigo Logo" decoding="async" loading="lazy">
                            <?php endif; ?>
                        <?php endif; ?>
                    </div>

                    <div class="col-12">
                        <?php dynamic_sidebar( 'footer-widgets-right' ); ?>
                    </div>
                </div>
            </div>
            <div class="footer-info col-12 col-md-5 col-xxl-6 row">
                <div class="footer-menu col-xxl-6 d-flex flex-column">
                    <h4 class="footer-title my-4 mt-xxl-5"><?php echo esc_html__( 'Quick Links', 'cet-wp-theme-indigo' ); ?></h4>
                    <?php
                    wp_nav_menu(
                        array(
                            'theme_location' => 'footer',
                            'menu_id'        => 'footer',
                        )
                    );
                    ?>
                </div>

                <div class="footer-contacts col-xxl-6 d-flex flex-column">
                    <h4 class="footer-title my-4 mt-xxl-5"><?php echo esc_html__( 'Contact Us', 'cet-wp-theme-indigo' ); ?></h4>
                    <?php dynamic_sidebar( 'footer-widgets' ); ?>
                </div>
            </div>
        </div>

        <div class="footer-legal pt-5 pt-md-4 pt-lg-5">
            <div class="copyright mb-3 my-md-0">
                <?php $site_name = trim( get_bloginfo( 'name' ) );

                if ( $site_name !== '' ) {
                    $site_name .= '. ';
                }

                printf(
                    esc_html__( 'Copyright © %1$s. %2$sAll rights reserved.', 'cet-wp-theme-indigo' ),
                    esc_html( date_i18n( 'Y' ) ),
                    esc_html( $site_name )
                );
                ?>
            </div>

            <?php
            wp_nav_menu(
                array(
                    'theme_location' => 'footer-legal',
                    'menu_id'        => 'footer-legal',
                )
            );
            ?>
        </div>
    </div>
</footer><!-- #colophon -->
</div><!-- #page -->

<?php wp_footer(); ?>

</body>
</html>
