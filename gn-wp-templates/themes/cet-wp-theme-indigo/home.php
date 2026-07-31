<?php
/**
 * The home template file.
 *
 * Used for the posts page when a static page is set in Reading Settings.
 */

get_header();

$posts_page_id = (int) get_option( 'page_for_posts' );
?>

<main id="primary" class="site-main posts-archive">
	<?php
    	if ( $posts_page_id ) {
    		get_template_part(
    			'template-parts/hero',
    			null,
    			[
    				'post_id' => $posts_page_id,
    			]
    		);
    	}
    	?>

	<section class="posts">
		<div class="container">

			<?php if ( have_posts() ) : ?>
				<ul class="posts-list posts-archive__grid">
					<?php
					while ( have_posts() ) :
						the_post();

						$image_html = '';

						if ( has_post_thumbnail() ) {
							$image_html = get_the_post_thumbnail(
								get_the_ID(),
								'large',
								[
									'class'   => 'post-card__image w-100',
									'loading' => 'lazy',
									'alt'     => the_title_attribute(
										[
											'echo' => false,
										]
									),
								]
							);
						} elseif ( $posts_page_id && has_post_thumbnail( $posts_page_id ) ) {
							$image_html = get_the_post_thumbnail(
								$posts_page_id,
								'large',
								[
									'class'   => 'post-card__image w-100',
									'loading' => 'lazy',
									'alt'     => the_title_attribute(
										[
											'echo' => false,
										]
									),
								]
							);
						}
						?>
						<li class="post-item">
							<article id="post-<?php the_ID(); ?>" <?php post_class( 'post-card' ); ?>>
								<?php if ( $image_html ) : ?>
								   <div class="post-card__image-wrapper">
                                        <a class="post-card__image-link d-block"
                                            href="<?php the_permalink(); ?>"
                                            aria-label="<?php echo esc_attr( get_the_title() ); ?>">
                                            <?php echo wp_kses_post( $image_html ); ?>
                                        </a>
                                    </div>
								<?php endif; ?>
								<div class="post-card__content d-flex flex-column">
									<h2 class="post-card__title h4 mb-0">
										<a href="<?php the_permalink(); ?>">
											<?php the_title(); ?>
										</a>
									</h2>
								</div>
							</article>
						</li>
						<?php
					endwhile;
					?>
				</ul>

				<?php
				the_posts_pagination(
					[
						'mid_size'  => 1,
						'prev_text' => __( 'Previous', 'cet-wp-theme-indigo' ),
						'next_text' => __( 'Next', 'cet-wp-theme-indigo' ),
					]
				);
				?>

			<?php else : ?>
				<?php get_template_part( 'template-parts/content', 'none' ); ?>
			<?php endif; ?>

		</div>
	</section>
</main>

<?php
get_footer();