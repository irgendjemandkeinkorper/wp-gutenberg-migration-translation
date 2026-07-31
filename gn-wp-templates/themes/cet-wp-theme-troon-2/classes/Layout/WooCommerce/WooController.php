<?php

namespace Cet\Theme\Troon2\Layout\WooCommerce;

class WooController
{
    public function __construct()
    {
        if ( ! function_exists('is_woocommerce') || ! is_woocommerce() ) {
            return;
        }

        if ( is_shop() ) {
            // Remove breadcrumbs on Shop page. Hero section replaces them.
            remove_action( 'woocommerce_before_main_content', 'woocommerce_breadcrumb', 20 );
        }
    }
}