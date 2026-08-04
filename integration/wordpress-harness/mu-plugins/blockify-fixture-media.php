<?php
/**
 * Permit the disposable harness importer to fetch its one Docker-local fixture.
 *
 * WordPress rejects private-network destinations in wp_safe_remote_get(). The
 * official importer correctly uses that safe client, so this narrowly scoped
 * MU plugin allows only the deterministic fixture URL used by known-media.
 */

add_filter(
	'http_request_host_is_external',
	static function ( $is_external, $host, $url ) {
		$fixture_url = 'http://wordpress/blockify-fixture.png';

		return 'wordpress' === $host && $fixture_url === $url ? true : $is_external;
	},
	10,
	3
);
