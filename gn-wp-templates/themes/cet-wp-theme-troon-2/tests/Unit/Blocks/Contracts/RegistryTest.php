<?php

declare(strict_types=1);

namespace Cet\Theme\Troon2\Tests\Unit\Blocks\Contracts;

use Cet\Theme\Troon2\Blocks\Contracts\Registry;
use Cet\Theme\Troon2\Tests\Unit\TestCase;
use PHPUnit\Framework\Attributes\CoversClass;

#[CoversClass( Registry::class )]
class RegistryTest extends TestCase {

	private Registry $registry;

	protected function setUp(): void {
		parent::setUp();
		$this->registry = new Registry();
	}

	// -------------------------------------------------------------------------
	// matchEntity
	// -------------------------------------------------------------------------

	public function testMatchEntityReturnsNullForUnregisteredBlock(): void {
		$this->assertNull( $this->registry->matchEntity( [ 'blockName' => 'core/columns', 'attrs' => [] ] ) );
	}

	public function testMatchEntityReturnsDefinitionForStylelessEntity(): void {
		$this->registry->entity( 'cover', [ 'block' => 'core/cover', 'container' => 'full-bleed', 'spacing' => 'lg' ] );

		$entity = $this->registry->matchEntity( [ 'blockName' => 'core/cover', 'attrs' => [] ] );

		$this->assertNotNull( $entity );
		$this->assertSame( 'cover', $entity->type );
		$this->assertSame( 'core/cover', $entity->block );
		$this->assertSame( 'full-bleed', $entity->container );
		$this->assertSame( 'lg', $entity->spacing );
		$this->assertNull( $entity->style );
	}

	public function testMatchEntityReturnsDefinitionWhenStyleMatches(): void {
		$this->registry->entity( 'text-only', [ 'block' => 'core/columns', 'style' => 'text-only', 'container' => 'full-bleed', 'spacing' => 'none' ] );

		$entity = $this->registry->matchEntity( [
			'blockName' => 'core/columns',
			'attrs'     => [ 'className' => 'is-style-text-only' ],
		] );

		$this->assertNotNull( $entity );
		$this->assertSame( 'text-only', $entity->type );
	}

	public function testMatchEntityReturnsNullWhenStyleDoesNotMatch(): void {
		$this->registry->entity( 'text-only', [ 'block' => 'core/columns', 'style' => 'text-only', 'container' => 'full-bleed', 'spacing' => 'none' ] );

		$result = $this->registry->matchEntity( [
			'blockName' => 'core/columns',
			'attrs'     => [ 'className' => 'is-style-faq' ],
		] );

		$this->assertNull( $result );
	}

	public function testMatchEntityReturnsNullWhenClassNameMissing(): void {
		$this->registry->entity( 'text-only', [ 'block' => 'core/columns', 'style' => 'text-only', 'container' => 'full-bleed', 'spacing' => 'none' ] );

		$this->assertNull( $this->registry->matchEntity( [ 'blockName' => 'core/columns', 'attrs' => [] ] ) );
	}

	public function testMatchEntityReturnsFirstMatchingDefinitionAmongMultiple(): void {
		$this->registry->entity( 'faq',       [ 'block' => 'core/columns', 'style' => 'faq',       'container' => 'full-bleed', 'spacing' => 'none' ] );
		$this->registry->entity( 'text-only', [ 'block' => 'core/columns', 'style' => 'text-only', 'container' => 'full-bleed', 'spacing' => 'none' ] );

		$entity = $this->registry->matchEntity( [
			'blockName' => 'core/columns',
			'attrs'     => [ 'className' => 'is-style-text-only' ],
		] );

		$this->assertSame( 'text-only', $entity->type );
	}

	public function testMatchEntityStylelessMatchesBeforeStyleGatedForSameBlock(): void {
		// Styleless definition registered second — should still match immediately.
		$this->registry->entity( 'text-only', [ 'block' => 'core/columns', 'style' => 'text-only', 'container' => 'full-bleed', 'spacing' => 'none' ] );
		$this->registry->entity( 'group',     [ 'block' => 'core/columns', 'container' => 'container', 'spacing' => 'md' ] );

		$entity = $this->registry->matchEntity( [
			'blockName' => 'core/columns',
			'attrs'     => [ 'className' => '' ],
		] );

		// Styleless definition ('group') appears second but matchEntity returns the
		// first registered definition that matches — in this case 'text-only' has a
		// style and won't match empty className, so 'group' (styleless) wins.
		$this->assertSame( 'group', $entity->type );
	}

	// -------------------------------------------------------------------------
	// matchPart
	// -------------------------------------------------------------------------

	public function testMatchPartReturnsNullForUnregisteredBlock(): void {
		$this->assertNull( $this->registry->matchPart( 'core/heading' ) );
	}

	public function testMatchPartReturnsDefinitionForRegisteredBlock(): void {
		$this->registry->part( 'heading', [ 'block' => 'core/heading' ] );

		$part = $this->registry->matchPart( 'core/heading' );

		$this->assertNotNull( $part );
		$this->assertSame( 'heading', $part->type );
		$this->assertSame( 'core/heading', $part->block );
	}

	public function testMatchPartLatestRegistrationWinsForSameBlock(): void {
		$this->registry->part( 'heading', [ 'block' => 'core/heading' ] );
		$this->registry->part( 'title',   [ 'block' => 'core/heading' ] );

		$this->assertSame( 'title', $this->registry->matchPart( 'core/heading' )->type );
	}

	// -------------------------------------------------------------------------
	// isWrapper
	// -------------------------------------------------------------------------

	public function testIsWrapperReturnsFalseForUnregisteredBlock(): void {
		$this->assertFalse( $this->registry->isWrapper( 'core/column' ) );
	}

	public function testIsWrapperReturnsTrueForRegisteredBlock(): void {
		$this->registry->wrapper( 'core/column' );
		$this->assertTrue( $this->registry->isWrapper( 'core/column' ) );
	}

	// -------------------------------------------------------------------------
	// blocks array (multi-block registration)
	// -------------------------------------------------------------------------

	public function testBlocksArrayRegistersDefinitionForEachBlock(): void {
		$this->registry->entity( 'text-only', [
			'blocks'    => [ 'core/columns', 'ghostkit/grid' ],
			'style'     => 'text-only',
			'container' => 'full-bleed',
			'spacing'   => 'none',
		] );

		$columns = $this->registry->matchEntity( [
			'blockName' => 'core/columns',
			'attrs'     => [ 'className' => 'is-style-text-only' ],
		] );
		$grid = $this->registry->matchEntity( [
			'blockName' => 'ghostkit/grid',
			'attrs'     => [ 'className' => 'is-style-text-only' ],
		] );

		$this->assertNotNull( $columns );
		$this->assertSame( 'text-only', $columns->type );
		$this->assertSame( 'core/columns', $columns->block );

		$this->assertNotNull( $grid );
		$this->assertSame( 'text-only', $grid->type );
		$this->assertSame( 'ghostkit/grid', $grid->block );
	}

	public function testBlocksArrayEachDefinitionCarriesCorrectBlockName(): void {
		$this->registry->entity( 'faq', [
			'blocks'    => [ 'core/columns', 'ghostkit/grid' ],
			'style'     => 'faq',
			'container' => 'full-bleed',
			'spacing'   => 'none',
		] );

		$columns = $this->registry->matchEntity( [
			'blockName' => 'core/columns',
			'attrs'     => [ 'className' => 'is-style-faq' ],
		] );
		$grid = $this->registry->matchEntity( [
			'blockName' => 'ghostkit/grid',
			'attrs'     => [ 'className' => 'is-style-faq' ],
		] );

		$this->assertSame( 'core/columns', $columns->block );
		$this->assertSame( 'ghostkit/grid', $grid->block );
	}

	public function testBlocksArrayEmptyArrayIsIgnored(): void {
		$this->registry->entity( 'text-only', [ 'blocks' => [], 'style' => 'text-only', 'container' => 'full-bleed', 'spacing' => 'none' ] );

		$this->assertNull( $this->registry->matchEntity( [ 'blockName' => 'core/columns', 'attrs' => [] ] ) );
	}

	public function testBlocksArraySkipsEmptyStringEntries(): void {
		$this->registry->entity( 'text-only', [
			'blocks'    => [ '', 'core/columns', '' ],
			'style'     => 'text-only',
			'container' => 'full-bleed',
			'spacing'   => 'none',
		] );

		$this->assertNotNull( $this->registry->matchEntity( [
			'blockName' => 'core/columns',
			'attrs'     => [ 'className' => 'is-style-text-only' ],
		] ) );
		$this->assertNull( $this->registry->matchEntity( [ 'blockName' => '', 'attrs' => [] ] ) );
	}

	public function testBlocksArrayAndBlockStringSingleRegistrationAreEquivalent(): void {
		$this->registry->entity( 'cover-a', [ 'block'  => 'core/cover', 'container' => 'full-bleed', 'spacing' => 'lg' ] );
		$this->registry->entity( 'cover-b', [ 'blocks' => [ 'core/cover' ], 'container' => 'full-bleed', 'spacing' => 'lg' ] );

		$a = $this->registry->matchEntity( [ 'blockName' => 'core/cover', 'attrs' => [] ] );
		// With two styleless definitions for core/cover, the first registered wins.
		$this->assertNotNull( $a );
		// Both registrations are indexable — confirm cover-b resolves if cover-a is not registered.
		$registry2 = new Registry();
		$registry2->entity( 'cover-b', [ 'blocks' => [ 'core/cover' ], 'container' => 'full-bleed', 'spacing' => 'lg' ] );
		$b = $registry2->matchEntity( [ 'blockName' => 'core/cover', 'attrs' => [] ] );
		$this->assertNotNull( $b );
		$this->assertSame( 'cover-b', $b->type );
	}

	// -------------------------------------------------------------------------
	// part — blocks array (multi-block registration)
	// -------------------------------------------------------------------------

	public function testPartBlocksArrayRegistersDefinitionForEachBlock(): void {
		$this->registry->part( 'column', [ 'blocks' => [ 'core/column', 'ghostkit/grid-column' ] ] );

		$col  = $this->registry->matchPart( 'core/column' );
		$gcol = $this->registry->matchPart( 'ghostkit/grid-column' );

		$this->assertNotNull( $col );
		$this->assertSame( 'column', $col->type );
		$this->assertSame( 'core/column', $col->block );

		$this->assertNotNull( $gcol );
		$this->assertSame( 'column', $gcol->type );
		$this->assertSame( 'ghostkit/grid-column', $gcol->block );
	}

	public function testPartBlocksArraySkipsEmptyStringEntries(): void {
		$this->registry->part( 'column', [ 'blocks' => [ '', 'core/column', '' ] ] );

		$this->assertNotNull( $this->registry->matchPart( 'core/column' ) );
		$this->assertNull( $this->registry->matchPart( '' ) );
	}

	public function testPartBlockAndBlocksArrayAreEquivalentForSingleBlock(): void {
		$this->registry->part( 'heading-a', [ 'block'  => 'core/heading' ] );

		$registry2 = new Registry();
		$registry2->part( 'heading-b', [ 'blocks' => [ 'core/heading' ] ] );

		$this->assertSame( 'heading-a', $this->registry->matchPart( 'core/heading' )->type );
		$this->assertSame( 'heading-b', $registry2->matchPart( 'core/heading' )->type );
	}

	// -------------------------------------------------------------------------
	// wrapper — variadic (multi-block registration)
	// -------------------------------------------------------------------------

	public function testWrapperVariadicRegistersMultipleBlocks(): void {
		$this->registry->wrapper( 'core/column', 'core/group', 'ghostkit/grid-column' );

		$this->assertTrue( $this->registry->isWrapper( 'core/column' ) );
		$this->assertTrue( $this->registry->isWrapper( 'core/group' ) );
		$this->assertTrue( $this->registry->isWrapper( 'ghostkit/grid-column' ) );
	}

	public function testWrapperVariadicSingleArgStillWorks(): void {
		$this->registry->wrapper( 'core/column' );
		$this->assertTrue( $this->registry->isWrapper( 'core/column' ) );
	}

	public function testWrapperVariadicSkipsEmptyStrings(): void {
		$this->registry->wrapper( '', 'core/column', '' );
		$this->assertTrue( $this->registry->isWrapper( 'core/column' ) );
		$this->assertFalse( $this->registry->isWrapper( '' ) );
	}

	// -------------------------------------------------------------------------
	// Edge cases
	// -------------------------------------------------------------------------

	public function testEntityRegistrationIgnoresEmptyBlock(): void {
		$this->registry->entity( 'text-only', [ 'block' => '', 'container' => 'full-bleed', 'spacing' => 'none' ] );
		$this->assertNull( $this->registry->matchEntity( [ 'blockName' => '', 'attrs' => [] ] ) );
	}

	public function testEntityRegistrationIgnoresEmptyType(): void {
		$this->registry->entity( '', [ 'block' => 'core/columns', 'container' => 'full-bleed', 'spacing' => 'none' ] );
		$this->assertNull( $this->registry->matchEntity( [ 'blockName' => 'core/columns', 'attrs' => [] ] ) );
	}
}
