<?php

namespace Cet\Theme\Troon2\Blocks;

use Cet\Theme\Troon2\Blocks\Contracts\ConfigResolver;
use Cet\Theme\Troon2\Blocks\Contracts\ConfigValidator;
use Cet\Theme\Troon2\Blocks\Contracts\ContractBuilder;
use Cet\Theme\Troon2\Blocks\Contracts\ContractEngine;
use Cet\Theme\Troon2\Blocks\Contracts\ContractEngineV2;
use Cet\Theme\Troon2\Blocks\Contracts\HtmlApplicator;
use Cet\Theme\Troon2\Blocks\Contracts\Registry;

/**
 * Block Contracts Facade
 *
 * Preserves the original constructor signature for backward compatibility.
 * Delegates to focused classes under Contracts/ namespace.
 *
 * @package cet-wp-theme-troon-2
 */
class BlockContracts {

	private Registry $registry;

	/**
	 * @param array<string, mixed> $config               Configuration array from inc/block-contracts.php.
	 * @param array<int, string>   $allowedNestedParents Block names whose direct children
	 *                                                   receive nested content contracts.
	 */
	public function __construct( array $config, array $allowedNestedParents = [] ) {
		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			ConfigValidator::validate( $config );
		}

		$this->registry = new Registry();

		$resolver   = new ConfigResolver( $config );
		$builder    = new ContractBuilder( $config['defaults'] );
		$applicator = new HtmlApplicator( $config['defaults']['content'] ?? [] );

		// V1 engine: config-driven section/content contracts from inc/block-contracts.php.
		// It stamps resolved data into 'cetBlockContract' and applies legacy cet-block/cet-block-part classes.
		new ContractEngine( $resolver, $builder, $applicator, $allowedNestedParents );
		// V2 engine: registry-driven entity/part/wrapper contracts registered in bootstrap.php.
		// It runs in parallel with V1 but uses separate attrs ('cetBlockContractV2', 'cetV2EntityHost'),
		// so both systems can coexist technically during migration while ownership moves block-by-block.
		new ContractEngineV2( $this->registry, $allowedNestedParents );
	}

	/**
	 * Return the v2 Registry for block registration calls in bootstrap.php.
	 *
	 * @return Registry
	 */
	public function registry(): Registry {
		return $this->registry;
	}
}
