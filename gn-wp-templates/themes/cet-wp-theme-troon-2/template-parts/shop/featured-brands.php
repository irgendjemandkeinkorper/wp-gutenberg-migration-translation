<?php
/**
 * Featured Brands — Product Brand logos carousel.
 *
 * Receives prepared brand data from WooData::getFeaturedBrands().
 * Renders brand logos in a horizontal scroll-snap carousel.
 *
 * @package cet-wp-theme-troon-2
 *
 * @var array $args {
 *     @type array[] $brands Array of brand data with 'term', 'thumbnail_url', 'link' keys.
 * }
 */

defined( 'ABSPATH' ) || exit;

$brands = $args['brands'] ?? [];

if ( empty( $brands ) ) {
	return;
}
?>
<section class="cet-wc-brands">
	<div class="cet-container cet-wc-container">
		<div class="cet-wc-section-header cet-wc-section-header--centered">
			<span class="cet-wc-caption"><?php esc_html_e( 'Top Picks', 'cet-wp-theme-troon-2' ); ?></span>
			<h2 class="cet-wc-heading"><?php esc_html_e( 'Featured Brands', 'cet-wp-theme-troon-2' ); ?></h2>
		</div>

		<div class="cet-wc-carousel cet-wc-carousel--brands">
			<?php foreach ( $brands as $brand_data ) : ?>
				<a href="<?php echo esc_url( $brand_data['link'] ); ?>" class="cet-wc-brand-tile">
					<img
						src="<?php echo esc_url( $brand_data['thumbnail_url'] ); ?>"
						alt="<?php echo esc_attr( $brand_data['term']->name ); ?>"
						class="cet-wc-brand-tile__logo"
						loading="lazy"
					/>
				</a>
			<?php endforeach; ?>
		</div>
	</div>
</section>
