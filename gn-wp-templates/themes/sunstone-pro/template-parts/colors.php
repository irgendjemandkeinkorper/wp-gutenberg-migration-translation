<?php 
/**
 * Outputs the brand color variables. 
 * 
 * @package sunstone-pro
 */

$appearance = genesis_get_config( 'appearance' );
?>
<style id="sunstone-theme-color-variables">
    :root {
    <?php foreach ( $appearance['brand-colors'] as $key => $value ) : ?>
        --wp--preset--color--<?php echo esc_attr( $key ); ?>: <?php echo esc_attr( $value ); ?>;
    <?php endforeach; ?>
    }
</style>
