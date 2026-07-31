import domReady from '@wordpress/dom-ready';
import Splide from '@splidejs/splide';
import '@splidejs/splide/css';
import '@splidejs/splide/css/core';

domReady( () => {
	document.querySelectorAll( '.splide' ).forEach( ( el ) => {
		new Splide( /** @type {HTMLElement} */ ( el ), {
			arrows: false,
			classes: {
				pagination: 'splide__pagination cet-slider-pagination',
			},
		} ).mount();
	} );
} );
