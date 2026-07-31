const path = require("path");

// Strip fill/stroke only when they carry a hardcoded value.
// Preserve 'currentColor', 'none', and 'inherit' so CSS theming and
// transparent regions keep working after the sprite is built.
const stripHardcodedFillStroke = {
    name: 'stripHardcodedFillStroke',
    fn: () => ({
        element: {
            enter: (node) => {
                for (const attr of ['fill', 'stroke']) {
                    const val = node.attributes[attr];
                    if (val !== undefined && val !== 'currentColor' && val !== 'none' && val !== 'inherit') {
                        delete node.attributes[attr];
                    }
                }
            },
        },
    }),
};

module.exports = () => ({
    mode: {
        css: {
            render: {
                css: {
                    template: path.resolve(process.cwd(), './scripts/config/svg-sprite.template.css')
                }
            },
        },
    },
    shape: {
        transform: [
            {
                svgo: {
                    plugins: [
                        { name: 'removeAttrs', params: { attrs: '(width|height)' } },
                        stripHardcodedFillStroke,
                    ]
                }
            }
        ],
    },
});
