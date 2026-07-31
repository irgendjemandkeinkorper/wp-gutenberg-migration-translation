<?php

/**
 * The template for displaying 404 pages (not found)
 *
 * @link https://codex.wordpress.org/Creating_an_Error_404_Page
 *
 * @package cet-wp-theme-indigo
 */

get_header();
?>

<main id="primary" class="site-main">
	<section class="error-404 not-found">
		<div class="container">
			<div class="error-404__content">
				<h1 class="page-title"><?php esc_html_e('Not found, error 404.', 'cet-wp-theme-indigo'); ?></h1>
				<div class="page-content">
					<p>
						<?php
						printf(
							wp_kses_post(
								__(
									'The page you are looking for no longer exists. Perhaps you can return back to the <a href="%1$s">homepage</a> and see if you can find what you are looking for. Or, you can try finding it by using the search form below.',
									'cet-wp-theme-indigo'
								)
							),
							esc_url(home_url('/'))
						);
						?>
					</p>
					<?php get_search_form(); ?>
				</div>
			</div>
		</div>
	</section>
</main>

<?php
get_footer();