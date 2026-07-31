// webpack.mix.js

const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");
let mix = require('laravel-mix');

mix.webpackConfig(
    {
        plugins: [
            new NodePolyfillPlugin(),
        ],
    
        resolve: {
            fallback: {
                fs: require.resolve('browserify-fs'),
            }
        }
    }
);

mix.setPublicPath('../');

mix.js('src/js/custom.js', 'js/').react();
mix.sass('src/sass/style.scss', 'css/');

// mix.js('src/customizer/js/wp_customizer_backgrounds_selection.js', 'customizer/js/');
// mix.sass('src/customizer/sass/wp_customizer_backgrounds_selection.scss', 'customizer/css/');

mix.options({
    processCssUrls: false,
    legacyNodePolyfills: false,
});