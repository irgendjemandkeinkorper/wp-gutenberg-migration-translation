<?php

namespace Troon;

/**
 * Custom walker class due to the need to add aria labels to the dropdowns
 */
class Walker_Nav_Accordion extends \Walker_Nav_Menu {
 
    /**
     * Starts the list before the elements are added.
     *
     * Adds classes to the unordered list sub-menus.
     *
     * @param string $output Passed by reference. Used to append additional content.
     * @param int    $depth  Depth of menu item. Used for padding.
     * @param array  $args   An array of arguments. @see wp_nav_menu()
     */

     public function start_lvl( &$output, $depth = 0, $args = array() ) {
        if ( isset( $args->item_spacing ) && 'discard' === $args->item_spacing ) {
            $t = '';
            $n = '';
        } else {
            $t = "\t";
            $n = "\n";
        }

        $indent = str_repeat( $t, $depth );

        // Default dropdown classes to be used
        $classes = array(
            'sub-menu',
            'collapse',
            'list-unstyled',
        );

        // They don't provide the parent element here, so I have to match it from output
        preg_match_all( '/id="([^"]+)"/', $output, $find_id );
        $last_array             = count( $find_id ) - 1;
        $last_item              = count( $find_id[$last_array] ) - 1;
        $parent_id              = $find_id[$last_array][$last_item];
        $dropdown_accordion_id  = $args->menu_id ? $args->menu_id : 'menu-' . $args->menu->slug;
        
        if ( $depth ) {
            preg_match( '/Dropdown(\d+)/', $parent_id, $match_dropdown );
            $value = $match_dropdown[1] ?? '';

            $parent_ancestor_id = 0;
            foreach ( $find_id[$last_array] as $item_id ) {
                if ( strpos( $item_id, 'Dropdown' . $value ) !== false ) {
                    preg_match( '/Parent(\d+)/', $item_id, $match_parent );
                    $parent_ancestor_id = $match_parent[1] ?? 0;
                }
            }

            $dropdown_accordion_id = 'DropdownParent' . $parent_ancestor_id . 'MainMenuDropdown' . $value;
        }

        /**
         * Filters the CSS class(es) applied to a wp_nav_menu_objectsmenu list element.
         *
         * @since 4.8.0
         *
         * @param string[] $classes Array of the CSS classes that are applied to the menu `<ul>` element.
         * @param stdClass $args    An object of `wp_nav_menu()` arguments.
         * @param int      $depth   Depth of menu item. Used for padding.
         */
        $class_names        = implode( ' ', apply_filters( 'nav_menu_submenu_css_class', $classes, $args, $depth ) );
        $class_names        = $class_names ? ' class="' . esc_attr( $class_names ) . '"' : '';
        $aria_labelledby    = ' aria-labelledby="' . $parent_id . '"';
        $dropdown_id        = ' id="Dropdown' . $parent_id . '"';
        $dropdown_parent    = ' data-bs-parent="#' . $dropdown_accordion_id . '"';
     
        $output .= "{$n}{$indent}<ul{$dropdown_id}{$class_names}{$aria_labelledby}{$dropdown_parent}>{$n}";
    }

    /**
     * Starts the element output.
     *
     * @since 3.0.0
     * @since 4.4.0 The {@see 'nav_menu_item_args'} filter was added.
     * @since 5.9.0 Renamed `$item` to `$data_object` and `$id` to `$current_object_id`
     *              to match parent class for PHP 8 named parameter support.
     *
     * @see Walker::start_el()
     *
     * @param string   $output            Used to append additional content (passed by reference).
     * @param WP_Post  $data_object       Menu item data object.
     * @param int      $depth             Depth of menu item. Used for padding.
     * @param stdClass $args              An object of wp_nav_menu() arguments.
     * @param int      $current_object_id Optional. ID of the current menu item. Default 0.
     */
    public function start_el( &$output, $data_object, $depth = 0, $args = null, $current_object_id = 0 ) {
        // Restores the more descriptive, specific name for use within this method.
        $menu_item = $data_object;

        if ( isset( $args->item_spacing ) && 'discard' === $args->item_spacing ) {
            $t = '';
            $n = '';
        } else {
            $t = "\t";
            $n = "\n";
        }
        $indent = ( $depth ) ? str_repeat( $t, $depth ) : '';

        $classes   = empty( $menu_item->classes ) ? array() : (array) $menu_item->classes;
        $classes[] = 'menu-item-' . $menu_item->ID;

        if ( ! $menu_item->menu_item_parent ) {
            $classes[] = 'nav-item';
        }

        if ( in_array( "menu-item-has-children", $classes, true ) ) {
            if ( $menu_item->menu_item_parent ) {
                $classes[] = 'dropend';
            } else {
                $classes[] = 'dropdown';
            }
        }

        /**
         * Filters the arguments for a single nav menu item.
         *
         * @since 4.4.0
         *
         * @param stdClass $args      An object of wp_nav_menu() arguments.
         * @param WP_Post  $menu_item Menu item data object.
         * @param int      $depth     Depth of menu item. Used for padding.
         */
        $args = apply_filters( 'nav_menu_item_args', $args, $menu_item, $depth );

        /**
         * Filters the CSS classes applied to a menu item's list item element.
         *
         * @since 3.0.0
         * @since 4.1.0 The `$depth` parameter was added.
         *
         * @param string[] $classes   Array of the CSS classes that are applied to the menu item's `<li>` element.
         * @param WP_Post  $menu_item The current menu item object.
         * @param stdClass $args      An object of wp_nav_menu() arguments.
         * @param int      $depth     Depth of menu item. Used for padding.
         */
        $class_names = implode( ' ', apply_filters( 'nav_menu_css_class', array_filter( $classes ), $menu_item, $args, $depth ) );
        $class_names = $class_names ? ' class="' . esc_attr( $class_names ) . '"' : '';

        /**
         * Filters the ID attribute applied to a menu item's list item element.
         *
         * @since 3.0.1
         * @since 4.1.0 The `$depth` parameter was added.
         *
         * @param string   $menu_item_id The ID attribute applied to the menu item's `<li>` element.
         * @param WP_Post  $menu_item    The current menu item.
         * @param stdClass $args         An object of wp_nav_menu() arguments.
         * @param int      $depth        Depth of menu item. Used for padding.
         */
        $id = apply_filters( 'nav_menu_item_id', 'menu-item-' . $menu_item->ID, $menu_item, $args, $depth );
        $id = $id ? ' id="' . esc_attr( $id ) . '"' : '';

        $output .= $indent . '<li' . $id . $class_names . '>';

        $atts           = array();
        $atts['title']  = ! empty( $menu_item->attr_title ) ? $menu_item->attr_title : '';
        $atts['target'] = ! empty( $menu_item->target ) ? $menu_item->target : '';

        if ( '_blank' === $menu_item->target && empty( $menu_item->xfn ) ) {
            $atts['rel'] = 'noopener';
        } else {
            $atts['rel'] = $menu_item->xfn;
        }

        $atts['href']         = ! empty( $menu_item->url ) ? $menu_item->url : '';
        $atts['aria-current'] = $menu_item->current ? 'page' : '';

        /**
         * Filters the HTML attributes applied to a menu item's anchor element.
         *
         * @since 3.6.0
         * @since 4.1.0 The `$depth` parameter was added.
         *
         * @param array $atts {
         *     The HTML attributes applied to the menu item's `<a>` element, empty strings are ignored.
         *
         *     @type string $title        Title attribute.
         *     @type string $target       Target attribute.
         *     @type string $rel          The rel attribute.
         *     @type string $href         The href attribute.
         *     @type string $aria-current The aria-current attribute.
         * }
         * @param WP_Post  $menu_item The current menu item object.
         * @param stdClass $args      An object of wp_nav_menu() arguments.
         * @param int      $depth     Depth of menu item. Used for padding.
         */
        $atts = apply_filters( 'nav_menu_link_attributes', $atts, $menu_item, $args, $depth );

        $atts['class'] = explode( ' ', $atts['class'] );
        // Sometimes there's an empty item, so we need to get rid of that
        $atts['class'] = array_filter( $atts['class'], function($value) { return !is_null($value) && $value !== ''; });

        if ( $menu_item->menu_item_parent ) {
            $atts['class'][]  = 'dropdown-item';
        } else {
            $atts['class'][]  = 'nav-link';
        }

        if ( $menu_item->current || $menu_item->current_item_parent || $menu_item->current_item_ancestor ) {
            $atts['class'][] = 'active';
        }

        if ( in_array( 'menu-item-has-children', $menu_item->classes, true ) ) {
            $dropdown_id = 'DropdownParent' . $menu_item->menu_item_parent . str_replace( " ", "", $args->menu->name ) . 'Dropdown' . $menu_item->ID;

            $atts['class'][]            = 'accordion-button';
            $atts['class'][]            = 'accordion';
            $atts['class'][]            = 'collapsed';
            $atts['role']               = 'button';
            $atts['data-bs-toggle']     = 'collapse';
            $atts['data-bs-target']     = '#' . $dropdown_id;
            $atts['aria-controls']      = $dropdown_id;
            $atts['aria-expanded']      = 'false';
            $atts['id']                 = 'Parent' . $menu_item->menu_item_parent . str_replace( " ", "", $args->menu->name ) . 'Dropdown' . $menu_item->ID;

            unset( $atts['href'] );
        }

        $atts['class'] = implode( ' ', $atts['class'] );

        $attributes = '';
        foreach ( $atts as $attr => $value ) {
            if ( is_scalar( $value ) && '' !== $value && false !== $value ) {
                $value       = ( 'href' === $attr ) ? esc_url( $value ) : esc_attr( $value );
                $attributes .= ' ' . $attr . '="' . $value . '"';
            }
        }

        /** This filter is documented in wp-includes/post-template.php */
        $title = apply_filters( 'the_title', $menu_item->title, $menu_item->ID );

        /**
         * Filters a menu item's title.
         *
         * @since 4.4.0
         *
         * @param string   $title     The menu item's title.
         * @param WP_Post  $menu_item The current menu item object.
         * @param stdClass $args      An object of wp_nav_menu() arguments.
         * @param int      $depth     Depth of menu item. Used for padding.
         */
        $title = apply_filters( 'nav_menu_item_title', $title, $menu_item, $args, $depth );

        $item_output  = $args->before;
        $item_output .= in_array( 'menu-item-has-children', $menu_item->classes, true ) ? '<button' . $attributes . '>' : '<a' . $attributes . '>';
        $item_output .= $args->link_before . $title . $args->link_after;
        $item_output .= in_array( 'menu-item-has-children', $menu_item->classes, true ) ? '</button>' : '</a>';
        $item_output .= $args->after;

        /**
         * Filters a menu item's starting output.
         *
         * The menu item's starting output only includes `$args->before`, the opening `<a>`,
         * the menu item's title, the closing `</a>`, and `$args->after`. Currently, there is
         * no filter for modifying the opening and closing `<li>` for a menu item.
         *
         * @since 3.0.0
         *
         * @param string   $item_output The menu item's starting HTML output.
         * @param WP_Post  $menu_item   Menu item data object.
         * @param int      $depth       Depth of menu item. Used for padding.
         * @param stdClass $args        An object of wp_nav_menu() arguments.
         */
        $output .= apply_filters( 'walker_nav_menu_start_el', $item_output, $menu_item, $depth, $args );
    }
}