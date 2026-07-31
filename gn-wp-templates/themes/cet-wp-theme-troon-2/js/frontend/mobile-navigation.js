import {
	hamburgerMenuHandler,
	MenuDropdownManager,
	DesktopMenuKeyboardManager,
	DesktopMenuSubMenuManager,
	logoScrollAnimation,
} from '../modules';

function cetTroon2MobileNavigationScript() {
	const primaryMenu = document.querySelector( '[data-menu="primary"]' ),
		mobileMenu = document.querySelector( '[data-menu="mobile"]' ),
		tertiaryMenu = document.querySelector( '[data-menu="tertiary"]' );

	if ( primaryMenu ) {
		const desktopMenuKeyboardManager = new DesktopMenuKeyboardManager( {
			menuContainerSelector: '[data-menu="primary"]',
		} );

		desktopMenuKeyboardManager.init();

		const desktopMenuSubMenuManager = new DesktopMenuSubMenuManager( {
			menuContainerSelector: '[data-menu="primary"]',
		} );

		desktopMenuSubMenuManager.init();

		// Disable default link behavior for root menu items with children in the primary menu, as they are not actual links but toggles for submenus.
		primaryMenu.addEventListener( 'click', ( e ) => {
			const $link = e.target.closest( 'a' );
			if ( $link && $link.parentElement.matches( '.-root-level.menu-item-has-children' ) ) {
				e.preventDefault();
			}
		} );
	}

	if ( mobileMenu ) {
		const mobileMenuDropdownManager = new MenuDropdownManager( {
			menuContainerSelector: '[data-menu="mobile"]',
		} );

		mobileMenuDropdownManager.init();

		document.addEventListener( 'cet-burger-opening', () => {
			mobileMenu.classList.add( 'is-active' );
		} );

		document.addEventListener( 'cet-burger-closing', () => {
			mobileMenu.classList.remove( 'is-active' );
			mobileMenuDropdownManager.reset();
		} );
	}

	if ( tertiaryMenu ) {
		const tertiaryMenuDropdownManager = new MenuDropdownManager( {
			menuContainerSelector: '[data-menu="tertiary"]',
			menuSelector: '.burger-nav__list-wrapper',
		} );

		tertiaryMenuDropdownManager.init();

		document.addEventListener( 'cet-burger-opening', () => {
			tertiaryMenu.classList.add( 'is-active' );
		} );

		document.addEventListener( 'cet-burger-closing', () => {
			tertiaryMenu.classList.remove( 'is-active' );
			tertiaryMenuDropdownManager.reset();
		} );
	}

	hamburgerMenuHandler.init(
		{ navSelector: '[data-menu="mobile"], [data-menu="tertiary"]' },
		{ lg: 1023 }
	);

	logoScrollAnimation.init();
}

document.addEventListener( 'DOMContentLoaded', cetTroon2MobileNavigationScript );
