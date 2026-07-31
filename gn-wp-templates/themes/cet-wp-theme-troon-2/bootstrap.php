<?php
/**
 * Bootstrap autoloader
 *
 * @package cet-wp-theme-troon-2
 */

use Cet\Theme\Troon2\Layout\BodyClassProvider;
use Cet\Theme\Troon2\Layout\FirstBlockDecorator;
use Cet\Theme\Troon2\Layout\HeroRenderer;
use Cet\Theme\Troon2\Layout\State\PageState;
use Cet\Theme\Troon2\Layout\WidgetAreaRegistrar;
use Cet\Theme\Troon2\Layout\State\TransparentHeaderRegistry;
use Cet\Theme\Troon2\Legacy\RkvMembersLayout;
use Cet\Theme\Troon2\Integrations\CoreButtonsAdapter;
use Cet\Theme\Troon2\Integrations\CoreLoginoutAdapter;
use Cet\Theme\Troon2\Pages\PageExtraField;
use Cet\Theme\Troon2\Integrations\CoreColumnsAdapter;
use Cet\Theme\Troon2\Integrations\CoreCoverAdapter;
use Cet\Theme\Troon2\Integrations\CoreGroupAdapter;
use Cet\Theme\Troon2\Integrations\GhostkitAssetsAdapter;
use Cet\Theme\Troon2\Integrations\GhostkitGridAdapter;
use Cet\Theme\Troon2\Integrations\WebresEzteeLinkAdapter;
use Cet\Theme\Troon2\Integrations\WooCommerceCart;
use Cet\Theme\Troon2\Integrations\WPFormsAdapter;
use Cet\Theme\Troon2\Admin\MenuEditorNotices;
use Cet\Theme\Troon2\Navigation\MenuRegistrar;
use Cet\Theme\Troon2\Navigation\NavigationFactory;
use Cet\Theme\Troon2\Blocks\ColumnCardSlider;
use Cet\Theme\Troon2\Blocks\InstructorsTabs;
use Cet\Theme\Troon2\Blocks\TestimonialsSlider;
use Cet\Theme\Troon2\Layout\WooCommerce\WooController;

/**
 * Feature flag for SVG icons infrastructure.
 *
 * When enabled, activates:
 * - SVG sprite rendering
 * - Icon toolbar in block editor
 * - Icon render filters
 * - Social menu icons
 */
define( 'CET_TROON_2_ENABLE_ICONS', true );

if ( file_exists( __DIR__ . '/vendor/autoload.php' ) ) {
	require __DIR__ . '/vendor/autoload.php';
}

/**
 * Initialize block contracts.
 */
$block_contracts_config = require __DIR__ . '/inc/block-contracts.php';

$contracts = new \Cet\Theme\Troon2\Blocks\BlockContracts(
	$block_contracts_config,
	[
		'core/group',
		'core/cover',
		'core/column',
		'core/columns',
		'core/media-text',
		'ghostkit/grid',
		'ghostkit/grid-column',
		'ghostkit/carousel',
		'ghostkit/carousel-slide',
	]
);

/**
 * Register v2 block contracts (Entities, Parts, Wrappers).
 *
 * The Registry is the migration gate. A block is handled by v2 when it is
 * registered here AND removed from inc/block-contracts.php. Until removed
 * from v1 config, the v1 engine continues to own it unchanged.
 *
 * Migration procedure per block:
 * 1. Add $registry->entity() call below (if not already present)
 * 2. Remove block from inc/block-contracts.php (section_blocks + nested_blocks)
 * 3. Update SCSS: .cet-block-type-{X} → .cet-entity-{X}
 * 4. Verify on staging — rollback by re-adding to inc/block-contracts.php
 */
$registry = $contracts->registry();

// Active v2 entities — migrated blocks (removed from inc/block-contracts.php).
// core/columns and ghostkit/grid are interchangeable layout wrappers — same contract for both.
$registry->entity(
	'text-only',
	[
		'blocks'    => [ 'core/columns', 'ghostkit/grid' ],
		'style'     => 'text-only',
		'container' => 'full-bleed',
		'spacing'   => 'none',
	]
);
$registry->entity(
	'faq',
	[
		'blocks'    => [ 'core/columns', 'ghostkit/grid' ],
		'style'     => 'faq',
		'container' => 'full-bleed',
		'spacing'   => 'none',
	]
);
$registry->entity(
	'testimonials',
	[
		'blocks'    => [ 'core/columns', 'ghostkit/grid' ],
		'style'     => 'testimonials',
		'container' => 'full-bleed',
		'spacing'   => 'xxl',
	]
);
$registry->entity(
	'small-cards',
	[
		'blocks'    => [ 'core/columns', 'ghostkit/grid' ],
		'style'     => 'small-cards',
		'container' => 'full-bleed',
		'spacing'   => 'none',
	]
);
$registry->entity(
	'big-cards',
	[
		'blocks'    => [ 'core/columns', 'ghostkit/grid' ],
		'style'     => 'big-cards',
		'container' => 'full-bleed',
		'spacing'   => 'none',
	]
);
$registry->entity(
	'text-carousel',
	[
		'blocks'       => [ 'core/columns', 'ghostkit/grid' ],
		'style'        => 'text-carousel',
		'container'    => 'full-bleed',
		'spacing'      => 'none',
		'sub_elements' => [ 'wp-block-image' => 'image' ],
	]
);
$registry->entity(
	'separator',
	[
		'blocks'  => [ 'core/separator', 'ghostkit/divider' ],
		'spacing' => 'sm',
	]
);
$registry->entity(
	'carousel',
	[
		'block'     => 'ghostkit/carousel',
		'style'     => 'default',
		'container' => 'full-bleed',
		'spacing'   => 'md',
	]
);
$registry->entity(
	'testimonials',
	[
		'block'     => 'ghostkit/carousel',
		'style'     => 'testimonials',
		'container' => 'container',
		'spacing'   => 'none',
	]
);
$registry->entity(
	'file',
	[
		'block'   => 'core/file',
		'spacing' => 'none',
	]
);
$registry->entity(
	'instructors',
	[
		'block'     => 'core/columns',
		'style'     => 'instructors',
		'container' => 'full-bleed',
		'spacing'   => 'none',
	]
);
$registry->entity(
	'instructors',
	[
		'block'     => 'ghostkit/tabs-v2',
		'container' => 'full-bleed',
		'spacing'   => 'none',
	]
);
$registry->entity(
	'instructor',
	[
		'blocks'    => [ 'core/columns', 'ghostkit/grid' ],
		'style'     => 'instructor',
		'container' => 'container',
		'spacing'   => 'none',
	]
);
$registry->entity(
	'contact-form',
	[
		'blocks'    => [ 'core/columns', 'ghostkit/grid' ],
		'style'     => 'contact-form',
		'container' => 'full-bleed',
		'spacing'   => 'xxl',
	]
);
$registry->entity(
	'wpforms',
	[
		'block'     => 'wpforms/form-selector',
		'container' => 'container',
		'spacing'   => 'md',
	]
);
$registry->entity(
	'embed',
	[
		'block'        => 'core/embed',
		'sub_elements' => [ 'wp-block-embed__wrapper' => 'embed-wrapper' ],
		'container'    => 'container',
		'spacing'      => 'md',
	]
);
$registry->entity(
	'club-intro',
	[
		'block'            => 'core/media-text',
		'style'            => 'club-intro',
		'container'        => 'full-bleed',
		'spacing'          => 'none',
		'sub_elements'     => [
			'wp-block-media-text__media'   => 'media',
			'wp-block-media-text__content' => 'content',
		],
		'orientation_attr' => 'mediaPosition',
	]
);
$registry->entity(
	'module-one-asset',
	[
		'block'            => 'core/media-text',
		'style'            => 'module-one-asset',
		'container'        => 'full-bleed',
		'spacing'          => 'none',
		'sub_elements'     => [
			'wp-block-media-text__media'   => 'media',
			'wp-block-media-text__content' => 'content',
		],
		'orientation_attr' => 'mediaPosition',
	]
);
$registry->entity(
	'group',
	[
		'block'     => 'core/group',
		'container' => 'container',
		'spacing'   => 'md',
	]
);

// Pending migration — uncomment + remove from inc/block-contracts.php when ready.

// phpcs:ignore Squiz.PHP.CommentedOutCode.Found, Squiz.Commenting.BlockComment.NoEmptyLineBefore -- Intentionally preserved for future activation.
/*
$registry->entity( 'cover',     [ 'block' => 'core/cover',   'container' => 'full-bleed', 'spacing' => 'lg' ] );
$registry->entity( 'accordion', [ 'blocks' => [ 'core/details', 'ghostkit/accordion' ], 'container' => 'container', 'spacing' => 'md' ] );
*/

// Parts — safe to activate globally: parent guard in ContractEngineV2 ensures
// Parts only fire when their direct parent is a v2 entity.
$registry->part( 'heading', [ 'block' => 'core/heading' ] );
$registry->part( 'body', [ 'block' => 'core/paragraph' ] );
$registry->part( 'actions', [ 'block' => 'core/buttons' ] );
$registry->part( 'button', [ 'block' => 'core/button' ] );
$registry->part( 'image', [ 'block' => 'core/image' ] );
$registry->part( 'list', [ 'block' => 'core/list' ] );
$registry->part( 'quote', [ 'block' => 'core/quote' ] );
$registry->part( 'accordion', [ 'block' => 'core/details' ] );
$registry->part( 'cover', [ 'block' => 'core/cover' ] );
$registry->part( 'columns', [ 'block' => 'core/columns' ] );
$registry->part( 'column', [ 'blocks' => [ 'core/column', 'ghostkit/grid-column' ] ] );
$registry->part( 'carousel-slide', [ 'block' => 'ghostkit/carousel-slide' ] );
$registry->part( 'accordion-item', [ 'block' => 'ghostkit/accordion-item' ] );

// Wrappers.
$registry->wrapper( 'core/column', 'core/group', 'ghostkit/grid-column' );

/**
 * Initialize SVG icons infrastructure if a feature flag is enabled.
 */
if ( defined( 'CET_TROON_2_ENABLE_ICONS' ) && CET_TROON_2_ENABLE_ICONS ) {
	$sprite_path = __DIR__ . '/build/sprite/svg/sprite.symbol.svg';

	if ( file_exists( $sprite_path ) ) {
		new \Cet\Theme\Troon2\Svg\SpriteManager(
			[ $sprite_path ],
			new \Cet\Theme\Troon2\Svg\SpriteCache(),
			'troon-2'
		);

		// Initialize icon renderer only when sprite exists.
		$icon_renderer = new \Cet\Theme\Troon2\Blocks\IconRenderer();
		$icon_renderer->init();
	}
}

/**
 * Initialize third-party integration adapters.
 */
foreach ( [
	CoreButtonsAdapter::class,
	CoreLoginoutAdapter::class,
	CoreColumnsAdapter::class,
	CoreCoverAdapter::class,
	CoreGroupAdapter::class,
	GhostkitAssetsAdapter::class,
	GhostkitGridAdapter::class,
	WebresEzteeLinkAdapter::class,
	WPFormsAdapter::class,
	WooCommerceCart::class,
] as $adapter ) {
	if ( class_exists( $adapter ) ) {
		new $adapter();
	}
}

/**
 * Initialize block classes.
 */
foreach ( [
	InstructorsTabs::class,
	TestimonialsSlider::class,
	ColumnCardSlider::class,
] as $block ) {
	if ( class_exists( $block ) ) {
		new $block();
	}
}

/**
 * Initialize navigation.
 */
MenuRegistrar::init();
NavigationFactory::init();

/**
 * Initialize widget areas.
 */
WidgetAreaRegistrar::init();

/**
 * Initialize layout providers.
 */
PageState::init(
	new TransparentHeaderRegistry(
		'core/cover',
		'core/image.alignfull', // alignfull is a class; will be parsed as wildcard.
		'core/embed.alignfull', // alignfull is a class; will be parsed as wildcard.
		'core/video.alignfull', // alignfull is a class; will be parsed as wildcard.
		'ghostkit/video.alignfull', // alignfull is a class; will be parsed as wildcard.
		'ghostkit/carousel.alignfull', // alignfull is a class; will be parsed as wildcard.
		'videopress/video',
		'core/group.hero-slider', // hero-slider is a class; will be parsed as wildcard.
		'core/group.hero-banner', // hero-banner is a class; will be parsed as wildcard.
		'core/columns.hero-banner' // hero-banner is a class; will be parsed as wildcard.
	)
);
HeroRenderer::register();
new BodyClassProvider();
new FirstBlockDecorator();
new WooController();

/**
 * Initialize legacy compatibility layer.
 */
if ( class_exists( RkvMembersLayout::class ) ) {
	new RkvMembersLayout();
}

/**
 * Initialize admin-only features.
 */
if ( is_admin() ) {
	( new MenuEditorNotices() )->init();
}

/**
 * Initialize page-level features.
 */
if ( class_exists( PageExtraField::class ) ) {
	new PageExtraField(
		get_stylesheet_directory() . '/build/js',
		get_stylesheet_directory_uri() . '/build/js'
	);
}
