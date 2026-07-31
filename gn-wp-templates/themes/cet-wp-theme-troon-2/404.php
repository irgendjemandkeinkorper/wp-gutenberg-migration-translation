<?php
/**
 * The template for displaying 404 pages
 *
 * @package cet-wp-theme-troon-2
 */

get_header();
?>

	<main id="primary" class="site-main cet-page-layout">

		<section class="error-404 not-found" style="margin-bottom: 1rem;">
			<header class="page-header cet-container">
				<h1 class="page-title"><?php esc_html_e( 'Page Not Found', 'cet-wp-theme-troon-2' ); ?></h1>
			</header>

			<div class="page-content cet-container">
				<p><?php esc_html_e( 'The page you are looking for cannot be found.', 'cet-wp-theme-troon-2' ); ?></p>

				<?php get_search_form(); ?>
			</div>
		</section>

	</main>

<?php
get_footer();
