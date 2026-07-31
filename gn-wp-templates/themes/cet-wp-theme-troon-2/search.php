<?php
/**
 * The template for displaying search results.
 *
 * @package cet-wp-theme-troon-2
 */

get_header();

$search_query = get_search_query();
$hero_title   = $search_query
	? __( 'Search Results', 'cet-wp-theme-troon-2' )
	: __( 'Search', 'cet-wp-theme-troon-2' );
$hero_caption = $search_query
	? sprintf(
		/* translators: %s: search query. */
		__( 'Results for "%s"', 'cet-wp-theme-troon-2' ),
		$search_query
	)
	: __( 'Find pages, posts, and site content.', 'cet-wp-theme-troon-2' );

ob_start();
get_template_part(
	'patterns/banner-hero-short-image',
	null,
	[
		'title'   => $hero_title,
		'caption' => $hero_caption,
	]
);
$hero_markup = (string) ob_get_clean();
?>

<main id="primary" class="site-main cet-page-layout">

	<?php echo do_blocks( $hero_markup ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>

	<section class="search-page cet-container">
		<div class="search-page__form-wrap">
			<?php get_search_form(); ?>
		</div>

		<?php if ( have_posts() ) : ?>
			<header class="search-page__header">
				<p class="search-page__count">
					<?php
					printf(
						/* translators: %d: number of search results. */
						esc_html( _n( '%d result found', '%d results found', (int) $wp_query->found_posts, 'cet-wp-theme-troon-2' ) ),
						(int) $wp_query->found_posts
					);
					?>
				</p>
			</header>

			<div class="search-page__results">
				<?php
				while ( have_posts() ) :
					the_post();
					get_template_part( 'template-parts/content', 'search' );
				endwhile;
				?>
			</div>

			<?php the_posts_navigation(); ?>

		<?php else : ?>
			<section class="search-page__empty">
				<h2 class="search-page__empty-title"><?php esc_html_e( 'Nothing Found', 'cet-wp-theme-troon-2' ); ?></h2>
				<p><?php esc_html_e( 'Sorry, but nothing matched your search terms. Please try again with different keywords.', 'cet-wp-theme-troon-2' ); ?></p>
			</section>
		<?php endif; ?>
	</section>

</main>

<?php
get_footer();
