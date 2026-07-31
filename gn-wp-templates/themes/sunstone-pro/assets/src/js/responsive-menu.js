// I don't want to destroy someone elses code even though bootstrap should handle this better
window.addEventListener('DOMContentLoaded', () => {
	const responsiveButton = document.createElement( 'button' );
	const menuID           = 'genesis-nav-primary';
	const navMenu          = document.getElementById( menuID );
	const subMenus         = navMenu.querySelectorAll( 'ul.sub-menu' );
	const subMenuButtons   = [];
	const hideMenu         = el => {
		el.setAttribute( 'aria-expanded', 'false' );
		el.setAttribute( 'aria-pressed', 'false' );
	}
	const showMenu         = el => {
		el.setAttribute( 'aria-expanded', 'true' );
		el.setAttribute( 'aria-pressed', 'true' );
	}
	const buttonClick      = e => {
		e.preventDefault();

		const button  = e.target;
		const visible = button.getAttribute( 'aria-expanded' ) === 'true';

		for (let i = 0; i < subMenuButtons.length; i++) {
			hideMenu( subMenuButtons[i] );
		}

		if ( visible ) {
			hideMenu( button );
		} else {
			showMenu( button );
		}
	}

	responsiveButton.classList.add( 'menu-toggle', 'dashicons-before', 'dashicons-menu' );
	responsiveButton.setAttribute( 'aria-expanded', 'false' );
	responsiveButton.setAttribute( 'aria-pressed', 'false' );
	responsiveButton.setAttribute( 'aria-controls', menuID );
	responsiveButton.setAttribute( 'aria-label', 'Toggle Menu' );

	navMenu.classList.add( 'genesis-responsive-menu' );

	navMenu.parentNode.insertBefore( responsiveButton, navMenu );

	responsiveButton.addEventListener( 'click', buttonClick );

	for (let i = 0; i < subMenus.length; i++) {
		const subMenu = subMenus[i];
		const parent  = subMenu.parentNode;
		const id      = parent.getAttribute( 'id' ) + 'sub';
		const button  = document.createElement( 'button' );

		subMenuButtons.push( button );
		subMenu.setAttribute( 'id', id );

		button.classList.add( 'sub-menu-toggle', 'dashicons-before', 'dashicons-arrow-down-alt2' );
		button.setAttribute( 'aria-expanded', 'false' );
		button.setAttribute( 'aria-pressed', 'false' );
		button.setAttribute( 'aria-controls', id );
		button.setAttribute( 'aria-label', 'Toggle Menu' );

		parent.insertBefore( button, subMenu );

		button.addEventListener( 'click', buttonClick );
	}
});
