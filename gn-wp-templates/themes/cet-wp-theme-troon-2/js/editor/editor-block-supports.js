/**
 * Disables font size support for heading block.
 */
import { addFilter } from '@wordpress/hooks';

addFilter(
	'blocks.registerBlockType',
	'cet-troon-2/disable-button-font-size',
	( settings, name ) => {
		const excludedBlocks = [ 'core/button' ];

		if ( ! excludedBlocks.includes( name ) ) {
			return settings;
		}

		return {
			...settings,
			supports: {
				...settings.supports,
				typography: {
					...settings.supports?.typography,
					fontSize: false,
				},
			},
		};
	}
);
