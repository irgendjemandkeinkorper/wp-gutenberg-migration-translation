<?php
/**
 * Diamond.
 *
 * This file adds the required helper functions used in the Diamond Theme.
 *
 * @package Diamond
 * @author  GolfNow
 * @license GPL-2.0-or-later
 * @link    https://business.golfnow.com/Website-Theme-Library/
 */

/**
 * Calculates if white or gray would contrast more with the provided color.
 *
 * @since 1.0.0
 *
 * @param string $color A color in hex format.
 * @return string The hex code for the most contrasting color: almost-black or white.
 * @link https://github.com/gdkraus/wcag2-color-contrast
 */

// calculates the luminosity of an given RGB color
// the color code must be in the format of RRGGBB
// the luminosity equations are from the WCAG 2 requirements
// http://www.w3.org/TR/WCAG20/#relativeluminancedef

function calculate_luminosity( $color ) {

    $hexcolor = str_replace( '#', '', $color );
    
    $r = hexdec( substr( $hexcolor, 0, 2 ) ) / 255; // red value
    $g = hexdec( substr( $hexcolor, 2, 2 ) ) / 255; // green value
    $b = hexdec( substr( $hexcolor, 4, 2 ) ) / 255; // blue value
    if ( $r <= 0.03928 ) {
        $r = $r / 12.92;
    } else {
        $r = pow( ( ( $r + 0.055 ) / 1.055 ), 2.4 );
    }

    if ( $g <= 0.03928 ) {
        $g = $g / 12.92;
    } else {
        $g = pow( ( ( $g + 0.055 ) / 1.055 ), 2.4 );
    }

    if ( $b <= 0.03928 ) {
        $b = $b / 12.92;
    } else {
        $b = pow( ( ( $b + 0.055 ) / 1.055 ), 2.4 );
    }

    $luminosity = 0.2126 * $r + 0.7152 * $g + 0.0722 * $b;
    return $luminosity;
}

// calculates the luminosity ratio of two colors
// the luminosity ratio equations are from the WCAG 2 requirements
// http://www.w3.org/TR/WCAG20/#contrast-ratiodef

function calculate_luminosity_ratio($color1, $color2) {
    $l1 = calculate_luminosity($color1);
    $l2 = calculate_luminosity($color2);

    if ($l1 > $l2) {
        $ratio = (($l1 + 0.05) / ($l2 + 0.05));
    } else {
        $ratio = (($l2 + 0.05) / ($l1 + 0.05));
    }
    return $ratio;
}

// returns an array with the results of the color contrast analysis
// it returns akey for each level (AA and AAA, both for normal and large or bold text)
// it also returns the calculated contrast ratio
// the ratio levels are from the WCAG 2 requirements
// http://www.w3.org/TR/WCAG20/#visual-audio-contrast (1.4.3)
// http://www.w3.org/TR/WCAG20/#larger-scaledef

function evaluate_color_contrast($color1, $color2) {
    $ratio = calculate_luminosity_ratio( $color1, $color2 );

    $colorEvaluation["levelAANormal"] = ($ratio >= 4.5 ? 'pass' : 'fail');
    $colorEvaluation["levelAALarge"] = ($ratio >= 3 ? 'pass' : 'fail');
    $colorEvaluation["levelAAMediumBold"] = ($ratio >= 3 ? 'pass' : 'fail');
    $colorEvaluation["levelAAANormal"] = ($ratio >= 7 ? 'pass' : 'fail');
    $colorEvaluation["levelAAALarge"] = ($ratio >= 4.5 ? 'pass' : 'fail');
    $colorEvaluation["levelAAAMediumBold"] = ($ratio >= 4.5 ? 'pass' : 'fail');
    $colorEvaluation["ratio"] = $ratio;

    return $colorEvaluation;
}

// Then we use this function to run the checks 
// so I don't have to alter any of the original code from github
function diamond_color_contrast( $color ) {
	$dark_contrast = evaluate_color_contrast( $color, "#111111" );
	$light_contrast = evaluate_color_contrast( $color, "#ffffff" );

	return ( $dark_contrast['ratio'] > $light_contrast['ratio'] ) ? '#111111' : '#ffffff';
}


/**
 * Generates a lighter or darker color from a starting color.
 * Used to generate complementary hover tints from user-chosen colors.
 *
 * @since 1.0.0
 *
 * @param string $color A color in hex format.
 * @param int    $percent The amount to reduce or increase shade by.
 * @return string Hex code for the adjusted color shade.
 */
function diamond_color_shade( $color, $percent ) {

    $color = str_replace( "#", "", $color );

    $RGB = str_split( $color, 2 );
    $red = hexdec( $RGB[0] );
    $green = hexdec( $RGB[1] );
    $blue = hexdec( $RGB[2] );

	$red   *= ( 100 + $percent ) / 100;
	$green *= ( 100 + $percent ) / 100;
	$blue  *= ( 100 + $percent ) / 100;

	return sprintf(
        "#%02x%02x%02x", 
        min( 255, max( 0, round( $red ) ) ), 
        min( 255, max( 0, round( $green ) ) ), 
        min( 255, max( 0, round( $blue ) ) )
    );
}

/**
 * Generates a lighter or darker color from a starting color.
 * Used to generate complementary hover tints from user-chosen colors.
 *
 * @since 1.0.0
 *
 * @param string  $color A color in hex format.
 * @param float   $transparency 0 to 1 float value for transparency level
 * @return string RGB or RGBA code for the adjusted color shade.
 */
function diamond_color_rgb( $color, $transparency = 1 ) {

    $color = str_replace( "#", "", $color );

    $RGB = str_split( $color, 2 );
    $red = hexdec( $RGB[0] );
    $green = hexdec( $RGB[1] );
    $blue = hexdec( $RGB[2] );

    $format = "rgb(%s, %s, %s)";

    if ( $transparency > 0 && $transparency < 1 ) {
        $format = "rgba(%s, %s, %s, %s)";
    }

	return sprintf(
        $format, 
        $red, 
        $green, 
        $blue,
        $transparency
    );
}

/**
 * Used to return the gradient CSS between two colors
 *
 * @since 1.0.0
 *
 * @param string $first_color A color in hex format.
 * @param string $second_color Another color in hex format.
 * @param int    $angle the Angle that the gradient should be facing between 0 and 360
 * @return string linear gradient between the two colors.
 */

function diamond_color_gradient( $first_color, $second_color, $angle = 135 ) {
    return "linear-gradient(" . $angle . "deg, " . $first_color . " 0%, " . $second_color . " 100%);";
}


 // Most of this function was copied from various stack overflows
function diamond_video_is_video( $post_content ) {
    global $shortcode_tags;
    global $wp_embed; // Using wp_embed to cache videos

    // Make a copy of global shortcode tags - we'll temporarily overwrite it.
    $theme_shortcode_tags = $shortcode_tags;

    $shortcode_tags = array(
        'video' => $theme_shortcode_tags['video'],
        'embed' => $theme_shortcode_tags['embed']
    );
    
    // Get the absurd shortcode regexp.
    $video_regex = '#' . get_shortcode_regex() . '#i';

    // Restore global shortcode tags.
    $shortcode_tags = $theme_shortcode_tags;
    
    // I had to adjust these two patterns so that they would only capture the link
    // Before they were capturing the entire line because the pattern was to broad
    // So the first pattern will capture upto and not including the first quote
    // The second pattern will capture upto and including the mp4 extension
    // At the moment I don't expect self hosting to include other file formats for video embeds
    // But that may change.
    // To add another file format, just copy the last line and change the extension
    $pattern_array = array(
        '#https://youtu\.be/.*?(?=")#i',
        '#https://(www\.)?youtube\.com/playlist.*?(?=")#i',
        '#https://(www\.)?youtube\.com/watch.*?(?=")#i',
        '#http://(www\.)?youtube\.com/watch.*?(?=")#i',
        '#https://(www\.)?youtube\.com/embed/.*?(?=")#i',
        '#http://(www\.)?youtube\.com/embed/.*?(?=")#i',
        '#http://(www\.)?youtube\.com/playlist.*?(?=")#i',
        '#http://youtu\.be/.*?(?=")#i',
        '#https?://wordpress.tv/.*?(?=")#i',
        '#https?://(.+\.)?vimeo\.com/.*?(?=")#i',
        '#https?://.+\.mp4#i',
        $video_regex
    );

    // Get the patterns from the embed object.
    if ( ! function_exists( '_wp_oembed_get_object' ) ) {
        include ABSPATH . WPINC . '/class-oembed.php';
    }

    $oembed = _wp_oembed_get_object();
    $pattern_array = array_merge( $pattern_array, array_keys( $oembed->providers ) );

    // Merge all the patterns together so that we only get what we need.
    $pattern = '#(' . array_reduce( $pattern_array, function ( $carry, $item ) {
        if ( strpos( $item, '#' ) === 0 ) {
            // Assuming '#...#i' regexps.
            $item = substr( $item, 1, -2 );
        } else {
            // Assuming glob patterns.
            $item = str_replace( '*', '(.+)', $item );
        }
        return $carry ? $carry . ')|('  . $item : $item;
    } ) . ')#is';
    
    // We separate the lines into an array and run it through a loop
    $lines = explode( "\n", $post_content );
    foreach ( $lines as $line ) {
        $line = trim( $line );

        // Then we search each line for a link or shortcode, and if we find one
        // We return the shortcode or embed details back to the call function.
        preg_match( $pattern, $line, $matches );

        // We need to check the array for empty strings to determine if there are false matches.
        $matches = array_filter( $matches, 'strlen' );
        
        if ( ! empty ( $matches ) ) {
            if ( strpos( $matches[0], '[' ) === 0 ) {
                $ret = do_shortcode( $matches[0] );
            } else {
                $ret = $wp_embed->shortcode( array(), $matches[0] );

                // wp_embed->shortcode() is pretty great at intelligently returning the best service
                // Sometimes that's a shortcode, and if it is, we should store that to this array.
                if ( strpos( $ret, '[' ) === 0 ) {
                    $ret = do_shortcode( $ret );
                }
            };

            return $ret;
        }
    }

    return false;

    // return get_media_embedded_in_content( $post_content );
}