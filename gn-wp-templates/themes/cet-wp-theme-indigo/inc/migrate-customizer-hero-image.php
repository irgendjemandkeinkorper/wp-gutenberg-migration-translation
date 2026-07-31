<?php
if ( ! function_exists( 'cet_indigo_migrate_hero_image_to_header_image' ) ) :

	function cet_indigo_migrate_hero_image_to_header_image(): void {

		if ( get_option( 'cet_indigo_hero_migrated' ) === '1' ) {
			return;
		}

		$hero_id = (int) get_theme_mod( 'hero_image', 0 );

		// Nothing to migrate.
		if ( $hero_id === 0 ) {
			update_option( 'cet_indigo_hero_migrated', '1' );
			return;
		}

		$header          = (string) get_theme_mod( 'header_image', '' );
		$header_is_empty = ( $header === '' || $header === 'remove-header' );

		if ( $header_is_empty ) {

			$url = wp_get_attachment_url( $hero_id );

			if ( $url ) {

				if ( $header === 'remove-header' ) {
					set_theme_mod( 'header_image', '' );
				}

				set_theme_mod( 'header_image', esc_url_raw( $url ) );

				// Help Customizer show selected image.
				$meta = wp_get_attachment_metadata( $hero_id );

				$data = array(
					'attachment_id' => $hero_id,
					'url'           => esc_url_raw( $url ),
				);

				if ( is_array( $meta ) ) {
					if ( ! empty( $meta['width'] ) ) {
						$data['width'] = (int) $meta['width'];
					}

					if ( ! empty( $meta['height'] ) ) {
						$data['height'] = (int) $meta['height'];
					}
				}

				$thumb = wp_get_attachment_image_url( $hero_id, 'thumbnail' );
				if ( $thumb ) {
					$data['thumbnail_url'] = esc_url_raw( $thumb );
				}

				set_theme_mod( 'header_image_data', $data );
			}
		}

		// Always remove old hero_image.
		remove_theme_mod( 'hero_image' );

		update_option( 'cet_indigo_hero_migrated', '1' );
	}

endif;

add_action( 'init', 'cet_indigo_migrate_hero_image_to_header_image', 20 );