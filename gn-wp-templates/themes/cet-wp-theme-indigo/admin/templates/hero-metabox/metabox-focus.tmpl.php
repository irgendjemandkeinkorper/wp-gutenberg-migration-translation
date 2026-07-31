<?php
/**
 * @var string $focus
 */
?>

<h3><?php esc_html_e( 'Hero image focus', 'cet-wp-theme-indigo' ); ?></h3>
<p><?php esc_html_e( 'Vertical position of the featured image (0 = top, 100 = bottom).', 'cet-wp-theme-indigo' ); ?></p>

<div>
    <label for="hero_image_focus">
        <input
            type="range"
            id="hero_image_focus"
            name="hero_image_focus"
            min="0"
            max="100"
            step="1"
            value="<?php echo esc_attr( $focus ); ?>"
            oninput="document.getElementById('featured_image_focus_value').textContent = this.value"
        />
    </label>

    <span id="featured_image_focus_value">
				<?php echo esc_html( $focus ); ?>
			</span> %
</div>
