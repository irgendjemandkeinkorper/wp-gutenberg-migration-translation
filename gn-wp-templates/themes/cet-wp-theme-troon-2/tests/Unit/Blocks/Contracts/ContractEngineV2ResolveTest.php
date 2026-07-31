<?php

declare(strict_types=1);

namespace Cet\Theme\Troon2\Tests\Unit\Blocks\Contracts;

use Cet\Theme\Troon2\Blocks\Contracts\ContractEngineV2;
use Cet\Theme\Troon2\Blocks\Contracts\Registry;
use Cet\Theme\Troon2\Tests\Unit\TestCase;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Tests for ContractEngineV2::resolve()
 *
 * resolve() is the render_block_data filter: it reads $parsed_block + $parent_block
 * and writes 'cetBlockContractV2' into attrs (and 'cetV2EntityHost' onto the parent).
 * All tests call it directly — no WP hook infrastructure needed.
 */
#[CoversClass( ContractEngineV2::class )]
class ContractEngineV2ResolveTest extends TestCase {

	private Registry $registry;
	private ContractEngineV2 $engine;

	protected function setUp(): void {
		parent::setUp();

		$this->registry = new Registry();
		$this->registry->entity( 'text-only', [ 'block' => 'core/columns',  'style' => 'text-only', 'container' => 'full-bleed', 'spacing' => 'none' ] );
		$this->registry->entity( 'faq',       [ 'block' => 'core/columns',  'style' => 'faq',       'container' => 'full-bleed', 'spacing' => 'none' ] );
		$this->registry->entity( 'cover',     [ 'block' => 'core/cover',                            'container' => 'full-bleed', 'spacing' => 'lg'   ] );
		$this->registry->part( 'heading', [ 'block' => 'core/heading' ] );
		$this->registry->part( 'body',    [ 'block' => 'core/paragraph' ] );
		$this->registry->wrapper( 'core/column' );

		$this->engine = new ContractEngineV2( $this->registry );
	}

	// -------------------------------------------------------------------------
	// Unknown / unregistered blocks
	// -------------------------------------------------------------------------

	public function testUnregisteredBlockPassesThroughUnchanged(): void {
		$block  = [ 'blockName' => 'core/group', 'attrs' => [] ];
		$result = $this->engine->resolve( $block, $block, null );

		$this->assertArrayNotHasKey( 'cetBlockContractV2', $result['attrs'] );
	}

	public function testBlockWithNoNamePassesThroughUnchanged(): void {
		$block  = [ 'blockName' => '', 'attrs' => [] ];
		$result = $this->engine->resolve( $block, $block, null );

		$this->assertArrayNotHasKey( 'cetBlockContractV2', $result['attrs'] );
	}

	// -------------------------------------------------------------------------
	// Root-level entities (no parent)
	// -------------------------------------------------------------------------

	public function testRootEntityGetsContainerAndSpacingModifiers(): void {
		$block  = [ 'blockName' => 'core/columns', 'attrs' => [ 'className' => 'is-style-text-only' ] ];
		$result = $this->engine->resolve( $block, $block, null );

		$contract = $result['attrs']['cetBlockContractV2'];
		$this->assertSame( 'entity',     $contract['role'] );
		$this->assertSame( 'text-only',  $contract['type'] );
		$this->assertSame( 'cet-entity', $contract['base_class'] );
		$this->assertSame( 'cet-entity-text-only', $contract['type_class'] );
		$this->assertSame( 'full-bleed', $contract['container'] );
		$this->assertSame( 'none',       $contract['spacing'] );
		$this->assertSame( '-has-',      $contract['modifier_prefix'] );
	}

	public function testRootStylelessEntityGetsModifiers(): void {
		$block  = [ 'blockName' => 'core/cover', 'attrs' => [] ];
		$result = $this->engine->resolve( $block, $block, null );

		$contract = $result['attrs']['cetBlockContractV2'];
		$this->assertSame( 'entity',     $contract['role'] );
		$this->assertSame( 'cover',      $contract['type'] );
		$this->assertSame( 'full-bleed', $contract['container'] );
		$this->assertSame( 'lg',         $contract['spacing'] );
	}

	// -------------------------------------------------------------------------
	// Root-level entities with WP alignment
	// -------------------------------------------------------------------------

	#[DataProvider( 'wpAlignmentProvider' )]
	public function testRootEntityWithWpAlignmentSkipsContainerModifiers( string $align ): void {
		$block  = [ 'blockName' => 'core/columns', 'attrs' => [ 'className' => 'is-style-text-only', 'align' => $align ] ];
		$result = $this->engine->resolve( $block, $block, null );

		$contract = $result['attrs']['cetBlockContractV2'];
		$this->assertSame( 'entity', $contract['role'] );
		// WP alignment present — container modifiers must be absent.
		$this->assertArrayNotHasKey( 'container',       $contract );
		$this->assertArrayNotHasKey( 'spacing',         $contract );
		$this->assertArrayNotHasKey( 'modifier_prefix', $contract );
	}

	/** @return array<string, array{string}> */
	public static function wpAlignmentProvider(): array {
		return [
			'full'   => [ 'full' ],
			'wide'   => [ 'wide' ],
			'center' => [ 'center' ],
			'left'   => [ 'left' ],
			'right'  => [ 'right' ],
		];
	}

	public function testRootEntityWithEmptyAlignStillGetsContainerModifiers(): void {
		$block  = [ 'blockName' => 'core/columns', 'attrs' => [ 'className' => 'is-style-text-only', 'align' => '' ] ];
		$result = $this->engine->resolve( $block, $block, null );

		$contract = $result['attrs']['cetBlockContractV2'];
		$this->assertArrayHasKey( 'container', $contract );
		$this->assertArrayHasKey( 'spacing',   $contract );
	}

	// -------------------------------------------------------------------------
	// Nested entity in a non-v2 parent (host scenario)
	// -------------------------------------------------------------------------

	public function testNestedEntityInNonV2ParentMovesModifiersToHost(): void {
		$block  = [ 'blockName' => 'core/columns', 'attrs' => [ 'className' => 'is-style-text-only' ] ];
		$parent = new \WP_Block( [ 'blockName' => 'core/cover', 'attrs' => [] ] );

		$result = $this->engine->resolve( $block, $block, $parent );

		$contract = $result['attrs']['cetBlockContractV2'];

		// Entity gets no layout modifiers — host owns them.
		$this->assertSame( 'entity', $contract['role'] );
		$this->assertArrayNotHasKey( 'container',       $contract );
		$this->assertArrayNotHasKey( 'spacing',         $contract );
		$this->assertArrayNotHasKey( 'modifier_prefix', $contract );

		// Parent is flagged as host with the entity's container/spacing.
		$hostData = $parent->parsed_block['attrs']['cetV2EntityHost'];
		$this->assertIsArray( $hostData );
		$this->assertSame( 'full-bleed', $hostData['container'] );
		$this->assertSame( 'none',       $hostData['spacing'] );
	}

	public function testNestedEntityInNonV2ParentStillGetsEntityClasses(): void {
		$block  = [ 'blockName' => 'core/columns', 'attrs' => [ 'className' => 'is-style-faq' ] ];
		$parent = new \WP_Block( [ 'blockName' => 'core/group', 'attrs' => [] ] );

		$result = $this->engine->resolve( $block, $block, $parent );

		$contract = $result['attrs']['cetBlockContractV2'];
		$this->assertSame( 'cet-entity',     $contract['base_class'] );
		$this->assertSame( 'cet-entity-faq', $contract['type_class'] );
	}

	// -------------------------------------------------------------------------
	// Nested entity inside any v2-contracted parent (entity, part, or wrapper)
	// -------------------------------------------------------------------------

	public function testNestedEntityInV2EntityParentGetsNoModifiersAndDoesNotFlagParent(): void {
		$block  = [ 'blockName' => 'core/columns', 'attrs' => [ 'className' => 'is-style-text-only' ] ];
		$parent = new \WP_Block( [
			'blockName' => 'core/columns',
			'attrs'     => [ 'cetBlockContractV2' => [ 'role' => 'entity' ] ],
		] );

		$result = $this->engine->resolve( $block, $block, $parent );

		$contract = $result['attrs']['cetBlockContractV2'];
		$this->assertSame( 'entity', $contract['role'] );
		$this->assertArrayNotHasKey( 'container', $contract );

		// Parent must NOT be overwritten with cetV2EntityHost.
		$this->assertArrayNotHasKey( 'cetV2EntityHost', $parent->parsed_block['attrs'] );
	}

	public function testNestedEntityInV2WrapperParentGetsNoModifiersAndDoesNotFlagParent(): void {
		// Real-world case: core/separator inside core/column (wrapper) inside big-cards.
		// The wrapper is already inside a v2 entity; separator must not push spacing to it.
		$block  = [ 'blockName' => 'core/columns', 'attrs' => [ 'className' => 'is-style-text-only' ] ];
		$parent = new \WP_Block( [
			'blockName' => 'core/column',
			'attrs'     => [ 'cetBlockContractV2' => [ 'role' => 'wrapper' ] ],
		] );

		$result = $this->engine->resolve( $block, $block, $parent );

		$contract = $result['attrs']['cetBlockContractV2'];
		$this->assertSame( 'entity', $contract['role'] );
		$this->assertArrayNotHasKey( 'container', $contract );
		$this->assertArrayNotHasKey( 'spacing',   $contract );
		$this->assertArrayNotHasKey( 'cetV2EntityHost', $parent->parsed_block['attrs'] );
	}

	public function testNestedEntityInV2PartParentGetsNoModifiersAndDoesNotFlagParent(): void {
		// Real-world case: core/embed inside ghostkit/carousel-slide (part).
		// The part is already inside a v2 entity; embed must not push spacing to the slide.
		$this->registry->part( 'carousel-slide', [ 'block' => 'ghostkit/carousel-slide' ] );
		$block  = [ 'blockName' => 'core/columns', 'attrs' => [ 'className' => 'is-style-text-only' ] ];
		$parent = new \WP_Block( [
			'blockName' => 'ghostkit/carousel-slide',
			'attrs'     => [ 'cetBlockContractV2' => [ 'role' => 'part' ] ],
		] );

		$result = $this->engine->resolve( $block, $block, $parent );

		$contract = $result['attrs']['cetBlockContractV2'];
		$this->assertSame( 'entity', $contract['role'] );
		$this->assertArrayNotHasKey( 'container', $contract );
		$this->assertArrayNotHasKey( 'spacing',   $contract );
		$this->assertArrayNotHasKey( 'cetV2EntityHost', $parent->parsed_block['attrs'] );
	}

	// -------------------------------------------------------------------------
	// Parts
	// -------------------------------------------------------------------------

	public function testPartInsideV2EntityParentGetsPartContract(): void {
		$block  = [ 'blockName' => 'core/heading', 'attrs' => [] ];
		$parent = new \WP_Block( [
			'blockName' => 'core/columns',
			'attrs'     => [ 'cetBlockContractV2' => [ 'role' => 'entity' ] ],
		] );

		$result = $this->engine->resolve( $block, $block, $parent );

		$contract = $result['attrs']['cetBlockContractV2'];
		$this->assertSame( 'part',            $contract['role'] );
		$this->assertSame( 'heading',         $contract['type'] );
		$this->assertSame( 'cet-part',        $contract['base_class'] );
		$this->assertSame( 'cet-part-heading', $contract['type_class'] );
	}

	public function testPartWithoutV2EntityParentIsUnchanged(): void {
		$block  = [ 'blockName' => 'core/heading', 'attrs' => [] ];
		$parent = new \WP_Block( [ 'blockName' => 'core/columns', 'attrs' => [] ] );

		$result = $this->engine->resolve( $block, $block, $parent );

		$this->assertArrayNotHasKey( 'cetBlockContractV2', $result['attrs'] );
	}

	public function testPartAtRootLevelIsUnchanged(): void {
		$block  = [ 'blockName' => 'core/heading', 'attrs' => [] ];
		$result = $this->engine->resolve( $block, $block, null );

		$this->assertArrayNotHasKey( 'cetBlockContractV2', $result['attrs'] );
	}

	// -------------------------------------------------------------------------
	// Wrappers
	// -------------------------------------------------------------------------

	public function testWrapperInsideV2EntityGetsWrapperContract(): void {
		$block  = [ 'blockName' => 'core/column', 'attrs' => [] ];
		$parent = new \WP_Block( [
			'blockName' => 'core/columns',
			'attrs'     => [ 'cetBlockContractV2' => [ 'role' => 'entity' ] ],
		] );

		$result = $this->engine->resolve( $block, $block, $parent );

		$contract = $result['attrs']['cetBlockContractV2'];
		$this->assertSame( 'wrapper',  $contract['role'] );
		$this->assertSame( 'cet-wrap', $contract['base_class'] );
	}

	public function testPartTakesPriorityOverWrapperWhenBothRegisteredForSameBlock(): void {
		// core/column is registered as BOTH a part and a wrapper.
		$this->registry->part( 'column', [ 'block' => 'core/column' ] );

		$block  = [ 'blockName' => 'core/column', 'attrs' => [] ];
		$parent = new \WP_Block( [
			'blockName' => 'core/columns',
			'attrs'     => [ 'cetBlockContractV2' => [ 'role' => 'entity' ] ],
		] );

		$result = $this->engine->resolve( $block, $block, $parent );

		// Part check runs first in resolve() — wrapper is skipped.
		$this->assertSame( 'part',   $result['attrs']['cetBlockContractV2']['role'] );
		$this->assertSame( 'column', $result['attrs']['cetBlockContractV2']['type'] );
	}

	// -------------------------------------------------------------------------
	// allowedNestedParents guard
	// -------------------------------------------------------------------------

	public function testAllowedParentsGuardSkipsPartWhenParentNotListed(): void {
		$engine = new ContractEngineV2( $this->registry, [ 'core/columns' ] );

		$block  = [ 'blockName' => 'core/heading', 'attrs' => [] ];
		// Parent is 'core/cover' — not in the allowed list.
		$parent = new \WP_Block( [
			'blockName' => 'core/cover',
			'attrs'     => [ 'cetBlockContractV2' => [ 'role' => 'entity' ] ],
		] );

		$result = $engine->resolve( $block, $block, $parent );

		$this->assertArrayNotHasKey( 'cetBlockContractV2', $result['attrs'] );
	}

	public function testAllowedParentsGuardPermitsPartWhenParentIsListed(): void {
		$engine = new ContractEngineV2( $this->registry, [ 'core/columns' ] );

		$block  = [ 'blockName' => 'core/heading', 'attrs' => [] ];
		$parent = new \WP_Block( [
			'blockName' => 'core/columns',
			'attrs'     => [ 'cetBlockContractV2' => [ 'role' => 'entity' ] ],
		] );

		$result = $engine->resolve( $block, $block, $parent );

		$this->assertSame( 'part', $result['attrs']['cetBlockContractV2']['role'] );
	}
}
