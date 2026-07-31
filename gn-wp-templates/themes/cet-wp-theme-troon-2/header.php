<?php
/**
 * The header
 *
 * @package cet-wp-theme-troon-2
 */

use Cet\Theme\Troon2\Navigation\NavigationFactory;
use Cet\Theme\Troon2\Svg\SpriteManager;

?>
<!doctype html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<link rel="profile" href="https://gmpg.org/xfn/11">
	<?php wp_head(); ?>
</head>

<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<div id="page" class="site">
	<a class="skip-link screen-reader-text" href="#primary"><?php esc_html_e( 'Skip to content', 'cet-wp-theme-troon-2' ); ?></a>

    <div class="site-header">
        <header id="masthead" class="site-header__body sticky-container">
            <div class="site-header__container">
                <div class="site-branding">
                    <?php the_custom_logo(); ?>
                </div>
                <div class="site-header__menus-wrapper">
                    <?php NavigationFactory::primary()->render(); ?>
                    <?php NavigationFactory::secondary()->render(); ?>
                    <button
                            class="<?php echo esc_attr( NavigationFactory::tertiary()->getBurgerClass() ); ?>"
                            data-burger-open-handler
                    ><?php echo SpriteManager::getRenderedSvg( 'icon-hamburger-open-icon' ); ?></button>
                </div>
            </div>
        </header>

        <div class="site-header__overlay" role="presentation"></div>
        <?php NavigationFactory::tertiary()->render(); ?>
        <?php NavigationFactory::mobile()->render(); ?>
    </div>
