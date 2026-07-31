<?php
/**
 * @var string $hero_title
 */
?>

<h3><?php esc_html_e( 'Hero title', 'cet-wp-theme-indigo' ); ?></h3>
<p><?php esc_html_e( 'If it is empty, a default value "Event Details" for events and nothing for products is shown.', 'cet-wp-theme-indigo' ); ?></p>
<input
    id="hero_title"
    name="hero_title"
    type="text"
    style="width:100%;"
    value="<?php echo esc_attr( $hero_title ); ?>"
>