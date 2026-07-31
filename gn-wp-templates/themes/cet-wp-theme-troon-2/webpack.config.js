const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const path = require( 'path' );

module.exports = {
	...defaultConfig,
	module: {
		...defaultConfig.module,
		// Disable scss rules since we have sass commands directly.
		rules: defaultConfig.module.rules.filter(
			( rule ) => ! String( rule.test ).includes( 'scss' )
		),
	},
	entry: {
		'cet-theme-editor': path.resolve( __dirname, 'js/cet-theme-editor.js' ),
		'cet-theme-frontend': path.resolve( __dirname, 'js/frontend.js' ),
		'cet-theme-slider': path.resolve( __dirname, 'js/cet-slider.js' ),
		'cet-customizer-controls': path.resolve( __dirname, 'js/customizer/controls.js' ),
        'page-extra-field': path.resolve( __dirname, 'js/page-extra-field.js' ),
	},
	output: {
		...defaultConfig.output,
		path: path.resolve( __dirname, 'build/js' ),
		filename: '[name].min.js',
	},
};
