<?php

namespace Cet\Theme\Troon2\Blocks\Contracts;

/**
 * Block Contract Engine
 *
 * Orchestrates the contract system: registers WordPress hooks, resolves
 * contracts via ConfigResolver + ContractBuilder, and applies them via
 * HtmlApplicator. Contains the parent guard logic for nested blocks.
 *
 * @package cet-wp-theme-troon-2
 */
class ContractEngine {

	private ConfigResolver $resolver;
	private ContractBuilder $builder;
	private HtmlApplicator $applicator;

	/**
	 * Block types whose direct children are eligible for nested content contracts.
	 *
	 * @var array<int, string>
	 */
	private array $allowedNestedParents;

	/**
	 * @param ConfigResolver       $resolver             Config interpretation.
	 * @param ContractBuilder      $builder              Contract payload construction.
	 * @param HtmlApplicator       $applicator           HTML mutation.
	 * @param array<int, string>   $allowedNestedParents Block names whose direct children
	 *                                                   receive nested content contracts.
	 */
	public function __construct(
		ConfigResolver $resolver,
		ContractBuilder $builder,
		HtmlApplicator $applicator,
		array $allowedNestedParents = []
	) {
		$this->resolver             = $resolver;
		$this->builder              = $builder;
		$this->applicator           = $applicator;
		$this->allowedNestedParents = $allowedNestedParents;

		add_filter( 'render_block_data', [ $this, 'resolve' ], 10, 3 );
		add_filter( 'render_block', [ $this, 'apply' ], 10, 2 );
	}

	/**
	 * Resolve block contract configuration.
	 *
	 * Determines contract type and stores resolved config in block attrs.
	 *
	 * @param array<string, mixed> $parsed_block The parsed block data.
	 * @param array<string, mixed> $source_block The original block data.
	 * @param \WP_Block|null       $parent_block The parent block instance.
	 * @return array<string, mixed>
	 */
	public function resolve( array $parsed_block, array $source_block, $parent_block ): array {
		if ( empty( $parsed_block['blockName'] ) ) {
			return $parsed_block;
		}

		$blockName = $parsed_block['blockName'];
		$isNested  = ! empty( $parent_block );

		// Check if this is a section block.
		$sectionConfig  = $this->resolver->getSectionConfig( $parsed_block );
		$isSectionBlock = ! empty( $sectionConfig );

		// Check if this is a nested content block.
		$nestedConfig   = $this->resolver->getNestedConfig( $blockName );
		$isContentBlock = ! empty( $nestedConfig );

		// Resolve contract for top-level section blocks.
		if ( ! $isNested && $isSectionBlock ) {
			$align    = $parsed_block['attrs']['align'] ?? '';
			$contract = $this->builder->buildSectionContract( $blockName, $sectionConfig, $parsed_block );
			// When the editor has set a WP alignment (alignfull, alignwide, etc.) WP's own
			// alignment CSS owns the width. Strip container/spacing so we don't conflict.
			if ( $align !== '' ) {
				unset( $contract['container'], $contract['spacing'] );
			}
			$parsed_block['attrs']['cetBlockContract'] = $contract;
		}

		// Resolve contract for nested blocks — nested_blocks registration is authoritative;
		// section_blocks config is the fallback for blocks not explicitly registered for nesting.
		if ( $isNested && $this->resolver->nestedContentEnabled() ) {
			// Parent guard: skip blocks whose immediate parent is not a known layout container.
			// Prevents contracts leaking into Ghostkit leaf containers (accordion-items, icon-boxes, etc.)
			// that the CSS was not designed to style.
			if ( ! empty( $this->allowedNestedParents ) && ! in_array( $parent_block->name, $this->allowedNestedParents, true ) ) {
				return $parsed_block;
			}

			if ( $isContentBlock ) {
				// Explicit nested registration wins — use nested_blocks config.
				$parsed_block['attrs']['cetBlockContract'] = $this->builder->buildContentContract( $blockName, $nestedConfig );
			} elseif ( $isSectionBlock ) {
				// No nested_blocks entry — fall back to section config's type via content contract
				// so container/spacing modifiers are not applied inside a parent section.
				$parsed_block['attrs']['cetBlockContract'] = $this->builder->buildContentContract( $blockName, $sectionConfig );
			}
		}

		return $parsed_block;
	}

	/**
	 * Apply block contract to rendered markup.
	 *
	 * @param string               $blockContent Rendered block content.
	 * @param array<string, mixed> $block        Block data.
	 * @return string
	 */
	public function apply( string $blockContent, array $block ): string {
		// Check if contract was resolved.
		if ( empty( $block['attrs']['cetBlockContract'] ) ) {
			return $blockContent;
		}

		$contract = $block['attrs']['cetBlockContract'];

		// Apply section or content contract.
		if ( $contract['type'] === 'section' ) {
			return $this->applicator->applySection( $blockContent, $contract );
		}

		if ( $contract['type'] === 'content' ) {
			return $this->applicator->applyContent( $blockContent, $contract );
		}

		return $blockContent;
	}
}
