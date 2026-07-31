/**
 * Cards Carousel
 *
 * Initialises scroll-snap carousel for big-cards and small-cards columns blocks.
 * Activation is controlled by the data-cet-carousel attribute set by PHP:
 *   "all"         – active on every viewport
 *   "mobile-only" – active only below MOBILE_BREAKPOINT
 */

import { CarouselController } from './carousel-controller';

const CARD_STYLES = window.cetTroon2Settings?.carouselStyles || [ 'big-cards', 'small-cards' ];

document.addEventListener( 'DOMContentLoaded', () => {
	const blocks = CARD_STYLES.map(
		( style ) => `[data-cet-carousel]:is([data-cet-block="${ style }"], [data-cet-entity="${ style }"])`
	).join( ', ' );

	document.querySelectorAll( blocks ).forEach( ( block ) => {
		const carousel = block.querySelector( ':is([data-cet-block-part="columns"], [data-cet-part="columns"]):last-child' ),
			slides = Array.from(
				carousel.querySelectorAll( ':scope > :is([data-cet-block-part="column"], [data-cet-part="column"])' )
			),
			slidesPerView = parseInt( block.dataset.cetSlidesPerView, 10 );
		if ( slidesPerView > 0 ) {
			block.style.setProperty( '--slides-per-view', slidesPerView );
		}

		if ( slides.length < 2 ) {
			return;
		}

		const isMobileOnly = block.dataset.cetCarousel === 'mobile-only',
			controller = new CarouselController( carousel, slides, {
				slidesPerView,
				mobileOnly: isMobileOnly,
			} );

		controller.init();
	} );
} );
