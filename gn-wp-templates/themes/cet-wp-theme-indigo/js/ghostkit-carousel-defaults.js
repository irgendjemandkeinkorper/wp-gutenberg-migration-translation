/**
 * Override GhostKit Carousel default attributes.
 *
 * GhostKit's carousel block ships with opinionated defaults
 * that don't match our design system. 
 *
 * This filter intercepts the block type registration for
 * `ghostkit/carousel` and adjusts the attribute defaults so
 * newly inserted carousels start from our preferred config:
 * - no centered slides
 * - no looping
 * - no free scroll
 * - no fade edges
 * - autoplay disabled (0)
 *
 * - This only affects the defaults used when a block is
 *   first inserted. Saved content / user-changed settings
 *   are not modified.
 */

(function (hooks, blocks, lodash) {
	const { assign } = lodash;
	hooks.addFilter(
		'blocks.registerBlockType',
		'cet/ghostkit-carousel-defaults',
		(settings, name) => {
			if (name !== 'ghostkit/carousel') {
				return settings;
			}

			const newSettings = assign({}, settings, {
				attributes: assign({}, settings.attributes, {
					centeredSlides: { type: 'boolean', default: false },
					loop: { type: 'boolean', default: false },
					freeScroll: { type: 'boolean', default: false },
					fadeEdges: { type: 'boolean', default: false },
                    autoplay: { type: "number", default: 0 },
                    autoplayHoverPause: { type: "boolean", default: false }
				}),
			});
			return newSettings;
		}
	);
})(window.wp.hooks, window.wp.blocks, window.lodash);
