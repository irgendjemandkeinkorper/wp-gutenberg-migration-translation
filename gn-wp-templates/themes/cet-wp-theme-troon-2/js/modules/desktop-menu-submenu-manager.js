class DesktopMenuSubMenuManager {
	constructor( options = {} ) {
		this.options = {
			menuContainerSelector: '[data-menu="primary"]',
			rootItemSelector: '.-root-level.menu-item-has-children',
			midItemSelector: '.-mid-level.menu-item-has-children',
			openClass: 'is-opened',
			...options,
		};

		this.rootItems = [];
		this.midItems = [];

		this.onRootMouseLeave = this.onRootMouseLeave.bind( this );
		this.onMidLinkClick = this.onMidLinkClick.bind( this );
	}

	init() {
		const container = document.querySelector( this.options.menuContainerSelector );
		if ( ! container ) {
			return;
		}

		this.rootItems = Array.from(
			container.querySelectorAll( this.options.rootItemSelector )
		);

		this.rootItems.forEach( ( item ) => {
			item.addEventListener( 'mouseleave', this.onRootMouseLeave );
		} );

		this.midItems = Array.from(
			container.querySelectorAll( this.options.midItemSelector )
		);

		this.midItems.forEach( ( item ) => {
			const link = item.querySelector( ':scope > a' );
			if ( link ) {
				link.addEventListener( 'click', this.onMidLinkClick );
			}
		} );
	}

	destroy() {
		this.rootItems.forEach( ( item ) => {
			item.removeEventListener( 'mouseleave', this.onRootMouseLeave );
		} );

		this.midItems.forEach( ( item ) => {
			const link = item.querySelector( ':scope > a' );
			if ( link ) {
				link.removeEventListener( 'click', this.onMidLinkClick );
			}
		} );

		this.rootItems = [];
		this.midItems = [];
	}

	onRootMouseLeave( e ) {
		// Reset all mid-level open state so the next visit starts fresh.
		e.currentTarget.querySelectorAll( this.options.midItemSelector ).forEach( ( mid ) => {
			mid.classList.remove( this.options.openClass );
		} );
	}

	onMidLinkClick( e ) {
		// Guard: mid-level items with children act as toggles, not navigation links.
		e.preventDefault();

		const item = e.currentTarget.closest( this.options.midItemSelector );
		if ( ! item ) {
			return;
		}

		item.classList.toggle( this.options.openClass );
	}
}

export { DesktopMenuSubMenuManager };
