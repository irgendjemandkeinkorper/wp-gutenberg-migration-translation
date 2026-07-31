<?php
/**
 * Template part for displaying search results.
 *
 * @package cet-wp-theme-troon-2
 */
?>

<article id="post-<?php the_ID(); ?>" <?php post_class( 'search-result' ); ?>>
	<header class="search-result__header">
		<?php the_title( sprintf( '<h2 class="search-result__title"><a href="%s" rel="bookmark">', esc_url( get_permalink() ) ), '</a></h2>' ); ?>
	</header>

	<div class="search-result__summary">
		<?php the_excerpt(); ?>
	</div>
</article>
