<?php
/**
 * The template for displaying all pages
 *
 * @package cet-wp-theme-troon-2
 */

get_header();
?>

	<main id="primary" class="site-main cet-page-layout">

		<?php
		while ( have_posts() ) :
			the_post();

			get_template_part( 'template-parts/content', 'page' );

		endwhile;
		?>

	</main>

<?php
get_footer();
