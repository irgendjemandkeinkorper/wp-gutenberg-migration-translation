<?php
/**
 * View: Default Template for Events
 *
 * Override this template in your own theme by creating a file at:
 * [your-theme]/tribe/events/v2/default-template.php
 *
 * See more documentation about our views templating system.
 *
 * @link http://evnt.is/1aiy
 *
 * @version 5.0.0
 */

use Tribe\Events\Views\V2\Template_Bootstrap;

get_header();

function printHeaderImage() {
    $appearance = genesis_get_config( 'appearance' );
    $getUpdatedImage = get_theme_mod( 'dogwood_default_header_image' );

    if ( !empty( $getUpdatedImage ) ) { 
        $getHeaderImage = wp_get_attachment_image_url( get_theme_mod( 'dogwood_default_header_image' ), 'full' );  
    } else {
        $getHeaderImage = $appearance['default-header-image']; 
    }

    return $getHeaderImage;
}

$headerImage = printHeaderImage();

?> 

<div class="entry-header-custom entry-header alignfull">
    <div class="site-inner text-center">
        <h1 class="entry-title woocommerce-products-header__title page-title"><?php echo _e( 'Upcoming Events', 'gn-dogwood' ) ?></h1>
    </div>
    <img alt="<?php echo _e( 'Image of golf ball on tee on grass.', 'gn-dogwood' ) ?>" src="<?php echo $headerImage; ?>" class="singular-image entry-image">
</div>

<?php

echo tribe( Template_Bootstrap::class )->get_view_html();

get_footer();
