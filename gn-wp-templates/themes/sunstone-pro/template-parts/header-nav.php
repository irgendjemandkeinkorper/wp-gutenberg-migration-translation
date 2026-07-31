<?php 
/**
 * Outputs the header navigation
 * 
 * @package sunstone-pro
 */

require_once get_stylesheet_directory() . '/classes/WalkerNavMenu.php';

genesis_nav_menu(
    [
        'theme_location' => 'primary',
        'menu_class'     => 'menu genesis-nav-menu menu-primary navbar-nav',
        'walker'         => new \SunstonePro\Walker_Nav_Menu(),
    ]
);