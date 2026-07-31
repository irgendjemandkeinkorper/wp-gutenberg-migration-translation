<?php
/**
 * The template for displaying archive pages
 *
 * @package cet-wp-theme-troon-2
 */

get_header();
?>

	<main id="primary" class="site-main cet-page-layout">

		<?php if ( have_posts() ) : ?>

			<header class="page-header cet-container">
				<?php
				the_archive_title( '<h1 class="page-title">', '</h1>' );
				the_archive_description( '<div class="archive-description">', '</div>' );
				?>
			</header>

			<?php
			while ( have_posts() ) :
				the_post();
				get_template_part( 'template-parts/content', get_post_type() );
			endwhile;

			the_posts_navigation();

		else :

			get_template_part( 'template-parts/content', 'none' );

		endif;
		?>

	</main>

<?php
get_footer();
