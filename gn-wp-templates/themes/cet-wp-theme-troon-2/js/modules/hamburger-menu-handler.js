import { mobilePx } from './breakpoints';
import { calculateAdminBarHeight } from './calculate-admin-bar-height';

const hamburgerMenuHandler = {
	mobilePx,

	options: {
		openSelector: '[data-burger-open-handler]',
		closeSelector: '[data-burger-close-handler]',
		navSelector: null,
		bodySignalClass: 'has-mobile-menu-opened',
		desktopBodySignalClass: 'has-desktop-menu-opened',
		activeClass: 'is-active',
	},

	outsideClickHandler: null,

	init( options = {}, mobileBreakpoints = {} ) {
		this.options = { ...this.options, ...options };
		this.mobilePx = { ...this.mobilePx, ...mobileBreakpoints };

		this.calculateAdminBarHeight();
		document.addEventListener( 'click', this.onClick.bind( this ) );
		document.addEventListener( 'keydown', this.onKeydown.bind( this ) );

		window.addEventListener( 'resize', () => {
			const isMenuOpen =
				document.body.classList.contains( this.options.bodySignalClass ) ||
				document.body.classList.contains( this.options.desktopBodySignalClass );

			if ( isMenuOpen ) {
				document.body.classList.remove(
					this.options.bodySignalClass,
					this.options.desktopBodySignalClass
				);
				document.body.classList.add( this.getBodySignalClass() );
			}

			this.calculateAdminBarHeight();
		} );
	},

	onKeydown( e ) {
		if ( 'Escape' !== e.key ) {
			return;
		}

		const isMenuOpen =
			document.body.classList.contains( this.options.bodySignalClass ) ||
			document.body.classList.contains( this.options.desktopBodySignalClass );

		if ( isMenuOpen ) {
			const bodySignalClass = this.getBodySignalClass();
			this.reset();
			this.dispatchEvent( 'cet-burger-closing', {
				element: null,
				shouldBeActive: false,
				bodySignalClass,
			} );
		}
	},

	getBodySignalClass() {
		return window.innerWidth >= this.mobilePx.lg
			? this.options.desktopBodySignalClass
			: this.options.bodySignalClass;
	},

	reset() {
		const $buttons = document.querySelectorAll(
			`${ this.options.openSelector }, ${ this.options.closeSelector }`
		);

		$buttons.forEach( ( $button ) => {
			$button.classList.remove( this.options.activeClass );
			$button.setAttribute( 'aria-expanded', 'false' );
		} );

		document.body.classList.remove(
			this.options.bodySignalClass,
			this.options.desktopBodySignalClass
		);

		this.detachOutsideClick();
	},

	onClick( e ) {
		const $element = e.target,
			$openButton = $element.matches( this.options.openSelector )
				? $element
				: $element.closest( this.options.openSelector ),
			$closeButton = $element.matches( this.options.closeSelector )
				? $element
				: $element.closest( this.options.closeSelector );

		if ( ! $openButton && ! $closeButton ) {
			return;
		}

		e.preventDefault();

		const shouldBeActive = Boolean( $openButton ),
			bodySignalClass = this.getBodySignalClass();

		document.body.classList.remove(
			this.options.bodySignalClass,
			this.options.desktopBodySignalClass
		);

		document.body.classList.toggle( bodySignalClass, shouldBeActive );

		document
			.querySelectorAll( `${ this.options.openSelector }, ${ this.options.closeSelector }` )
			.forEach( ( $button ) => {
				$button.classList.toggle( this.options.activeClass, shouldBeActive );

				$button.setAttribute( 'aria-expanded', shouldBeActive ? 'true' : 'false' );
			} );

		if ( shouldBeActive ) {
			this.attachOutsideClick();
		} else {
			this.detachOutsideClick();
		}

		this.dispatchEvent( shouldBeActive ? 'cet-burger-opening' : 'cet-burger-closing', {
			element: $openButton || $closeButton,
			shouldBeActive,
			bodySignalClass,
		} );
	},

	attachOutsideClick() {
		if ( ! this.options.navSelector ) {
			return;
		}

		this.outsideClickHandler = ( e ) => {
			if ( ! e.target.closest( this.options.navSelector ) ) {
				this.reset();
				this.dispatchEvent( 'cet-burger-closing', {
					element: e.target,
					shouldBeActive: false,
					bodySignalClass: this.getBodySignalClass(),
				} );
			}
		};

		document.addEventListener( 'click', this.outsideClickHandler );
	},

	detachOutsideClick() {
		if ( this.outsideClickHandler ) {
			document.removeEventListener( 'click', this.outsideClickHandler );
			this.outsideClickHandler = null;
		}
	},

	dispatchEvent( eventName, data = {} ) {
		const event = new CustomEvent( eventName, {
			detail: { ...data },
			bubbles: true,
			cancelable: false,
		} );

		document.dispatchEvent( event );
	},

	calculateAdminBarHeight() {
		calculateAdminBarHeight();
	},
};

export { hamburgerMenuHandler };
