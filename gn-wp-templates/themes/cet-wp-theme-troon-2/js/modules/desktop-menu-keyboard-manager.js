class DesktopMenuKeyboardManager {
	constructor( options = {} ) {
		this.options = {
			menuContainerSelector: '[data-desktop-menu]',
			menuItemClass: 'menu-item',
			toggleSelector: '[data-submenu-toggle]',
			openClass: 'is-opened',
			...options,
		};

		this.onKeydown = this.onKeydown.bind( this );
	}

	init() {
		document.addEventListener( 'keydown', this.onKeydown );
	}

	destroy() {
		document.removeEventListener( 'keydown', this.onKeydown );
	}

	onKeydown( e ) {
		const $focused = document.activeElement;

		if ( 'Enter' === e.key && $focused.matches( this.options.toggleSelector ) ) {
			const $container = $focused.closest( this.options.menuContainerSelector );
			if ( ! $container ) {
				return;
			}

			e.preventDefault();
			this.toggle( $focused );
			return;
		}

		if ( 'Escape' === e.key ) {
			if ( $focused.matches( this.options.toggleSelector ) ) {
				const $menuItem = $focused.closest( `.${ this.options.menuItemClass }` );
				if ( $menuItem?.classList.contains( this.options.openClass ) ) {
					this.close( $focused, $menuItem );
					$focused.focus();
					return;
				}
			}

			const $openItem = $focused.closest(
				`.${ this.options.menuItemClass }.${ this.options.openClass }`
			);
			if ( $openItem ) {
				const $toggle = $openItem.querySelector(
					`:scope > ${ this.options.toggleSelector }`
				);
				$openItem.classList.remove( this.options.openClass );
				$toggle?.setAttribute( 'aria-expanded', 'false' );
				$toggle?.focus();
			}
		}
	}

	toggle( $button ) {
		const $menuItem = $button.closest( `.${ this.options.menuItemClass }` );
		if ( ! $menuItem ) {
			return;
		}

		const isOpen = $menuItem.classList.contains( this.options.openClass );
		if ( isOpen ) {
			this.close( $button, $menuItem );
		} else {
			this.open( $button, $menuItem );
		}
	}

	open( $button, $menuItem ) {
		$menuItem.classList.add( this.options.openClass );
		$button.setAttribute( 'aria-expanded', 'true' );
	}

	close( $button, $menuItem ) {
		$menuItem.classList.remove( this.options.openClass );
		$button.setAttribute( 'aria-expanded', 'false' );
	}
}

export { DesktopMenuKeyboardManager };
