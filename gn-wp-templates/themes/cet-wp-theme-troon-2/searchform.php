<?php
/**
 * Theme search form.
 *
 * @package cet-wp-theme-troon-2
 */

$search_id = wp_unique_id( 'search-form-' );
?>
<form role="search" method="get" class="cet-search-form" action="<?php echo esc_url( home_url( '/' ) ); ?>">
	<label class="cet-search-form__field" for="<?php echo esc_attr( $search_id ); ?>">
		<span class="screen-reader-text"><?php esc_html_e( 'Search for:', 'cet-wp-theme-troon-2' ); ?></span>
		<input
			type="search"
			id="<?php echo esc_attr( $search_id ); ?>"
			class="cet-search-form__input"
			placeholder="<?php echo esc_attr_x( 'Search the site', 'placeholder', 'cet-wp-theme-troon-2' ); ?>"
			value="<?php echo esc_attr( get_search_query() ); ?>"
			name="s"
		/>
	</label>
	<button type="submit" class="cet-search-form__submit cet-submit">
		<?php esc_html_e( 'Search', 'cet-wp-theme-troon-2' ); ?>
	</button>
</form>
