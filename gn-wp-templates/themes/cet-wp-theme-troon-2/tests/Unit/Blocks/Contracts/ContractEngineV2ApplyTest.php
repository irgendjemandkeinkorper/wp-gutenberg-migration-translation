<?php

declare(strict_types=1);

namespace Cet\Theme\Troon2\Tests\Unit\Blocks\Contracts;

use Cet\Theme\Troon2\Blocks\Contracts\ContractEngineV2;
use Cet\Theme\Troon2\Blocks\Contracts\Registry;
use Cet\Theme\Troon2\Tests\Unit\TestCase;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Tests for ContractEngineV2::apply()
 *
 * apply() is the render_block filter: it mutates rendered HTML by stamping
 * contract classes and data attributes onto the first tag.
 */
#[CoversClass( ContractEngineV2::class )]
class ContractEngineV2ApplyTest extends TestCase {

	private ContractEngineV2 $engine;

	protected function setUp(): void {
		parent::setUp();

		$registry = new Registry();
		$this->engine = new ContractEngineV2( $registry );
	}

	// -------------------------------------------------------------------------
	// No contract — passthrough
	// -------------------------------------------------------------------------

	public function testApplyWithNoContractReturnsUnchangedHtml(): void {
		$html   = '<div class="wp-block-columns">content</div>';
		$result = $this->engine->apply( $html, [ 'attrs' => [] ] );

		$this->assertSame( $html, $result );
	}

	public function testApplyWithEmptyHtmlReturnsEmptyString(): void {
		$this->assertSame( '', $this->engine->apply( '', [ 'attrs' => [] ] ) );
	}

	// -------------------------------------------------------------------------
	// Entity
	// -------------------------------------------------------------------------

	public function testApplyEntityStampsBaseAndTypeClasses(): void {
		$html   = '<div class="wp-block-columns is-style-text-only">content</div>';
		$result = $this->engine->apply( $html, [ 'attrs' => [ 'cetBlockContractV2' => [
			'role'       => 'entity',
			'type'       => 'text-only',
			'base_class' => 'cet-entity',
			'type_class' => 'cet-entity-text-only',
		] ] ] );

		$classes = $this->getClasses( $result );
		$this->assertContains( 'cet-entity',          $classes );
		$this->assertContains( 'cet-entity-text-only', $classes );
		$this->assertSame( 'entity',    $this->getAttribute( $result, 'data-cet-role' ) );
		$this->assertSame( 'text-only', $this->getAttribute( $result, 'data-cet-entity' ) );
	}

	public function testApplyEntityWithContainerStampsModifierClasses(): void {
		$html   = '<div class="wp-block-columns">content</div>';
		$result = $this->engine->apply( $html, [ 'attrs' => [ 'cetBlockContractV2' => [
			'role'            => 'entity',
			'type'            => 'text-only',
			'base_class'      => 'cet-entity',
			'type_class'      => 'cet-entity-text-only',
			'container'       => 'full-bleed',
			'spacing'         => 'none',
			'modifier_prefix' => '-has-',
		] ] ] );

		$classes = $this->getClasses( $result );
		$this->assertContains( '-has-full-bleed',           $classes );
		$this->assertContains( '-has-section-spacing-none', $classes );
		$this->assertSame( 'full-bleed', $this->getAttribute( $result, 'data-cet-container' ) );
		$this->assertSame( 'none',       $this->getAttribute( $result, 'data-cet-spacing' ) );
	}

	public function testApplyEntityWithoutContainerDoesNotStampModifierClasses(): void {
		$html   = '<div class="wp-block-columns">content</div>';
		$result = $this->engine->apply( $html, [ 'attrs' => [ 'cetBlockContractV2' => [
			'role'       => 'entity',
			'type'       => 'text-only',
			'base_class' => 'cet-entity',
			'type_class' => 'cet-entity-text-only',
			// No 'container' key — nested entity inside a host.
		] ] ] );

		$classes = $this->getClasses( $result );
		$this->assertNotContains( '-has-full-bleed',           $classes );
		$this->assertNotContains( '-has-section-spacing-none', $classes );
		$this->assertNull( $this->getAttribute( $result, 'data-cet-container' ) );
	}

	// -------------------------------------------------------------------------
	// Part
	// -------------------------------------------------------------------------

	public function testApplyPartStampsPartClasses(): void {
		$html   = '<h2 class="wp-block-heading">Title</h2>';
		$result = $this->engine->apply( $html, [ 'attrs' => [ 'cetBlockContractV2' => [
			'role'       => 'part',
			'type'       => 'heading',
			'base_class' => 'cet-part',
			'type_class' => 'cet-part-heading',
		] ] ] );

		$classes = $this->getClasses( $result );
		$this->assertContains( 'cet-part',         $classes );
		$this->assertContains( 'cet-part-heading',  $classes );
		$this->assertSame( 'part',    $this->getAttribute( $result, 'data-cet-role' ) );
		$this->assertSame( 'heading', $this->getAttribute( $result, 'data-cet-part' ) );
	}

	// -------------------------------------------------------------------------
	// Wrapper
	// -------------------------------------------------------------------------

	public function testApplyWrapperStampsWrapClass(): void {
		$html   = '<div class="wp-block-column">content</div>';
		$result = $this->engine->apply( $html, [ 'attrs' => [ 'cetBlockContractV2' => [
			'role'       => 'wrapper',
			'base_class' => 'cet-wrap',
		] ] ] );

		$classes = $this->getClasses( $result );
		$this->assertContains( 'cet-wrap', $classes );
		$this->assertSame( 'wrapper', $this->getAttribute( $result, 'data-cet-role' ) );
	}

	// -------------------------------------------------------------------------
	// Entity host — no WP alignment (default full-bleed)
	// -------------------------------------------------------------------------

	public function testApplyEntityHostNoAlignmentAddsContainerAndSpacingModifiers(): void {
		$html   = '<div class="wp-block-cover">content</div>';
		$result = $this->engine->apply( $html, [ 'attrs' => [
			'cetV2EntityHost' => [ 'container' => 'full-bleed', 'spacing' => 'none' ],
		] ] );

		$classes = $this->getClasses( $result );
		$this->assertContains( 'cet-entity-host',           $classes );
		$this->assertContains( '-has-full-bleed',           $classes );
		$this->assertContains( '-has-section-spacing-none', $classes );
		$this->assertSame( 'host', $this->getAttribute( $result, 'data-cet-role' ) );
	}

	public function testApplyEntityHostContainerModifierMatchesEntityDefinition(): void {
		$html   = '<section class="wp-block-group">content</section>';
		$result = $this->engine->apply( $html, [ 'attrs' => [
			'cetV2EntityHost' => [ 'container' => 'container', 'spacing' => 'md' ],
		] ] );

		$classes = $this->getClasses( $result );
		$this->assertContains( '-has-container',          $classes );
		$this->assertContains( '-has-section-spacing-md', $classes );
		$this->assertNotContains( '-has-full-bleed',      $classes );
	}

	// -------------------------------------------------------------------------
	// Entity host — WP alignment present (follow WP, no container modifier)
	// -------------------------------------------------------------------------

	#[DataProvider( 'alignmentProvider' )]
	public function testApplyEntityHostWithAlignmentSkipsContainerModifier( string $align ): void {
		$html   = '<div class="wp-block-cover alignfull">content</div>';
		$result = $this->engine->apply( $html, [ 'attrs' => [
			'cetV2EntityHost' => [ 'container' => 'full-bleed', 'spacing' => 'none' ],
			'align'           => $align,
		] ] );

		$classes = $this->getClasses( $result );
		$this->assertContains( 'cet-entity-host', $classes );
		$this->assertNotContains( '-has-full-bleed',           $classes );
		$this->assertNotContains( '-has-section-spacing-none', $classes );
	}

	/** @return array<string, array{string}> */
	public static function alignmentProvider(): array {
		return [
			'alignfull'   => [ 'full' ],
			'alignwide'   => [ 'wide' ],
			'aligncenter' => [ 'center' ],
			'alignleft'   => [ 'left' ],
			'alignright'  => [ 'right' ],
		];
	}

	// -------------------------------------------------------------------------
	// Entity host — legacy boolean flag (backward compat with old cetV2EntityHost=true)
	// -------------------------------------------------------------------------

	public function testApplyEntityHostLegacyBooleanFlagStampsClassWithoutModifiers(): void {
		$html   = '<div class="wp-block-cover">content</div>';
		$result = $this->engine->apply( $html, [ 'attrs' => [
			'cetV2EntityHost' => true, // legacy: no container/spacing data
		] ] );

		$classes = $this->getClasses( $result );
		$this->assertContains( 'cet-entity-host', $classes );
		// No container modifier — entityData is empty for legacy flag.
		$this->assertNotContains( '-has-full-bleed', $classes );
	}

	// -------------------------------------------------------------------------
	// Sub-elements
	// -------------------------------------------------------------------------

	public function testApplyEntitySubElementDirectClassIsStampedOnMatchingNode(): void {
		$html   = '<div class="wp-block-cover"><span class="wp-block-cover__background"></span></div>';
		$result = $this->engine->apply( $html, [ 'attrs' => [ 'cetBlockContractV2' => [
			'role'         => 'entity',
			'type'         => 'cover',
			'base_class'   => 'cet-entity',
			'type_class'   => 'cet-entity-cover',
			'sub_elements' => [ 'wp-block-cover__background' => 'cet-block-background' ],
		] ] ] );

		$this->assertStringContainsString( 'cet-block-background', $result );
	}

	public function testApplyEntitySubElementPartTypeStampsPartClasses(): void {
		$html   = '<div class="wp-block-cover"><div class="wp-block-cover__inner-container"></div></div>';
		$result = $this->engine->apply( $html, [ 'attrs' => [ 'cetBlockContractV2' => [
			'role'         => 'entity',
			'type'         => 'cover',
			'base_class'   => 'cet-entity',
			'type_class'   => 'cet-entity-cover',
			'sub_elements' => [ 'wp-block-cover__inner-container' => 'inner-container' ],
		] ] ] );

		$this->assertStringContainsString( 'cet-part', $result );
		$this->assertStringContainsString( 'cet-part-inner-container', $result );
		$this->assertStringContainsString( 'data-cet-part="inner-container"', $result );
	}

	public function testApplyEntitySubElementOnlyMatchesInnerNode(): void {
		// Root tag has wp-block-cover only — inner span has wp-block-cover__background.
		$html   = '<div class="wp-block-cover"><span class="wp-block-cover__background"></span></div>';
		$result = $this->engine->apply( $html, [ 'attrs' => [ 'cetBlockContractV2' => [
			'role'         => 'entity',
			'type'         => 'cover',
			'base_class'   => 'cet-entity',
			'type_class'   => 'cet-entity-cover',
			'sub_elements' => [ 'wp-block-cover__background' => 'cet-block-background' ],
		] ] ] );

		// Root tag gets entity classes.
		$this->assertStringContainsString( 'cet-entity-cover', $result );
		// Sub-element class appears exactly once (on the inner span only).
		$this->assertSame( 1, substr_count( $result, 'cet-block-background' ) );
	}

	public function testApplyEntityWithNoSubElementsLeavesInnerHtmlUnchanged(): void {
		$html   = '<div class="wp-block-cover"><span class="wp-block-cover__background"></span></div>';
		$result = $this->engine->apply( $html, [ 'attrs' => [ 'cetBlockContractV2' => [
			'role'       => 'entity',
			'type'       => 'cover',
			'base_class' => 'cet-entity',
			'type_class' => 'cet-entity-cover',
		] ] ] );

		$this->assertStringNotContainsString( 'cet-block-background', $result );
	}

	public function testApplyEntitySubElementMultipleMappingsAreAllApplied(): void {
		$html   = '<div class="wp-block-cover">'
			. '<span class="wp-block-cover__background"></span>'
			. '<div class="wp-block-cover__inner-container"></div>'
			. '</div>';
		$result = $this->engine->apply( $html, [ 'attrs' => [ 'cetBlockContractV2' => [
			'role'         => 'entity',
			'type'         => 'cover',
			'base_class'   => 'cet-entity',
			'type_class'   => 'cet-entity-cover',
			'sub_elements' => [
				'wp-block-cover__background'      => 'cet-block-background',
				'wp-block-cover__inner-container' => 'cet-block-inner-container',
			],
		] ] ] );

		$this->assertStringContainsString( 'cet-block-background',      $result );
		$this->assertStringContainsString( 'cet-block-inner-container', $result );
	}

	// -------------------------------------------------------------------------
	// Host + entity contract on same block (host runs first)
	// -------------------------------------------------------------------------

	public function testApplyRunsHostStampBeforeEntityStamp(): void {
		$html   = '<div class="wp-block-cover">content</div>';
		$result = $this->engine->apply( $html, [ 'attrs' => [
			'cetV2EntityHost'  => [ 'container' => 'full-bleed', 'spacing' => 'none' ],
			'cetBlockContractV2' => [
				'role'       => 'entity',
				'type'       => 'cover',
				'base_class' => 'cet-entity',
				'type_class' => 'cet-entity-cover',
			],
		] ] );

		$classes = $this->getClasses( $result );
		$this->assertContains( 'cet-entity-host', $classes );
		$this->assertContains( 'cet-entity',      $classes );
		$this->assertContains( 'cet-entity-cover', $classes );
	}
}
