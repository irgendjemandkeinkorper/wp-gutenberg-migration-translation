import babel from '@rollup/plugin-babel';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import scss from 'rollup-plugin-scss';
import wpResolve from 'rollup-plugin-wp-resolve';
import browsersync from 'rollup-plugin-browsersync';
import commonjs from '@rollup/plugin-commonjs';
import watcher from 'rollup-plugin-watcher';
import replace from '@rollup/plugin-replace';

const plugins = [
	watcher(['./assets/src/scss/**/*.scss']),
	scss({
		include: 'assets/src/scss/*.scss',
		output: 'assets/dist/main.css',
		outputStyle: 'compressed',
		verbose: true,
	}),
	babel({
		include: 'assets/src/**',
		exclude: 'node_modules/**',
		babelHelpers: 'runtime',
		skipPreflightCheck: true,
	}),
	nodeResolve(),
	process.env.NODE_ENV === 'production' && terser(),
	process.env.NODE_ENV === 'development' &&
		browsersync({
			files: [
				"**/*.css",
			]
		}),
	commonjs(),
	wpResolve(),
	// This is necessary to get popper.js to work correctly
	replace({
		'preventAssignment': true,
		'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
	}),
];

export default [
	{
		input: 'assets/src/js/index.js',
		output: {
			file: 'assets/dist/index.js',
			format: 'umd', // had to switch to 'umd' so that popper.js is happy we aren't using <script type="module"> tags atm, so we don't need to use 'es' here
			sourcemap: process.env.NODE_ENV === 'production' ? false : 'inline',
		},
		plugins: plugins
	},
	{
		input: 'assets/src/js-preview/index.js',
		output: {
			file: 'assets/dist/preview.js',
			format: 'es',
			sourcemap: process.env.NODE_ENV === 'production' ? false : 'inline',
		},
		plugins: plugins
	}
];
