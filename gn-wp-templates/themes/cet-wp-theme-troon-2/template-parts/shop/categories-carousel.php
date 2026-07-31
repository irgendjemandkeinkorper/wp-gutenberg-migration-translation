<?php
/**
 * Shop Everything — Product Categories carousel.
 *
 * Receives prepared category data from WooData::getShopCategories().
 * Renders categories in a scroll-snap carousel with thumbnail, overlay, and title.
 *
 * @package cet-wp-theme-troon-2
 *
 * @var array $args {
 *     @type \WP_Term[] $categories Product category terms.
 * }
 */

defined( 'ABSPATH' ) || exit;

$categories = $args['categories'] ?? [];

if ( empty( $categories ) ) {
	return;
}
?>
<section class="cet-wc-categories">
	<div class="cet-container cet-wc-container">
		<div class="cet-wc-section-header cet-wc-section-header--centered">
			<span class="cet-wc-caption"><?php esc_html_e( 'Shop Everything', 'cet-wp-theme-troon-2' ); ?></span>
			<h2 class="cet-wc-heading"><?php esc_html_e( 'Shop The Best in Golf', 'cet-wp-theme-troon-2' ); ?></h2>
		</div>

		<div class="cet-wc-carousel">
			<?php foreach ( $categories as $category ) : ?>
				<?php
				$thumbnail_id  = (int) get_term_meta( $category->term_id, 'thumbnail_id', true );
				$thumbnail_url = $thumbnail_id ? wp_get_attachment_image_url( $thumbnail_id, 'medium_large' ) : '';
				$category_link = get_term_link( $category );

				if ( is_wp_error( $category_link ) ) {
					continue;
				}
				?>
				<a href="<?php echo esc_url( $category_link ); ?>" class="cet-wc-category-tile">
					<?php if ( $thumbnail_url ) : ?>
						<img
							src="<?php echo esc_url( $thumbnail_url ); ?>"
							alt="<?php echo esc_attr( $category->name ); ?>"
							class="cet-wc-category-tile__image"
							loading="lazy"
						/>
					<?php endif; ?>
					<div class="cet-wc-category-tile__overlay"></div>
					<span class="cet-wc-category-tile__title"><?php echo esc_html( $category->name ); ?></span>
				</a>
			<?php endforeach; ?>
		</div>
	</div>
</section>
