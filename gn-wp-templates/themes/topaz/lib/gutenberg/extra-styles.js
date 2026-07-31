wp.domReady( function() {
    wp.blocks.registerBlockStyle( 'core/heading', {
        name: 'lined-heading',
        label: 'lined-heading',
    } );

    wp.blocks.registerBlockStyle( 'ghostkit/icon-box', {
        name: 'border-ring-box',
        label: 'Border Ring Icon Box',
    } );
} );