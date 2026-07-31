<?php
/**
 * cet-wp-theme-indigo functions and definitions
 *
 * @link https://developer.wordpress.org/themes/basics/theme-functions/
 *
 * @package cet-wp-theme-indigo
 */

/**
 * Load required autoloader, etc
 */
require get_stylesheet_directory() . '/bootstrap.php';

if ( ! defined( '_S_VERSION' ) ) {
	// Replace the version number of the theme on each release.
	define( '_S_VERSION', '1.0.78' );
}

/**
 * Workaround: Event Tickets' Move_Tickets dialog uses iframe_header(),
 * which fires admin_enqueue_scripts with null $hook_suffix.
 * This breaks any strict-typed callbacks hooked to admin_enqueue_scripts.
 *
 * We set $hook_suffix to an empty string only in this specific context.
 * Safe to remove if Event Tickets patches this upstream.
 */
add_action( 'admin_init', function() {
    global $hook_suffix;

    if ( isset( $_GET['page'] ) && 'tec-tickets-attendees' === $_GET['page'] ){
        $page   = sanitize_key( wp_unslash( $_GET['page'] ) );
        $dialog = sanitize_key( wp_unslash( $_GET['dialog'] ) );

        if ( 'tec-tickets-attendees' === $page && ! empty( $dialog ) && ! isset( $hook_suffix ) ) {
            $hook_suffix = '';
        }
    }
}, 0 );

/**
 * Sets up theme defaults and registers support for various WordPress features.
 *
 * Note that this function is hooked into the after_setup_theme hook, which
 * runs before the init hook. The init hook is too late for some features, such
 * as indicating support for post thumbnails.
 */
function cet_wp_theme_indigo_setup() {
	/*
		* Make theme available for translation.
		* Translations can be filed in the /languages/ directory.
		* If you're building a theme based on cet-wp-theme-indigo, use a find and replace
		* to change 'cet-wp-theme-indigo' to the name of your theme in all the template files.
		*/
	load_theme_textdomain( 'cet-wp-theme-indigo', get_template_directory() . '/languages' );

	// Add default posts and comments RSS feed links to head.
	add_theme_support( 'automatic-feed-links' );

	/*
		* Let WordPress manage the document title.
		* By adding theme support, we declare that this theme does not use a
		* hard-coded <title> tag in the document head, and expect WordPress to
		* provide it for us.
		*/
	add_theme_support( 'title-tag' );

	/*
		* Enable support for Post Thumbnails on posts and pages.
		*
		* @link https://developer.wordpress.org/themes/functionality/featured-images-post-thumbnails/
		*/
	add_theme_support( 'post-thumbnails' );

	// This theme uses wp_nav_menu() in one location.
	register_nav_menus(
		array(
			'primary-navigation' => esc_html__( 'Header', 'cet-wp-theme-indigo' ),
            'header-right'       => esc_html__( 'Header Right', 'cet-wp-theme-indigo' ),
            'header-social'      => esc_html__( 'Header Social', 'cet-wp-theme-indigo' ),
            'footer'             => esc_html__( 'Footer', 'cet-wp-theme-indigo' ),
            'footer-legal'       => esc_html__( 'Footer Legal', 'cet-wp-theme-indigo' ),
		)
	);

	/*
		* Switch default core markup for search form, comment form, and comments
		* to output valid HTML5.
		*/
	add_theme_support(
		'html5',
		array(
			'search-form',
			'comment-form',
			'comment-list',
			'gallery',
			'caption',
			'style',
			'script',
		)
	);

	// Set up the WordPress core custom background feature.
	add_theme_support(
		'custom-background',
		apply_filters(
			'cet_wp_theme_indigo_custom_background_args',
			array(
				'default-color' => 'ffffff',
				'default-image' => '',
			)
		)
	);

	// Add theme support for selective refresh for widgets.
	add_theme_support( 'customize-selective-refresh-widgets' );

	/**
	 * Add support for core custom logo.
	 *
	 * @link https://codex.wordpress.org/Theme_Logo
	 */
	add_theme_support(
		'custom-logo',
		array(
			'height'      => 250,
			'width'       => 250,
			'flex-width'  => true,
			'flex-height' => true,
		)
	);
}
add_action( 'after_setup_theme', 'cet_wp_theme_indigo_setup' );

/**
 * Load block editor styles (compiled from sass/editor.scss)
 */
add_action( 'after_setup_theme', function () {
	add_theme_support( 'editor-styles' );
	add_editor_style( 'editor.css' );
} );

add_action( 'enqueue_block_editor_assets', function () {
	$fonts = cet_wp_theme_indigo_fonts_map();
	$slug  = get_theme_mod( 'header_font', 'system-ui' );
	$stack = $fonts[ $slug ]['stack'] ?? $fonts['system-ui']['stack'];

	$primary   = sanitize_hex_color( get_theme_mod( 'primary_color', '#1D4F91' ) ) ?: '#1D4F91';
	$secondary = sanitize_hex_color( get_theme_mod( 'secondary_color', '#EDF1F6' ) ) ?: '#EDF1F6';

	$css = ":root, .editor-styles-wrapper{--header-font: {$stack}; --primary-color: {$primary}; --secondary-color: {$secondary};}";
	wp_add_inline_style( 'wp-edit-blocks', $css );
	wp_add_inline_style( 'wp-block-editor', $css );
}, 100);

/**
 * Set the content width in pixels, based on the theme's design and stylesheet.
 *
 * Priority 0 to make it available to lower priority callbacks.
 *
 * @global int $content_width
 */
function cet_wp_theme_indigo_content_width() {
	$GLOBALS['content_width'] = apply_filters( 'cet_wp_theme_indigo_content_width', 640 );
}
add_action( 'after_setup_theme', 'cet_wp_theme_indigo_content_width', 0 );

/**
 * Register widget area.
 *
 * @link https://developer.wordpress.org/themes/functionality/sidebars/#registering-a-sidebar
 */
function cet_wp_theme_indigo_widgets_init() {
    register_sidebar(
        array(
            'name'          => esc_html__( 'Sidebar', 'cet-wp-theme-indigo' ),
            'id'            => 'sidebar-1',
            'description'   => esc_html__( 'Add widgets here.', 'cet-wp-theme-indigo' ),
            'before_widget' => '<section id="%1$s" class="widget %2$s">',
            'after_widget'  => '</section>',
            'before_title'  => '<h2 class="widget-title">',
            'after_title'   => '</h2>',
        )
    );

	register_sidebar(
		array(
			'name'          => esc_html__( 'Before Footer', 'cet-wp-theme-indigo' ),
			'id'            => 'before-footer',
			'description'   => esc_html__( 'Widgets displayed before the footer.', 'cet-wp-theme-indigo' ),
			'before_widget' => '<section id="%1$s" class="widget %2$s">',
			'after_widget'  => '</section>',
			'before_title'  => '<h2 class="widget-title">',
			'after_title'   => '</h2>',
		)
	);

    register_sidebar(
        array(
            'name'          => esc_html__( 'Footer Widgets - Middle Column', 'cet-wp-theme-indigo' ),
            'id'            => 'footer-widgets',
            'description'   => esc_html__( 'Add widgets here.', 'cet-wp-theme-indigo' ),
            'before_widget' => '<section id="%1$s" class="widget %2$s">',
            'after_widget'  => '</section>',
            'before_title'  => '<h2 class="widget-title">',
            'after_title'   => '</h2>',
        )
    );

    register_sidebar(
        array(
            'name'          => esc_html__( 'Footer Widgets - Right Column', 'cet-wp-theme-indigo' ),
            'id'            => 'footer-widgets-right',
            'description'   => esc_html__( 'Add widgets here.', 'cet-wp-theme-indigo' ),
            'before_widget' => '<section id="%1$s" class="widget %2$s">',
            'after_widget'  => '</section>',
            'before_title'  => '<h2 class="widget-title">',
            'after_title'   => '</h2>',
        )
    );
}
add_action( 'widgets_init', 'cet_wp_theme_indigo_widgets_init' );

/**
 * Enqueue scripts and styles.
 */
function cet_wp_theme_indigo_scripts() {
	wp_enqueue_style( 'cet-wp-theme-indigo-style', get_stylesheet_uri(), array(), _S_VERSION );
	wp_style_add_data( 'cet-wp-theme-indigo-style', 'rtl', 'replace' );

	wp_enqueue_script( 'cet-wp-theme-indigo-navigation', get_template_directory_uri() . '/js/navigation.js', array(), _S_VERSION, true );
    wp_enqueue_script( 'cet-wp-theme-indigo-cart-count', get_template_directory_uri() . '/js/cart-count-sync.js', array('wp-data'), _S_VERSION, true );

    wp_enqueue_script(
        'cet-image-grid-show-more',
        get_template_directory_uri() . '/js/image-grid.js',
        array(),
        _S_VERSION,
        true
    );
    // Enqueue Newsletter style overrides
    wp_enqueue_script( 'cet-wp-theme-indigo-newsletter', get_template_directory_uri() . '/js/newsletter.js', array( 'jquery' ), _S_VERSION, true );

	if ( is_singular() && comments_open() && get_option( 'thread_comments' ) ) {
		wp_enqueue_script( 'comment-reply' );
	}

    //Enqueue Google fonts
    $fonts = cet_wp_theme_indigo_fonts_map();
    $slug  = get_theme_mod( 'header_font', 'system-ui' );
    if ( ! empty( $fonts[ $slug ]['google'] ) ) {
        $family = urlencode( $fonts[ $slug ]['google'] );
        wp_enqueue_style(
            'cet-google-font-header',
            "https://fonts.googleapis.com/css2?family={$family}&display=swap",
            [],
            _S_VERSION
        );
    } else {  //Enqueue Adobe fonts
        wp_enqueue_style(
            'cet-adobe-font-objektiv-mk1',
            "https://use.typekit.net/ohz4lwr.css",
            [],
            _S_VERSION
        );
    }

    //Enqueue Verdana
    wp_enqueue_style(
        'cet-adobe-font-verdana',
        "https://use.typekit.net/xox0szp.css",
        [],
        _S_VERSION
    );

    //Enqueue icons
    wp_enqueue_style(
        'cet-material-icons',
        "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined",
        [],
        _S_VERSION
    );
}

add_action( 'wp_enqueue_scripts', 'cet_wp_theme_indigo_scripts' );

function cet_enqueue_material_symbols() {
    wp_enqueue_style(
        'cet-material-icons-editor',
        'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined',
        [],
        _S_VERSION
    );
}

add_action( 'enqueue_block_editor_assets', 'cet_enqueue_material_symbols' );


add_action('admin_enqueue_scripts', function ($hook) {
    if ($hook !== 'widgets.php') {
        return;
    }

    wp_enqueue_style(
        'cet-admin-widgets',
        get_stylesheet_directory_uri() . '/admin-widgets.css',
        [],
        _S_VERSION
    );
});

add_action('enqueue_block_editor_assets', function () {
    wp_enqueue_script(
        'cet-button-styles',
        get_stylesheet_directory_uri() . '/js/button-styles.js',
        ['wp-blocks', 'wp-dom-ready'],
        _S_VERSION,
        true
    );
});

// Override GhostKit Carousel default attributes in the editor.
add_action( 'enqueue_block_editor_assets', function () {
	$script_url = get_stylesheet_directory_uri() . '/js/ghostkit-carousel-defaults.js';
    wp_enqueue_script(
        'cet-ghostkit-carousel-defaults',
        $script_url,
        [ 'wp-hooks', 'wp-blocks', 'lodash' ],
        _S_VERSION,
        true
    );
});


// Print inline styles.
function cet_wp_theme_indigo_inline_css() {
    $fonts = cet_wp_theme_indigo_fonts_map();
    $slug  = get_theme_mod( 'header_font', 'system-ui' );
    $stack = $fonts[ $slug ]['stack'] ?? $fonts['system-ui']['stack'];

    $primary_color = sanitize_hex_color( get_theme_mod( 'primary_color', '#1D4F91' ) ) ?: '#1D4F91';
    $secondary_color = sanitize_hex_color( get_theme_mod( 'secondary_color', '#EDF1F6' ) ) ?: '#EDF1F6';

    $hero_image_focus = get_post_meta( get_the_ID(), 'hero_image_focus', true ) ?: '50';

    echo "<style id='cet-theme-inline-css'>
		:root{
		  --header-font: {$stack};
		  --primary-color: {$primary_color};
		  --secondary-color: {$secondary_color};
		  --hero-image-focus: {$hero_image_focus}%;
		}
		</style>";
}

add_action( 'wp_head', 'cet_wp_theme_indigo_inline_css' );

function cet_wp_theme_indigo_fonts_map():array {
    return [
        'system-ui'  => [
            'label'  => __( 'System UI', 'cet-wp-theme-indigo' ),
            'stack'  => "-apple-system, sans-serif",
            'google' => '',
        ],
        'objektiv-mk1' => [
            'label'  => __( 'Objectiv Mk1 Bold', 'cet-wp-theme-indigo' ),
            'stack'  => "'objektiv-mk1', sans-serif",
            'google' => '',
        ],
        'montserrat' => [
            'label'  => __( 'Montserrat', 'cet-wp-theme-indigo' ),
            'stack'  => "'Montserrat', -apple-system, sans-serif",
            'google' => 'Montserrat:ital,wght@0,100..900;1,100..900',
        ],
        'raleway' => [
            'label'  => __( 'Raleway', 'cet-wp-theme-indigo' ),
            'stack'  => "'Raleway', -apple-system, sans-serif",
            'google' => 'Raleway:ital,wght@0,100..900;1,100..900',
        ],
        'oswald' => [
            'label'  => __( 'Oswald', 'cet-wp-theme-indigo' ),
            'stack'  => "'Oswald', -apple-system, sans-serif",
            'google' => 'Oswald:wght@200..700',
        ],
        'roboto-slab' => [
            'label'  => __( 'Roboto Slab', 'cet-wp-theme-indigo' ),
            'stack'  => "'Roboto Slab', -apple-system, serif",
            'google' => 'Roboto+Slab:wght@100..90',
        ],
        'playfair-display' => [
            'label'  => __( 'Playfair Display', 'cet-wp-theme-indigo' ),
            'stack'  => "'Playfair Display', -apple-system, sans-serif",
            'google' => 'Playfair+Display:ital,wght@0,400..900;1,400..900',
        ],
        'josefin-sans' => [
            'label'  => __( 'Josefin Sans', 'cet-wp-theme-indigo' ),
            'stack'  => "'Josefin Sans', -apple-system, sans-serif",
            'google' => 'Josefin+Sans:ital,wght@0,100..700;1,100..700',
        ],
        'lato' => [
            'label'  => __( 'Lato', 'cet-wp-theme-indigo' ),
            'stack'  => "'Lato', -apple-system, sans-serif",
            'google' => 'Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900',
        ],
    ];
}

// Registers Patterns Category
function cet_wp_theme_indigo_register_starter_patterns() {
    register_block_pattern_category(
        'indigo',
        array( 'label' => __( 'Indigo', 'cet-wp-theme-indigo' ) )
    );
    register_block_pattern_category(
        'indigo-blocks',
        array('label' => __('Indigo Blocks', 'cet-wp-theme-indigo'))
    );
}
add_action( 'init', 'cet_wp_theme_indigo_register_starter_patterns' );

// Only add the filter if WPForms plugin is active
if ( is_plugin_active( 'wpforms/wpforms.php' ) ) {
    add_filter( 'wpforms_webhooks_process_fill_http_body_params_value', function( $filled_params, $params, $process ) {
        $result = [];

        foreach ( $filled_params as $key => $value ) {
            // Convert dot notation to nested array
            if ( strpos( $key, '.' ) !== false ) {
                $keys = explode( '.', $key );
                $temp = &$result;

                foreach ( $keys as $k ) {
                    if ( ! isset( $temp[ $k ] ) ) {
                        $temp[ $k ] = [];
                    }
                    $temp = &$temp[ $k ];
                }

                $temp = $value;
            } else {
                $result[ $key ] = $value;
            }
        }

        return $result;
    }, 10, 3 );
}

/**
 * Implement the Custom Header feature.
 */
require get_template_directory() . '/inc/custom-header.php';

/**
 * Header social media icons.
 */
require get_template_directory() . '/inc/header-social.php';

/**
 * Custom template tags for this theme.
 */
require get_template_directory() . '/inc/template-tags.php';

/**
 * Functions which enhance the theme by hooking into WordPress.
 */
require get_template_directory() . '/inc/template-functions.php';

/**
 * Customizer additions.
 */
require get_template_directory() . '/inc/customizer.php';

/**
 * Load Jetpack compatibility file.
 */
if ( defined( 'JETPACK__VERSION' ) ) {
    require get_template_directory() . '/inc/jetpack.php';
}

/**
 * Update the header cart count fragment after AJAX add-to-cart.
 */
add_filter( 'woocommerce_add_to_cart_fragments', function ( $fragments ) {
    $count = (int) WC()->cart->get_cart_contents_count();
    ob_start();
    ?>
    <span class="cart-count<?php echo $count ? '' : ' is-empty'; ?>" aria-hidden="<?php echo $count ? 'false' : 'true'; ?>">
        <?php echo $count; ?>
    </span>
    <?php
    $fragments['.cart-count'] = ob_get_clean();
    return $fragments;
} );

/**
 * Initialize block styles and supports
 */

require get_template_directory() . '/inc/block_styles.php';
require get_template_directory() . '/inc/block_supports.php';

/**
 * Initialize default editor block colors
*/
require get_template_directory() . '/inc/editor-color-palette.php';

/**
 * Add hero block to products and events
 */
add_filter( 'tribe_events_before_html', 'add_product_hero_block_events', 10, 2 );
add_action( 'woocommerce_before_main_content', 'add_product_hero_block_woocommerce', 5 );

function cet_get_hero_template_html() {
    ob_start();
    get_template_part( 'template-parts/hero' );
    return ob_get_clean();
}

function add_product_hero_block_events( $before, $view = null ) {
    $is_calendar =
        ( function_exists( 'tribe_is_month' ) && tribe_is_month() ) ||
        ( function_exists( 'tribe_is_list_view' ) && tribe_is_list_view() ) ||
        ( function_exists( 'tribe_is_day' ) && tribe_is_day() ) ||
        ( function_exists( 'tribe_is_week' ) && tribe_is_week() ) ||
        ( function_exists( 'tribe_is_map' ) && tribe_is_map() ) ||
        ( function_exists( 'tribe_is_photo' ) && tribe_is_photo() );
    $is_events_archive = function_exists( 'tribe_is_event_query' ) && tribe_is_event_query() && ! is_singular( 'tribe_events' );
    $is_series   = get_post_type() === 'tribe_event_series';

    if ( ! $is_calendar && ! $is_events_archive && ! $is_series && ! is_singular( 'tribe_events' ) ) {
        return $before;
    }

    return cet_get_hero_template_html();
}

function add_product_hero_block_woocommerce() {
    $is_product  = function_exists( 'is_product' ) && is_product();
    $is_shop     = function_exists( 'is_shop' ) && is_shop();
    if ( ! $is_product &&  ! $is_shop ) {
        return;
    }

    echo cet_get_hero_template_html();
}

/**
 * CET-7895: Migrate hero image to header image
 */
require get_template_directory() . '/inc/migrate-customizer-hero-image.php';