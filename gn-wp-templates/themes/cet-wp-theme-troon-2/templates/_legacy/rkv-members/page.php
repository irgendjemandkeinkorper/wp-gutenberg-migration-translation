<?php

/**
 * Template for member-gated pages (rkv/members first block).
 *
 * Loaded transparently via the template_include filter in classes/Legacy/RkvMembersLayout.php.
 * Identical to page.php but wraps <main> and the sidebar in a flex layout container.
 *
 * @package cet-wp-theme-troon-2
 */

get_header();

?>

	<div class="site-main cet-members-layout">

		<main id="primary" class="cet-page-layout">

			<?php
			while ( have_posts() ) :
				the_post();

                get_template_part( 'template-parts/content', 'page' );

			endwhile;
			?>

		</main>

	</div>

<?php get_footer();
