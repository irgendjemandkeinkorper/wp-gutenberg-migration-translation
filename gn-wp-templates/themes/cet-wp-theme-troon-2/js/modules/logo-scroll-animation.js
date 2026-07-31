const logoScrollAnimation = {
	el: null,
	ticking: false,
	options: {
		scrollThreshold: 100,
		mobilePx: 1023,
		desktop: {
			largeWidth: 184,
			largeHeight: 163,
			smallWidth: 170,
			smallHeight: 80,
			translateStart: 115,
		},
		mobile: {
			largeWidth: 92,
			largeHeight: 82,
			smallWidth: 76,
			smallHeight: 60,
			translateStart: 86,
		},
		compactClass: 'is-compact',
	},
	init( options = {} ) {
		this.options = { ...this.options, ...options };
		this.el = document.querySelector( '.custom-logo-link' );
		if ( ! this.el ) {
			return;
		}

		this.skipAnimation = document.body.classList.contains( 'has-sticky-header-offset' );

		if ( ! this.skipAnimation ) {
			this.boundOnScroll = this.onScroll.bind( this );
			window.addEventListener( 'scroll', this.boundOnScroll );
		}

		let resizeTimeout;
		window.addEventListener( 'resize', () => {
			clearTimeout( resizeTimeout );
			resizeTimeout = setTimeout( () => this.update(), 100 );
		} );

		this.update();
	},
	onScroll() {
		if ( ! this.ticking ) {
			this.ticking = true;
			window.requestAnimationFrame( () => {
				this.update();
				this.ticking = false;
			} );
		}
	},
	update() {
		const { scrollThreshold, mobilePx, compactClass } = this.options,
			{ largeWidth, largeHeight, smallWidth, smallHeight, translateStart } =
				window.innerWidth <= mobilePx ? this.options.mobile : this.options.desktop,
			scrollY = window.scrollY || document.documentElement.scrollTop,
			progress = this.skipAnimation ? 1 : Math.min( scrollY / scrollThreshold, 1 ),
			width = largeWidth + ( smallWidth - largeWidth ) * progress,
			height = largeHeight + ( smallHeight - largeHeight ) * progress,
			translateY = translateStart * ( 1 - progress );

		this.el.style.width = `${ width }px`;
		this.el.style.height = `${ height }px`;
		this.el.style.transform = `translateY(${ translateY }px)`;
		this.el.classList.toggle( compactClass, progress >= 1 );
	},
};

export { logoScrollAnimation };
