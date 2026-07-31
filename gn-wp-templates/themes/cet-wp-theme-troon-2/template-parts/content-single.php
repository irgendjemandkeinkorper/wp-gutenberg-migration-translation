<?php
/**
 * Template part for displaying single posts
 *
 * @package cet-wp-theme-troon-2
 */

?>

<article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
	<header class="entry-header cet-container">
		<?php the_title( '<h1 class="entry-title">', '</h1>' ); ?>
	</header>

	<div class="entry-content cet-container">
		<?php the_content(); ?>
	</div>
</article>

<?php
if ( comments_open() || get_comments_number() ) :
	comments_template();
endif;
?>