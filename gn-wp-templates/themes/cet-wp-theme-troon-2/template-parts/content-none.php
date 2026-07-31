<?php

/**
 * Template part for displaying a message when no posts are found
 *
 * @package cet-wp-theme-troon-2
 */
?>

<section class="no-results not-found">
    <header class="page-header cet-container">
        <h1 class="page-title"><?php esc_html_e('Nothing Found', 'cet-wp-theme-troon-2'); ?></h1>
    </header>

    <div class="page-content cet-container">
        <?php if (is_search()) : ?>
            <p><?php esc_html_e('Sorry, but nothing matched your search terms. Please try again with different keywords.', 'cet-wp-theme-troon-2'); ?></p>
            <?php get_search_form(); ?>
        <?php else : ?>
            <p><?php esc_html_e('It seems we cannot find what you are looking for.', 'cet-wp-theme-troon-2'); ?></p>
            <?php get_search_form(); ?>
        <?php endif; ?>
    </div>
</section>