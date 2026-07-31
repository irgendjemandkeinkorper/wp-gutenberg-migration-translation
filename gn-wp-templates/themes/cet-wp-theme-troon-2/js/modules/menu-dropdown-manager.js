class MenuDropdownManager {
	constructor( options = {} ) {
		this.options = {
			menuContainerSelector: '[data-menu]',
			menuSelector: '.menu',
			menuItemClass: 'menu-item',
			activeClass: 'active',
			allowMultipleOpen: false,
			...options,
		};

		this.onClick = this.onClick.bind( this );
		this.reset = this.reset.bind( this );
	}

	init() {
		this.onKeydown = this.onKeydown.bind( this );

		document.addEventListener( 'click', this.onClick );
		window.addEventListener( 'resize', this.reset );
		document.addEventListener( 'keydown', this.onKeydown );

		document.querySelectorAll( this.options.menuContainerSelector ).forEach( ( $container ) => {
			$container.querySelectorAll( '.sub-menu' ).forEach( ( $submenu ) => {
				$submenu.inert = true;
			} );
		} );
	}

	// TODO: Review and refactor to reduce complexity (currently 10, max 8)
	// eslint-disable-next-line complexity
	onKeydown( e ) {
		const $focused = document.activeElement;

		if ( 'Enter' === e.key && $focused.matches( '.submenu-toggle' ) ) {
			const $container = $focused.closest( this.options.menuContainerSelector );
			if ( ! $container ) {
				return;
			}

			e.preventDefault();
			this.activateToggleButton( $focused );
			return;
		}

		if ( 'Escape' === e.key ) {
			// Focus is on a toggle button — close its own submenu if open.
			if ( $focused.matches( '.submenu-toggle' ) ) {
				const $container = $focused.closest( this.options.menuContainerSelector );
				if ( ! $container ) {
					return;
				}

				const $menuItem = $focused.closest( `.${ this.options.menuItemClass }` ),
					$submenu = $menuItem?.querySelector( ':scope > .sub-menu.is-opened' );
				if ( $submenu ) {
					this.handle( $menuItem, $submenu );
					$focused.focus();
					return;
				}
			}

			// Focus is inside an open submenu — close it and return focus to its toggle.
			const $openSubmenu = $focused.closest( '.sub-menu.is-opened' );
			if ( $openSubmenu ) {
				const $container = $openSubmenu.closest( this.options.menuContainerSelector );
				if ( ! $container ) {
					return;
				}

				const $parentItem = $openSubmenu.parentElement,
					$toggleButton = $parentItem?.querySelector( ':scope > .submenu-toggle' );
				this.handle( $parentItem, $openSubmenu );
				$toggleButton?.focus();
				return;
			}

			this.reset();
		}
	}

	activateToggleButton( $button ) {
		const $menuItem = $button.closest( `.${ this.options.menuItemClass }` ),
			$submenu = $menuItem?.querySelector( ':scope > .sub-menu' );

		if ( $menuItem && $submenu ) {
			this.handle( $menuItem, $submenu );
		}
	}

	reset() {
		const $allMenus = document.querySelectorAll( this.options.menuContainerSelector );
		if ( $allMenus.length > 0 ) {
			$allMenus.forEach( ( $container ) => {
				const $menu = $container.querySelector( this.options.menuSelector );
				if ( ! $menu ) {
					return;
				}

				$menu.querySelectorAll( '.sub-menu.is-opened' ).forEach( ( $submenu ) => {
					$submenu.inert = true;
					$submenu.classList.remove( 'is-opened' );
					$submenu.style.maxHeight = '';
				} );

				const $activeItems = $menu.querySelectorAll(
					`.${ this.options.menuItemClass }.${ this.options.activeClass }`
				);
				$activeItems.forEach( ( $item ) => {
					$item.classList.remove( this.options.activeClass );
					this.dispatchEvent( 'cet-menu-dropdown-closing', {
						element: null,
						item: $item,
						menu: $menu,
					} );
				} );
			} );
		}
	}

	openSubmenu( $submenu ) {
		$submenu.inert = false;
		$submenu.classList.add( 'is-opened' );
		$submenu.style.maxHeight = $submenu.scrollHeight + 'px';

		const onEnd = () => {
			$submenu.style.maxHeight = 'none';
			$submenu.removeEventListener( 'transitionend', onEnd );
		};

		$submenu.addEventListener( 'transitionend', onEnd );
	}

	closeSubmenu( $submenu ) {
		$submenu.inert = true;
		$submenu.style.maxHeight = $submenu.scrollHeight + 'px';

		requestAnimationFrame( () => {
			$submenu.style.maxHeight = '0px';
		} );

		const onEnd = () => {
			$submenu.classList.remove( 'is-opened' );
			$submenu.removeEventListener( 'transitionend', onEnd );
		};

		$submenu.addEventListener( 'transitionend', onEnd );
	}

	closeNestedSubmenus( $item ) {
		$item.querySelectorAll( '.sub-menu.is-opened' ).forEach( ( $submenu ) => {
			this.closeSubmenu( $submenu );
		} );

		$item
			.querySelectorAll( `.${ this.options.menuItemClass }.${ this.options.activeClass }` )
			.forEach( ( $nestedItem ) => {
				$nestedItem.classList.remove( this.options.activeClass );
			} );
	}

	// TODO: Review and refactor to reduce complexity (currently 10, max 8)
	// eslint-disable-next-line complexity
	onClick( e ) {
		const $element = e.target,
			$menuContainer = $element.closest( this.options.menuContainerSelector ),
			$menuItem = $element.matches( `.${ this.options.menuItemClass }` )
				? $element
				: $element.closest( `.${ this.options.menuItemClass }`.trim() ),
			clickedInsideAnyMenu = $menuContainer && $menuItem;

		if ( ! clickedInsideAnyMenu ) {
			this.reset();
			return;
		}

		const $link = $element.closest( 'a' ),
			$submenu = $menuItem.querySelector( ':scope > .sub-menu' ),
			hasSubmenu = Boolean( $submenu );

		if (
			$link &&
			( ! $link.hasAttribute( 'href' ) || $link.getAttribute( 'href' ) === '#' || hasSubmenu )
		) {
			e.preventDefault();
		}

		if ( ! hasSubmenu ) {
			return;
		}

		const isActive = this.handle( $menuItem, $submenu );

		this.dispatchEvent( isActive ? 'cet-menu-dropdown-opening' : 'cet-menu-dropdown-closing', {
			element: $element,
			item: $menuItem,
			menu: $submenu,
		} );
	}

	handle( $currentItem, $submenu ) {
		if ( ! $currentItem || ! $submenu ) {
			return false;
		}

		const wasActive = $currentItem.classList.contains( this.options.activeClass ),
			shouldOpen = ! wasActive,
			$parentMenu = $currentItem.parentElement;

		if ( ! this.options.allowMultipleOpen && $parentMenu ) {
			const $siblingItems = [
				...$parentMenu.querySelectorAll(
					`:scope > .${ this.options.menuItemClass }`.trim()
				),
			].filter( ( $item ) => $item !== $currentItem );

			$siblingItems.forEach( ( $item ) => {
				$item.classList.remove( this.options.activeClass );
				this.closeNestedSubmenus( $item );

				const $siblingSubmenu = $item.querySelector( ':scope > .sub-menu' );

				if ( $siblingSubmenu && $siblingSubmenu.classList.contains( 'is-opened' ) ) {
					this.closeSubmenu( $siblingSubmenu );
				}
			} );
		}

		$currentItem.classList.toggle( this.options.activeClass, shouldOpen );

		if ( shouldOpen ) {
			this.openSubmenu( $submenu );
		} else {
			this.closeNestedSubmenus( $currentItem );
			this.closeSubmenu( $submenu );
		}

		return shouldOpen;
	}

	dispatchEvent( eventName, data = {} ) {
		const event = new CustomEvent( eventName, {
			detail: { ...data },
			bubbles: true,
			cancelable: true,
		} );
		document.dispatchEvent( event );
	}
}

export { MenuDropdownManager };
