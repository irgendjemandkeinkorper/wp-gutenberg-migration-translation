<?php
/**
 * Register block patterns used for this theme.
 *
 * @package sunstone-pro
 */

namespace SunstonePro\Blocks\Patterns;

/**
 * Gets the pattern HTML for the given pattern name.
 *
 * @param string $template The name of the pattern template to be loaded.
 */
function get_template_content( $template ) {
	ob_start();
	get_template_part( 'lib/gutenberg/patterns/' . $template );
	return ob_get_clean();
}

/**
 * Registers a page pattern.
 *
 * @param  string $title    The template title.
 * @param  string $template The template file.
 * @return void
 */
function register_page_pattern( $title, $template ) {
	register_block_pattern(
		'sunstone-pro/' . sanitize_title( $title ),
		[
			'title'      => $title,
			'blockTypes' => [ 'core/post-content' ],
			'content'    => get_template_content( $template ),
		]
	);
}

/**
 * Registers block patterns if the register_pattern function exists.
 *
 * Patterns can be added with `register_block_pattern`, making sure to include a title, category
 * and template. An example can be found below, for Cover Hero.
 *
 * To generate a pattern:
 * 1. Create the pattern inside of the block editor.
 * 2. Switch to the "Code Editor" and copy and paste the HTML.
 * 3. Unminfiy the HTML (https://unminify.com/)
 * 4. Create a new partial inside of "/patterns/"
 * 5. Create a new register_block_pattern section below, pointing "content" at the partial.
 */
function init() {
	register_page_pattern(
		__( 'Accessibility Policy', 'sunstone-pro' ),
		'page/accessibility'
	);

	register_page_pattern(
		__( 'Book a Tee Time', 'sunstone-pro' ),
		'page/book-tee-time'
	);

	register_page_pattern(
		__( 'Contact Us', 'sunstone-pro' ),
		'page/contact'
	);

	register_page_pattern(
		__( 'Course Details', 'sunstone-pro' ),
		'page/course-details'
	);

	register_page_pattern(
		__( 'Course Tour', 'sunstone-pro' ),
		'page/course-tour'
	);

	register_page_pattern(
		__( 'Facilities', 'sunstone-pro' ),
		'page/facilities'
	);

	register_page_pattern(
		__( 'Front Page', 'sunstone-pro' ),
		'page/front-page'
	);

	register_page_pattern(
		__( 'Gallery', 'sunstone-pro' ),
		'page/gallery'
	);

	register_page_pattern(
		__( 'Membership Information', 'sunstone-pro' ),
		'page/membership'
	);

	register_page_pattern(
		__( 'Rates', 'sunstone-pro' ),
		'page/rates'
	);

	register_page_pattern(
		__( 'Site Map', 'sunstone-pro' ),
		'page/site-map'
	);

	register_page_pattern(
		__( 'Tee Time Specials', 'sunstone-pro' ),
		'page/specials'
	);

	register_page_pattern(
		__( 'Tournaments & Events', 'sunstone-pro' ),
		'page/tournaments'
	);

	register_page_pattern(
		__( 'Weddings & Banquets', 'sunstone-pro' ),
		'page/weddings'
	);

	$category = 'featured';
	$pattern  = 'hero';
	register_block_pattern(
		$pattern,
		[
			'title'      => __( 'Hero', 'sunstone-pro' ),
			'content'    => get_template_content( $category . '-' . $pattern ),
			'categories' => [ $category ],
		]
	);

	$category = 'columns';
	$pattern  = 'home';
	register_block_pattern(
		$pattern,
		[
			'title'      => __( 'Home', 'sunstone-pro' ),
			'content'    => get_template_content( $category . '-' . $pattern ),
			'categories' => [ $category ],
		]
	);

	$pattern = 'course-card-table';
	register_block_pattern(
		$pattern,
		[
			'title'      => __( 'Course Card & Table', 'sunstone-pro' ),
			'content'    => get_template_content( $category . '-' . $pattern ),
			'categories' => [ $category ],
		]
	);

	$category = 'text';
	$pattern  = 'welcome';
	register_block_pattern(
		$pattern,
		[
			'title'      => __( 'Welcome', 'sunstone-pro' ),
			'content'    => get_template_content( $category . '-' . $pattern ),
			'categories' => [ $category ],
		]
	);

	$pattern = 'course-details';
	register_block_pattern(
		$pattern,
		[
			'title'      => __( 'Course Details', 'sunstone-pro' ),
			'content'    => get_template_content( $category . '-' . $pattern ),
			'categories' => [ $category ],
		]
	);

	$pattern = 'facilities';
	register_block_pattern(
		$pattern,
		[
			'title'      => __( 'Facilities', 'sunstone-pro' ),
			'content'    => get_template_content( $category . '-' . $pattern ),
			'categories' => [ $category, 'columns' ],
		]
	);

	$pattern = 'two-column-form';
	register_block_pattern(
		$pattern,
		[
			'title'      => __( 'Two Columns with Form', 'sunstone-pro' ),
			'content'    => get_template_content( $category . '-' . $pattern ),
			'categories' => [ $category, 'columns' ],
		]
	);

	$pattern = 'contact';
	register_block_pattern(
		$pattern,
		[
			'title'      => __( 'Contact', 'sunstone-pro' ),
			'content'    => get_template_content( $category . '-' . $pattern ),
			'categories' => [ $category, 'columns' ],
		]
	);

	$category = 'before-footer';
	$pattern = 'book-a-tee-time';
	register_block_pattern(
		$pattern,
		[
			'title'      => __( 'Before Footer Cover', 'sunstone-pro' ),
			'content'    => get_template_content( $category . '-' . $pattern ),
			'categories' => [ $category ],
		]
	);
}
add_action( 'init', __NAMESPACE__ . '\init' );
