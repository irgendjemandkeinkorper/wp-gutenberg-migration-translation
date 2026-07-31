const stickyObserver = {
	instances: [],
	instancesData: null,
	ticking: false,
	options: {
		selector: '[data-sticky]',
		spaceSelector: null,
		className: 'is-sticky',
		spaceClassName: null,
		hiddenClassName: 'is-hidden',
	},
	methods: {
		init: 'init',
		scroll: 'scroll',
	},
	init( options = {} ) {
		this.options = { ...this.options, ...options };
		let selectors = this.options.selector;
		if ( this.options.spaceSelector ) {
			selectors = `${ selectors },${ this.options.spaceSelector }`.trim();
		}

		const $containers = document.querySelectorAll( selectors );
		if ( $containers.length < 1 ) {
			return;
		}

		this.instances = [ ...$containers ];
		this.instancesData = new Map();

		if ( 'complete' !== document.readyState ) {
			const initialData = new WeakMap();
			this.instances.forEach( ( $instance ) => {
				initialData.set( $instance, { height: $instance.offsetHeight } );
			} );

			window.addEventListener( 'load', () => {
				const hasHeightChanged = this.instances.some( ( el ) => {
					const previous = initialData.get( el )?.height || 0,
						current = el.offsetHeight;

					return current !== previous;
				} );

				if ( hasHeightChanged ) {
					this.reset();
					this.setup();
				}
			} );
		}

		this.setup();

		let resizeTimeout;
		window.addEventListener( 'resize', () => {
			clearTimeout( resizeTimeout );
			resizeTimeout = setTimeout( () => {
				window.removeEventListener( 'scroll', this.boundOnScroll );
				this.reset(
					this.instances.filter(
						( el ) =>
							el.matches( this.options.selector ) &&
							this.methods.scroll === el.dataset?.sticky
					)
				);
				this.boundOnScroll();
				this.setup();
			}, 100 );
		} );
	},
	setup() {
		this.initStickyState();
		this.calculateOffsets( this.instances );
		this.calculateContentOffset();
		this.applyStickyClasses();
		this.boundOnScroll = () =>
			this.onScroll(
				this.instances.filter( ( el ) => el.matches( this.options.spaceSelector ) ),
				this.instances.filter(
					( el ) =>
						el.matches( this.options.selector ) &&
						this.methods.scroll === el.dataset?.sticky
				)
			);
		this.boundOnScroll();
		window.addEventListener( 'scroll', this.boundOnScroll );
	},
	reset( $instances = this.instances ) {
		$instances.forEach( ( $item ) => {
			$item.classList.remove( this.options.className );
			$item.removeAttribute( 'data-sticky-initialized' );
			this.instancesData.delete( $item );
		} );
	},
	onScroll( observablePseudo, observableAndScrollable ) {
		if ( ! this.ticking ) {
			this.ticking = true;

			window.requestAnimationFrame( () => {
				this.processObserve( observablePseudo, observableAndScrollable );
				this.ticking = false;
			} );
		}
	},
	processObserve( observablePseudo, observableAndScrollable ) {
		const stickyScrollableCallback = () => {
			this.calculateOffsets(
				this.instances.filter( ( $container ) =>
					$container.matches( this.options.selector )
				)
			);
		};
		this.observe( {
			$items: observablePseudo,
			targetClass: this.options.hiddenClassName,
			rect: 'bottom',
		} );
		this.observe( {
			$items: observableAndScrollable,
			targetClass: this.options.className,
			callback: stickyScrollableCallback,
			rect: 'top',
		} );
	},
	observe( { $items, targetClass, callback, rect = 'top' } ) {
		if (
			Array.isArray( $items ) &&
			$items.length > 0 &&
			[ 'top', 'bottom' ].includes( rect )
		) {
			const contentOffset = parseInt(
				getComputedStyle( document.body ).getPropertyValue( '--offset-top' ),
				10
			);
			$items.forEach( ( $item ) => {
				if ( ! this.instancesData.has( $item ) ) {
					const offsetPropName =
						'offset' + rect.charAt( 0 ).toUpperCase() + rect.slice( 1 );
					this.instancesData.set( $item, { offset: $item[ offsetPropName ] } );
				}

				const offsetParent = $item.offsetParent,
					scrollTop =
						offsetParent && offsetParent !== document.body
							? offsetParent.scrollTop
							: document.documentElement.scrollTop,
					{ offset } = this.instancesData.get( $item ),
					isStickyPoint = scrollTop + contentOffset + 1 >= offset;
				$item.classList.toggle( targetClass, isStickyPoint );

				if ( $item.matches( this.options.selector ) ) {
					// eslint-disable-next-line no-unused-expressions
					isStickyPoint
						? $item.setAttribute( 'data-sticky-initialized', 'true' )
						: $item.removeAttribute( 'data-sticky-initialized' );
				}
			} );

			if ( 'function' === typeof callback ) {
				return callback();
			}
		}
		return undefined;
	},
	isInitializedSticky( el ) {
		return el && el.matches( this.options.selector ) && 'true' === el.dataset.stickyInitialized;
	},
	initStickyState() {
		this.instances.forEach( ( el ) => {
			if ( 'undefined' !== typeof el.dataset.sticky && ! el.dataset.sticky ) {
				el.dataset.sticky = this.methods.init;
			}

			if ( this.methods.init === el.dataset.sticky ) {
				el.dataset.stickyInitialized = 'true';
			}
		} );
	},
	applyStickyClasses() {
		this.instances.forEach( ( el ) => {
			const setClasses = ( targetClassName ) => {
					if ( ! el.classList.contains( targetClassName ) ) {
						el.classList.add( targetClassName );
					}
				},
				isTrulySticky = el.matches( this.options.selector );
			if ( isTrulySticky && this.isInitializedSticky( el ) ) {
				setClasses( this.options.className );
			}

			if ( ! isTrulySticky && this.options.spaceClassName ) {
				setClasses( this.options.spaceClassName );
			}
		} );
	},
	calculateOffsets( $instances ) {
		const adminBarHeight = parseInt(
				getComputedStyle( document.body ).getPropertyValue( '--admin-bar-height' ),
				10
			),
			adminBarHeightValue = Number.isInteger( adminBarHeight ) ? adminBarHeight : 0;
		let offset = 0;
		$instances.forEach( ( el ) => {
			if ( this.isInitializedSticky( el ) ) {
				const stickyTopValue = Math.max( offset, 0 );

				el.style.setProperty( '--sticky-top', `${ stickyTopValue }px`.trim() );
				el.style.setProperty(
					'--sticky-top-absolute-value',
					`${ stickyTopValue + adminBarHeightValue }px`.trim()
				);

				offset += Math.max( el.offsetHeight - 1, 0 );
				void el.offsetHeight;
			}
		} );
	},
	calculateContentOffset() {
		const contentOffset = this.instances.reduce( ( offset, stickyEl ) => {
			const elementHeight = this.isInitializedSticky( stickyEl ) ? stickyEl.offsetHeight : 0;
			return offset + elementHeight;
		}, 0 );

		document.body.style.setProperty(
			'--offset-top',
			`${ contentOffset > 0 ? contentOffset : 0 }px`
		);
	},
};

export { stickyObserver };
