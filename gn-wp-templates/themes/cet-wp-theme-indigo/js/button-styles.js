
wp.domReady( () => {
	const { unregisterBlockStyle, registerBlockStyle } = wp.blocks;

	try {
		unregisterBlockStyle( 'core/button', 'fill' );
		unregisterBlockStyle( 'core/button', 'outline' ); // to keep buttons order
	} catch ( e ) {
		// eslint-disable-next-line no-console
		console.debug( '[button-styles] could not unregister:', e );
	}
	registerBlockStyle( 'core/button', { name: 'primary', label: 'Primary', isDefault: true } );
	registerBlockStyle( 'core/button', { name: 'secondary', label: 'Secondary' } );
	registerBlockStyle( 'core/button', { name: 'outline', label: 'Outline' } );
	registerBlockStyle( 'core/button', { name: 'ghost', label: 'Ghost' } );
	registerBlockStyle( 'core/button', { name: 'text', label: 'Text' } );
	registerBlockStyle( 'core/button', { name: 'icon', label: 'Icon' } );
} );
