<?php
/**
 * Outputs the app store links on every page.
 * 
 * @package sunstone-pro
 */

 // Get the theme mods for the app URLS
 $stores = [];

 $stores['google-play']  = get_theme_mod( 'sunstone_pro_play_store_url' );
 $stores['app-store']    = get_theme_mod( 'sunstone_pro_app_store_url' );

 if ( ! empty( $stores['google-play'] ) || ! empty( $stores['app-store'] ) ) {
	 $store_content  = "";

	 $store_content   .= '<h2 class="download widget-title">' . strtoupper( get_theme_mod( 'sunstone_pro_app_text', 'DOWNLOAD THE APP' ) )  . '</h2>';

	 if ( ! empty( $stores['google-play'] ) ) {
		 $store_content .= '<div>
			 <a class="app-store" href="' . esc_url( $stores['google-play'] ) . '" target="_blank" rel="noopener noreferrer">
				 <div class="badge">
					 <img src="' . get_stylesheet_directory_uri() . '/images/google-play-badge.png" alt="' . get_bloginfo( 'name' ) . ' app on the Google Play Store (Link opens in a new tab)"/>
				 </div>
			 </a>
		 </div>';
	 }

	 if ( ! empty( $stores['app-store'] ) ) {
		 $store_content .= '<div>
			 <a class="app-store" href="' . esc_url( $stores['app-store'] ) . '" target="_blank" rel="noopener noreferrer">
				 <div class="badge">
					 <img src="' . get_stylesheet_directory_uri() . '/images/app-store-badge.svg" alt="' . get_bloginfo( 'name' ) . ' app on the Apple App Store (Link opens in a new tab)"/>
				 </div>
			 </a>
		 </div>';
	 }

	 $store_icons_container = genesis_markup(
		 [
			 'open'          => '<div %s>',
			 'close'         => '</div>',
			 'context'       => 'apps',
			 'atts'          => [
				 'class'     => 'apps site-inner',
			 ],
			 'content'       => $store_content,
			 'echo'          => false
		 ]
	 );

	 genesis_markup(
		 [
			 'open'          => '<div %s>',
			 'close'         => '</div>',
			 'context'       => 'apps-icons',
			 'atts'          => [
				 'class'     => 'apps-icons',
			 ],
			 'content'       => $store_icons_container,
		 ]
	 );
 }