<?php
/**
 * Troon.
 *
 * This file adds functions to the Troon Theme.
 *
 * @package Troon
 * @author  NBCU Sports Next
 * @license GPL-2.0-or-later
 * @link    https://business.golfnow.com/Website-Theme-Library/
 */

// Starts the engine.
require_once get_template_directory() . '/lib/init.php';
require_once get_stylesheet_directory() . '/lib/init.php';

// Sets up the Theme.
require_once get_stylesheet_directory() . '/lib/theme-defaults.php';

add_action( 'after_setup_theme', 'troon_localization_setup' );
/**
 * Sets localization (do not remove).
 *
 * @since 1.0.0
 */
function troon_localization_setup() {

    load_child_theme_textdomain( genesis_get_theme_handle(), get_stylesheet_directory() . '/languages' );

}

// Adds image upload and color select to Customizer.
require_once get_stylesheet_directory() . '/lib/customize.php';

add_action( 'wp_enqueue_scripts', 'troon_enqueue_scripts_styles', 20 );
/**
 * Enqueues scripts and styles.
 *
 * @since 1.0.0
 */
function troon_enqueue_scripts_styles() {

    $appearance = genesis_get_config( 'appearance' );
    
    $build_location = '/lib/processor-styles/build';
    $assets = require_once get_stylesheet_directory() . $build_location . '/theme-appearance.asset.php';
    
    wp_enqueue_style(
        genesis_get_theme_handle() . '-base-styles',
        get_stylesheet_directory_uri() . $build_location . '/style-theme-appearance.css',
        [ genesis_get_theme_handle() ],
        $assets['version']
    );

    wp_enqueue_script(
        genesis_get_theme_handle() . '-base-styles',
        get_stylesheet_directory_uri() . $build_location . '/theme-appearance.js',
        $assets['dependencies'],
        $assets['version'],
    );
    
    wp_enqueue_style(
        genesis_get_theme_handle() . '-base-font',
        'https://use.typekit.net/jmo7haf.css',
        [ genesis_get_theme_handle() ],
        $assets['version']
    );

    wp_enqueue_style( 'dashicons' );

    if ( genesis_is_amp() ) {
        wp_enqueue_style(
            genesis_get_theme_handle() . '-amp',
            get_stylesheet_directory_uri() . '/lib/amp/amp.css',
            [ genesis_get_theme_handle() ],
            genesis_get_theme_version()
        );
    }
}

add_filter( 'body_class', 'troon_body_classes' );
/**
 * Add additional classes to the body element.
 *
 * @since 3.4.1
 *
 * @param array $classes Classes array.
 * @return array $classes Updated class array.
 */
function troon_body_classes( $classes ) {

    if ( ! genesis_is_amp() ) {
        // Add 'no-js' class to the body class values.
        $classes[] = 'no-js';
    }

    if ( ! genesis_singular_image_hidden_on_current_page() ) {
        $classes[] = 'genesis-singular-image-visible';
    }

    $classes[] = 'palette';

    return $classes;
}

add_action( 'genesis_before', 'troon_js_nojs_script', 1 );
/**
 * Echo the script that changes 'no-js' class to 'js'.
 *
 * @since 3.4.1
 */
function troon_js_nojs_script() {

    if ( genesis_is_amp() ) {
        return;
    }

    ?>
    <script>
    //<![CDATA[
    (function(){
        var c = document.body.classList;
        c.remove( 'no-js' );
        c.add( 'js' );
    })();
    //]]>
    </script>
    <?php
}

add_action( 'after_setup_theme', 'troon_theme_support', 9 );
/**
 * Add desired theme supports.
 *
 * See config file at `config/theme-supports.php`.
 *
 * @since 3.0.0
 */
function troon_theme_support() {

    $theme_supports = genesis_get_config( 'theme-supports' );

    foreach ( $theme_supports as $feature => $args ) {
        add_theme_support( $feature, $args );
    }

}

add_action( 'after_setup_theme', 'troon_post_type_support', 9 );
/**
 * Add desired post type supports.
 *
 * See config file at `config/post-type-supports.php`.
 *
 * @since 3.0.0
 */
function troon_post_type_support() {

    $post_type_supports = genesis_get_config( 'post-type-supports' );

    foreach ( $post_type_supports as $post_type => $args ) {
        add_post_type_support( $post_type, $args );
    }

}

// Adds image sizes.
add_image_size( 'sidebar-featured', 75, 75, true );
add_image_size( 'troon-header-images', 1920, 700, [ 'center', 'center' ] );

add_filter( 'genesis_author_box_gravatar_size', 'troon_author_box_gravatar' );
/**
 * Modifies size of the Gravatar in the author box.
 *
 * @since 2.2.3
 *
 * @param int $size Original icon size.
 * @return int Modified icon size.
 */
function troon_author_box_gravatar( $size ) {

    return 90;

}

add_filter( 'genesis_comment_list_args', 'troon_comments_gravatar' );
/**
 * Modifies size of the Gravatar in the entry comments.
 *
 * @since 2.2.3
 *
 * @param array $args Gravatar settings.
 * @return array Gravatar settings with modified size.
 */
function troon_comments_gravatar( $args ) {

    $args['avatar_size'] = 60;
    return $args;

}

