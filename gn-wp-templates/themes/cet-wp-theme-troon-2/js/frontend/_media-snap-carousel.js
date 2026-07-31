/**
 * Media Snap Carousel
 */
document.addEventListener( 'DOMContentLoaded', () => {
	const carousels = document.querySelectorAll( ':is([data-cet-block="text-carousel"], [data-cet-entity="text-carousel"])' );

	carousels.forEach( ( carousel ) => {
		if ( carousel.dataset.mediaSnapCarouselInitialized ) {
			return;
		}

		const mediaColumn = Array.from(
			carousel.querySelectorAll( ':scope > :is([data-cet-block-part="column"], [data-cet-part="column"])' )
		).find( ( column ) => column.querySelector( ':scope > :is([data-cet-block-part="image"], [data-cet-part="image"])' ) );

		if ( ! mediaColumn ) {
			return;
		}

		const slides = Array.from(
			mediaColumn.querySelectorAll( ':scope > :is([data-cet-block-part="image"], [data-cet-part="image"])' )
		);

		if ( slides.length < 2 ) {
			return;
		}

		carousel.dataset.mediaSnapCarouselInitialized = 'true';

		let currentSlideIndex = 0;

		const goToSlide = ( index ) => {
			const slide = slides[ index ];

			if ( ! slide ) {
				return;
			}

			mediaColumn.scrollTo( {
				left: slide.offsetLeft - mediaColumn.offsetLeft,
				behavior: 'smooth',
			} );
		};

		setInterval( () => {
			currentSlideIndex = ( currentSlideIndex + 1 ) % slides.length;
			goToSlide( currentSlideIndex );
		}, 5000 );
	} );
} );
