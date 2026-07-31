<?php
/**
 * Template part for displaying page content in page.php
 *
 * @link https://developer.wordpress.org/themes/basics/template-hierarchy/
 *
 * @package cet-wp-theme-indigo
 */

?>

<article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
	<?php if (!is_front_page()) {
		get_template_part('template-parts/hero');
	} ?>
	<div class="entry-content container">
		<?php
		// CET-7975 - Needed to retain password protection functionality
		if (post_password_required()) {
			echo get_the_password_form();
		} else {
			// Filter applied to add row in content
			$content_blocks = parse_blocks(get_the_content());
			$block_count = count($content_blocks);

			// Only allow few blocks to bypass the_content filter as it is breaking the calendar embed block. This is a temporary fix until we find a better solution.
			$raw_blocks = ['tec/calendar-embed'];

			foreach ($content_blocks as $index => $block) {

				// Adds cet-full-width-inside-container class to hero style blocks
				if (!empty($block['blockName'])) {
					$class_name = 'row ';
					if (!empty($block['attrs']['className'])) {
						if ($block['attrs']['className'] === 'is-style-hero-slider' || $block['attrs']['className'] === 'is-style-hero') {
							$class_name = 'indigo-full-width-inside-container ';
						}
					}
					// Adds bootstrap padding bottom to all blocks except the last one
					if ($index < $block_count - 1) {
						$class_name .= 'pb-3 pb-md-4 pb-xxl-5 ';
					}

					$block_content = render_block($block);
					
					// Only apply the_content filter to blocks that are not in the raw_blocks array as it is breaking the calendar embed block. This is a temporary fix until we find a better solution.
					if (!in_array($block['blockName'], $raw_blocks, true)) {
						$block_content = apply_filters('the_content', $block_content); 
					}?>
					
					<div class="<?php echo $class_name; ?>">
						<div class="col-12 d-flex flex-column">
							<?php echo $block_content; ?>
						</div>
					</div>
					<?php
				}
			}
		}
		?>
	</div><!-- .entry-content -->

	<?php if (get_edit_post_link()): ?>
		<footer class="entry-footer">
			<?php
			edit_post_link(
				sprintf(
					wp_kses(
						/* translators: %s: Name of current post. Only visible to screen readers */
						__('Edit <span class="screen-reader-text">%s</span>', 'cet-wp-theme-indigo'),
						array(
							'span' => array(
								'class' => array(),
							),
						)
					),
					wp_kses_post(get_the_title())
				),
				'<span class="edit-link">',
				'</span>'
			);
			?>
		</footer><!-- .entry-footer -->
	<?php endif; ?>
</article><!-- #post-<?php the_ID(); ?> -->