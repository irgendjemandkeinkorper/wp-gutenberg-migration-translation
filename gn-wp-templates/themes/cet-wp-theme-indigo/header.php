<?php
/**
 * The header for our theme
 *
 * This is the template that displays all of the <head> section and everything up until <div id="content">
 *
 * @link https://developer.wordpress.org/themes/basics/template-files/#template-partials
 *
 * @package cet-wp-theme-indigo
 */

$header_class = get_theme_mod( 'indigo_sticky_nav', 'yes' ) === 'yes' ? 'sticky': '';
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
	<a class="skip-link screen-reader-text" href="#primary"><?php esc_html_e( 'Skip to content', 'cet-wp-theme-indigo' ); ?></a>

    <header id="masthead" class="site-header <?php echo esc_attr( $header_class ); ?>">

        <?php if ( has_nav_menu( 'header-social' ) ) : ?>
        	<div class="header-social-bar">
        		<div class="container">
        			<div class="header-social-bar__inner">
        				<?php cet_indigo_render_header_social_menu( 'header-social-menu--desktop' ); ?>
        			</div>
        		</div>
        	</div>
        <?php endif; ?>

        <div class="header-container container">
            <div class="site-branding">
                <?php the_custom_logo(); ?>
            </div>

            <?php //Search form
            $unique_id = esc_attr( uniqid( 'search-form-' ) ); ?>
            <form role="search" method="get" class="search-form header-search-form" action="<?php echo esc_url( home_url( '/' ) ); ?>">
                <label class="screen-reader-text" for="<?php echo $unique_id; ?>">
                    <?php _e( 'Search for:', 'textdomain' ); ?>
                </label>
                <input type="search" id="<?php echo $unique_id; ?>" class="search-field"
                       placeholder="<?php esc_attr_e( 'Search…', 'textdomain' ); ?>"
                       value="<?php echo get_search_query(); ?>" name="s" />
                <button type="submit" class="search-submit" aria-label="<?php esc_attr_e('Search', 'textdomain'); ?>">
                    <span class="material-symbols-outlined menu-icon">search</span>
                </button>
            </form>


            <?php // Cart icon
            if ( function_exists( 'WC' ) ) :
                $count = (int) WC()->cart->get_cart_contents_count(); ?>
                <a class="header-cart" href="<?php echo esc_url( wc_get_cart_url() ); ?>" aria-label="View cart">
                    <span class="material-symbols-outlined"><?php echo $count ? 'add_' : ''; ?>shopping_cart</span>
                    <span class="cart-count <?php echo $count ? '' : ' is-empty'; ?>" aria-hidden="<?php echo $count ? 'false' : 'true'; ?>">
                            <?php echo $count; ?>
                        </span>
                </a>
            <?php endif; ?>

          <?php
            $locations = get_nav_menu_locations();
            $menu_id   = $locations['header-right'] ?? null;

            if ( $menu_id ) {
                $menu_items = wp_get_nav_menu_items( $menu_id );

                if ( ! empty( $menu_items ) ) {
                    $item    = $menu_items[0];
                    $url     = $item->url ?? '';
                    $label   = $item->title ?? '';
                    $target  = $item->target ?? '';
                    $classes = ! empty( $item->classes ) && is_array( $item->classes )
                        ? implode( ' ', array_filter( $item->classes ) )
                        : '';
                    ?>
                    <a
                        href="<?php echo esc_url( $url ); ?>"
                        class="book-button button primary <?php echo esc_attr( $classes ); ?>"
                        <?php if ( '_blank' === $target ) : ?>
                            target="_blank" rel="noopener noreferrer"
                        <?php endif; ?>
                    >
                        <?php echo esc_html( $label ); ?>
                    </a>
                    <?php
                }
            }
            ?>


            <nav id="site-navigation" class="main-navigation" data-nav>
                <button class="menu-toggle" aria-controls="primary-menu" aria-expanded="false" data-toggle>
                    <span class="material-symbols-outlined menu-icon-open">menu</span>
                    <span class="material-symbols-outlined menu-icon-close">close</span>
                </button>

                <div class="navigation-container">
                    <div class="container">
                        <div class="menu-top d-flex d-xxl-none my-4">
                            <?php $title = get_theme_mod( 'mobile_menu_title', false ); ?>
                            <p><?php echo esc_html($title); ?></p>
                            <button id="back-button"><span class="material-symbols-outlined">arrow_left_alt</span>Back</button>
                        </div>
                        <?php
                        wp_nav_menu(
                            array(
                                'theme_location' => 'primary-navigation',
                                'menu_id'        => 'primary-menu',
                            )
                        );
                        ?>

                        <?php if ( has_nav_menu( 'header-social' ) ) : ?>
                            <div class="mobile-social-wrap d-xxl-none">
                                <?php cet_indigo_render_header_social_menu( 'header-social-menu--mobile' ); ?>
                            </div>
                        <?php endif; ?>
                    </div>
                </div>
            </nav><!-- #site-navigation -->
        </div>
    </header><!-- #masthead -->

