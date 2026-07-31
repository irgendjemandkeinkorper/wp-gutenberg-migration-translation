<?php
/**
 * The template for displaying all single posts
 *
 * @package cet-wp-theme-troon-2
 */

get_header();
?>

	<main id="primary" class="site-main cet-page-layout">

		<?php
		while ( have_posts() ) :
			the_post();

			get_template_part( 'template-parts/content', 'single' );

			the_post_navigation();

		endwhile;
		?>

	</main>

<?php
get_footer();
