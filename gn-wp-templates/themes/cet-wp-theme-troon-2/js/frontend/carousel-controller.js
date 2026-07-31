const MOBILE_BREAKPOINT = 768,
	SLIDE_INTERVAL = 5000;

class CarouselController {
	constructor( carousel, slides, options = {} ) {
		this.carousel = carousel;
		this.slides = slides;
		this.slidesPerView = options.slidesPerView || 1;
		this.mobileOnly = options.mobileOnly || false;
		this.step = 1;
		this.currentStop = 0;
		this.intervalId = null;
		this.mediaQuery = null;
		this.mediaQueryListener = null;
	}

	getTotalStops() {
		const spv = window.innerWidth <= MOBILE_BREAKPOINT ? 1 : this.slidesPerView;
		return Math.max( 1, this.slides.length - spv + 1 );
	}

	goToSlide( stop ) {
		const slide = this.slides[ stop * this.step ];
		if ( ! slide ) {
			return;
		}
		this.carousel.scrollTo( {
			left: slide.offsetLeft - this.carousel.offsetLeft,
			behavior: 'smooth',
		} );
	}

	start() {
		if ( this.intervalId ) {
			return;
		}
		this.intervalId = setInterval( () => {
			const totalStops = this.getTotalStops();
			this.currentStop = ( this.currentStop + 1 ) % totalStops;
			this.goToSlide( this.currentStop );
		}, SLIDE_INTERVAL );
	}

	stop() {
		if ( ! this.intervalId ) {
			return;
		}
		clearInterval( this.intervalId );
		this.intervalId = null;
		this.currentStop = 0;
	}

	setupMobileOnly() {
		this.mediaQuery = window.matchMedia( `(max-width: ${ MOBILE_BREAKPOINT }px)` );
		this.mediaQueryListener = ( e ) => ( e.matches ? this.start() : this.stop() );
		this.mediaQuery.addEventListener( 'change', this.mediaQueryListener );
		if ( this.mediaQuery.matches ) {
			this.start();
		}
	}

	init() {
		if ( this.mobileOnly ) {
			this.setupMobileOnly();
		} else {
			this.start();
		}
	}

	destroy() {
		this.stop();
		if ( this.mediaQuery && this.mediaQueryListener ) {
			this.mediaQuery.removeEventListener( 'change', this.mediaQueryListener );
		}
	}
}

export { CarouselController };
