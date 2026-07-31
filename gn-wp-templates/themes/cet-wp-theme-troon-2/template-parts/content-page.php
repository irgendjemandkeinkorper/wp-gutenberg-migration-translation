<?php
/**
 * Template part for displaying page content
 *
 * @package cet-wp-theme-troon-2
 */

?>

<article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>

	<?php if ( ! is_front_page() ) : ?>
		<?php \Cet\Theme\Troon2\Layout\HeroRenderer::render(); ?>
	<?php endif; ?>

	<div class="entry-content cet-container">
		<?php
		the_content();

		wp_link_pages(
			array(
				'before' => '<div class="page-links">' . esc_html__( 'Pages:', 'cet-wp-theme-troon-2' ),
				'after'  => '</div>',
			)
		);
		?>
	</div>
</article>
