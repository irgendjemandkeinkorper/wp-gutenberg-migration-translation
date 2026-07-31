<?php
/**
 * @var string $hero_desc
 */
?>

<h3><?php esc_html_e( 'Hero description', 'cet-wp-theme-indigo' ); ?></h3>
<p><?php esc_html_e( 'Short text that appears under the page title in the hero area.', 'cet-wp-theme-indigo' ); ?></p>
<div>
            <textarea
                id="hero_description"
                name="hero_description"
                style="width:100%;"
                rows="3"
            ><?php echo esc_textarea( $hero_desc ); ?>
            </textarea>
</div>