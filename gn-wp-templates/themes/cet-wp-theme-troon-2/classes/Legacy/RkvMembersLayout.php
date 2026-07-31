<?php

namespace Cet\Theme\Troon2\Legacy;

/**
 * Legacy RKV/Members layout compatibility.
 *
 * Provides layout for pages where rkv/members is the first block.
 * In the old theme this was handled by Genesis hooks in lib/custom-layout.php.
 *
 * Delete this class and templates/_legacy/rkv-members/ once all 84 member-gated
 * pages have been rebuilt with the new sidebar pattern.
 */
class RkvMembersLayout {

	public function __construct() {
		$this->register_hooks();
	}

	private function register_hooks(): void {
		add_filter( 'body_class', [ $this, 'add_body_class' ] );
		add_filter( 'template_include', [ $this, 'swap_template' ] );
	}

	public function add_body_class( array $classes ): array {
		if ( $this->is_members_page() ) {
			$classes[] = 'first-block-rkv-members';
		}

		return $classes;
	}

	public function swap_template( string $template ): string {
		if ( ! $this->is_members_page() ) {
			return $template;
		}

		$members_template = get_template_directory() . '/templates/_legacy/rkv-members/page.php';

		return file_exists( $members_template ) ? $members_template : $template;
	}

	private function is_members_page(): bool {
		if ( ! is_singular() ) {
			return false;
		}

		$post = get_post();

		if ( ! $post || ! has_blocks( $post->post_content ) ) {
			return false;
		}

		$blocks = parse_blocks( $post->post_content );

		return ! empty( $blocks[0]['blockName'] ) && $blocks[0]['blockName'] === 'rkv/members';
	}
}