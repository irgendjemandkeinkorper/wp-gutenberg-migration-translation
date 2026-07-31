<?php
/**
 * cet-wp-theme-indigo Theme Customizer
 *
 * @package cet-wp-theme-indigo
 */

use Cet\Theme\Indigo\Customizer\CustomizerController;
use Cet\Theme\Indigo\Customizer\Section;
use Cet\Theme\Indigo\Customizer\SimpleField;

/**
 * Add postMessage support for site title and description for the Theme Customizer.
 *
 * @param WP_Customize_Manager $wp_customize Theme Customizer object.
 */
function cet_wp_theme_indigo_customize_register( $wp_customize ) {
    cet_wp_theme_indigo_setup_selective_refresh( $wp_customize );

    $customizer = new CustomizerController();

    // Register a setting for the Menu mobile title
    $customizer->addSection(
        new Section(
            id: 'cet_menu_settings',
            title: __( 'Indigo Menu Settings', 'cet-wp-theme-indigo' ),
            priority: 5,
            description: __( 'Extra settings related to menus.', 'cet-wp-theme-indigo' ),
            panel: 'nav_menus'
        )
    );

    $customizer->addField(
        new SimpleField(
            id: 'mobile_menu_title',
            sectionId: 'cet_menu_settings',
            label: __( 'Mobile Menu Title', 'cet-wp-theme-indigo' ),
            type: 'text',
            sanitizeCallback: 'sanitize_text_field',
            transport: 'postMessage',
            default: '',
            description: __( 'Title displayed on mobile menu.', 'cet-wp-theme-indigo' )
        )
    );

    // Register a setting for the colors
    $customizer->addField(
        new SimpleField(
            id: 'primary_color',
            sectionId: 'colors',
            label: __( 'Primary Color', 'cet-wp-theme-indigo' ),
            type: 'color',
            sanitizeCallback: 'sanitize_hex_color',
            transport: 'postMessage',
            default: '#1D4F91'
        )
    );

    $customizer->addField(
        new SimpleField(
            id: 'secondary_color',
            sectionId: 'colors',
            label: __( 'Secondary Color', 'cet-wp-theme-indigo' ),
            type: 'color',
            sanitizeCallback: 'sanitize_hex_color',
            transport: 'postMessage',
            default: '#EDF1F6'
        )
    );

    // Register a setting for the fonts
    $choices = [];
    foreach ( cet_wp_theme_indigo_fonts_map() as $slug => $data ) {
        $choices[ $slug ] = $data['label'];
    }
    $customizer->addField(
        new SimpleField(
            id: 'header_font',
            sectionId: 'title_tagline',
            label: __( 'Header Font', 'cet-wp-theme-indigo' ),
            type: 'select',
            sanitizeCallback: 'sanitize_key',
            transport: 'postMessage',
            default: 'system-ui',
            priority: 99,
            choices: $choices
        )
    );

    // Register a setting for Indigo Logo.
    $customizer->addField(
        new SimpleField(
            id: 'indigo_hide_logo',
            sectionId: 'title_tagline',
            label: __( 'Hide Indigo logo', 'cet-wp-theme-indigo' ),
            type: 'checkbox',
            sanitizeCallback: function ( $val ) { return (bool) rest_sanitize_boolean( $val ); },
            transport: 'refresh',
            default: false,
            description: __( 'Hides the logo shown after "Managed by" in the footer.', 'cet-wp-theme-indigo' ),
            priority: 100,
            activeCallback: function () { return current_user_can( 'edit_theme_options' ); }
        )
    );

    // Register a setting for the Brand Logo, shown in the footer.
    $customizer->addField(
        new SimpleField(
            id: 'brand_logo',
            sectionId: 'title_tagline',
            label: __( 'Brand Logo', 'cet-wp-theme-indigo' ),
            type: 'image',
            sanitizeCallback: 'absint',
            transport: 'refresh',
            description: __( 'Shown in the footer under "Managed by". Falls back to the default logo if not set.', 'cet-wp-theme-indigo' )
        )
    );

    cet_wp_theme_indigo_patch_header_image_section( $wp_customize );

    // Register setting "Sticky Nav" to core panel
    // ex "Header Image" -> new "Header & Navigation"
    $customizer->addField(
        new SimpleField(
            id: 'indigo_sticky_nav',
            sectionId: 'header_image',
            label: __( 'Sticky Nav', 'cet-wp-theme-indigo' ),
            type: 'select',
            sanitizeCallback: 'sanitize_key',
            transport: 'postMessage',
            default: 'yes',
            choices: [
                'yes' => __( 'Yes', 'cet-wp-theme-indigo' ),
                'no'  => __( 'No', 'cet-wp-theme-indigo' ),
            ]
        )
    );

    // Remove override "Header Image Width/Height" fields
    $wp_customize->remove_control( 'child_override_header_image_width' );
    $wp_customize->remove_control( 'child_override_header_image_height' );
    $wp_customize->remove_setting( 'child_override_header_image_width' );
    $wp_customize->remove_setting( 'child_override_header_image_height' );


    //Register a new section to The Events Calendar
    $customizer->addSection(
        new Section(
            id: 'cet_events_settings',
            title: __( 'Indigo Settings', 'cet-wp-theme-indigo' ),
            priority: 150,
            description: __( 'Extra settings related to events page.', 'cet-wp-theme-indigo' ),
            panel: 'tribe_customizer'
        )
    );

    $customizer->addField(
        new SimpleField(
            id: 'indigo_events_image',
            sectionId: 'cet_events_settings',
            label: __( 'Hero image', 'cet-wp-theme-indigo' ),
            type: 'image',
            sanitizeCallback: 'absint',
            transport: 'refresh'
        )
    );

    $customizer->addField(
        new SimpleField(
            id: 'indigo_events_title',
            sectionId: 'cet_events_settings',
            label: __( 'Hero title', 'cet-wp-theme-indigo' ),
            type: 'text',
            sanitizeCallback: 'sanitize_text_field',
            transport: 'postMessage'
        )
    );

    $customizer->addField(
        new SimpleField(
            id: 'indigo_events_description',
            sectionId: 'cet_events_settings',
            label: __( 'Hero description', 'cet-wp-theme-indigo' ),
            type: 'text',
            sanitizeCallback: 'sanitize_text_field',
            transport: 'postMessage'
        )
    );

    $customizer->register( $wp_customize );
}
add_action( 'customize_register', 'cet_wp_theme_indigo_customize_register', 100 );

/**
 * Add postMessage support for site title and description, and register
 * their selective refresh partials.
 *
 * @param WP_Customize_Manager $wp_customize Theme Customizer object.
 */
function cet_wp_theme_indigo_setup_selective_refresh( $wp_customize ) {
    $wp_customize->get_setting( 'blogname' )->transport         = 'postMessage';
    $wp_customize->get_setting( 'blogdescription' )->transport  = 'postMessage';
    $wp_customize->get_setting( 'header_textcolor' )->transport = 'postMessage';

    if ( isset( $wp_customize->selective_refresh ) ) {
        $wp_customize->selective_refresh->add_partial(
            'blogname',
            array(
                'selector'        => '.site-title a',
                'render_callback' => 'cet_wp_theme_indigo_customize_partial_blogname',
            )
        );
        $wp_customize->selective_refresh->add_partial(
            'blogdescription',
            array(
                'selector'        => '.site-description',
                'render_callback' => 'cet_wp_theme_indigo_customize_partial_blogdescription',
            )
        );
    }
}

/**
 * Rewrite core Header Image control description and rename its section
 * to "Header & Navigation".
 *
 * @param WP_Customize_Manager $wp_customize Theme Customizer object.
 */
function cet_wp_theme_indigo_patch_header_image_section( $wp_customize ) {
    $control = $wp_customize->get_control( 'header_image' );
    if ( $control ) {
        $w = (int) get_theme_support( 'custom-header', 'width' );
        $h = (int) get_theme_support( 'custom-header', 'height' );

        $control->description = sprintf(
            esc_html__(
                'Click “Add Image” to upload an image file from your computer. Your theme works best with an image with a header size of %1$d × %2$d pixels — you’ll be able to crop your image once you upload it for a perfect fit.',
                'cet-wp-theme-indigo'
            ),
            $w,
            $h
        );
    }

    $header_section = $wp_customize->get_section( 'header_image' );
    if ( $header_section ) {
        $header_section->title = __( 'Header & Navigation', 'cet-wp-theme-indigo' );
    }
}


/**
 * Render the site title for the selective refresh partial.
 *
 * @return void
 */
function cet_wp_theme_indigo_customize_partial_blogname() {
    bloginfo( 'name' );
}

/**
 * Render the site tagline for the selective refresh partial.
 *
 * @return void
 */
function cet_wp_theme_indigo_customize_partial_blogdescription() {
    bloginfo( 'description' );
}

/**
 * Binds JS handlers to make Theme Customizer preview reload changes asynchronously.
 */
function cet_wp_theme_indigo_customize_preview_js() {
    wp_enqueue_script( 'cet-wp-theme-indigo-customizer', get_template_directory_uri() . '/js/customizer.js', array( 'customize-preview' ), _S_VERSION, true );
}
add_action( 'customize_preview_init', 'cet_wp_theme_indigo_customize_preview_js' );
