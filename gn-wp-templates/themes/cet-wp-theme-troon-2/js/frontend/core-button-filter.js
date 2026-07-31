import domReady from '@wordpress/dom-ready';
import { subscribe, select } from '@wordpress/data';

domReady( () => {
	const style = document.createElement( 'style' );

	// Styles to hide the color panel in the block inspector when an outline button is selected,
	// as the design has fixed colors.
	// This style is not pasted into editor.css, because editor.css is loaded in the editor iframe,
	// this styles does not work here when loaded in editor.css,
	// and we need to apply this style to the parent document.

	// phpcs:disable WordPressVIPMinimum.JS.InnerHTML.Found -- Exception: content is sanitized/controlled.
	style.innerHTML = `
		body.has-selected-outline-button
			.block-editor-block-inspector
			.color-block-support-panel {
				display: none;
		}
	`;

	document.head.appendChild( style );
	// phpcs:enable WordPressVIPMinimum.JS.InnerHTML.Found

	subscribe( () => {
		const selectedBlock = select( 'core/block-editor' ).getSelectedBlock(),
			isOutlineButton =
				selectedBlock?.name === 'core/button' &&
				selectedBlock?.attributes?.className?.split( ' ' )?.includes( 'is-style-outline' );

		document.body.classList.toggle( 'has-selected-outline-button', Boolean( isOutlineButton ) );
	} );
} );
