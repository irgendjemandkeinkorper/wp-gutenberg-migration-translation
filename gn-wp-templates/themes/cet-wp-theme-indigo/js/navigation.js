/**
 * File navigation.js.
 *
 * Handles toggling the navigation menu for small screens and enables
 * keyboard support for dropdown menus. Also controls the collapsible
 * header search form.
 */

( () => {
	/* =========================
	 * Utilities
	 * ========================= */
	const mqMobile = window.matchMedia( '(max-width: 1399px)' ),
		q = ( sel, root = document ) => root.querySelector( sel ),
		qa = ( sel, root = document ) => Array.from( root.querySelectorAll( sel ) ),

		setAriaExpanded = ( el, value ) => {
			if ( ! el ) {
				return;
			}
			el.setAttribute( 'aria-expanded', value ? 'true' : 'false' );
		},

		debounce = ( fn, wait = 150 ) => {
			let t;
			return ( ...args ) => {
				clearTimeout( t );
				t = setTimeout( () => fn.apply( null, args ), wait );
			};
		},

		/* =========================
         * Primary Navigation
         * ========================= */
		siteNavigation = document.querySelector( '[data-nav]' ),
		menuButton = siteNavigation.querySelector( '[data-toggle]' ),
		menu = siteNavigation.querySelector( 'ul' ),
		backButton = document.getElementById( 'back-button' );

	let isAdminBarCalculated = false;
	calculateAdminBarHeight();

	if ( siteNavigation && menuButton && menu ) {
		// Initial ARIA state
		setAriaExpanded( menuButton, false );

		document.addEventListener( 'click', ( e ) => {
			//toggle humburger
			if ( e.target.closest( '[data-toggle]' ) ) {
				if ( ! isAdminBarCalculated ) {
					calculateAdminBarHeight();
				}

				siteNavigation.classList.toggle( 'toggled' );
				document.body.classList.toggle( 'no-scroll' );

				const expanded = menuButton.getAttribute( 'aria-expanded' ) === 'true';
				setAriaExpanded( menuButton, ! expanded );
			}

			//toggle dropdown
			const a = e.target.closest( 'a' );
			if ( a ) {
				const li = a.closest( 'li.menu-item-has-children' );

				if ( li && a.parentElement === li ) {
					e.preventDefault();
					onToggleClick.call( li, e );
					return;
				}
			}

			// Click-away & back button behavior
			if ( mqMobile.matches ) {
				if ( backButton && backButton.contains( e.target ) ) {
					closeLastSubmenuLevel();
				}
			} else if ( ! menu.contains( e.target ) ) {
				closeAllSubmenus( null );
			}
		} );

		// ESC closes any open submenus
		document.addEventListener( 'keydown', ( e ) => {
			if ( e.key === 'Escape' ) {
				if ( ! siteNavigation || ! menu ) {
					return;
				}

				const hasOpenSubmenu = menu.querySelector( 'li.open' );
				if ( hasOpenSubmenu ) {
					closeLastSubmenuLevel();
				} else if ( siteNavigation.classList.contains( 'toggled' ) ) {
					siteNavigation.classList.remove( 'toggled' );
					document.body.classList.remove( 'no-scroll' );
					setAriaExpanded( menuButton, false );
				}
			}
		} );

		// Recalculate admin bar + close menu on desktop
		window.addEventListener( 'resize',
			debounce( () => {
				calculateAdminBarHeight(); // recalc on resize
				closeAllSubmenus( null );
				if ( ! mqMobile.matches ) {
					siteNavigation.classList.remove( 'toggled' );
					document.body.classList.remove( 'no-scroll' );
					setAriaExpanded( menuButton, false );
				}
			}, 150 )
		);
	}

	/**
	 * Toggle dropdowns
	 *
	 * @param  e
	 */
	function onToggleClick( e ) {
		e.preventDefault();
		const link = this.querySelector( ':scope > a' ),
			siblings = qa( ':scope > li', this.parentElement ).filter( ( el ) => el !== this ),
			willOpen = ! this.classList.contains( 'open' );

		if ( willOpen ) {
			if ( this.parentElement === menu ) {
				// --- TOP-LEVEL ITEM ---
				// Keep only this branch open, close everything else
				closeAllSubmenus( this );
			} else {
				// --- NESTED ITEM (submenu / subsubmenu) ---
				// Close only siblings at the same level (and their open descendants)
				for ( const sib of siblings ) {
					if ( sib.classList.contains( 'open' ) ) {
						sib.classList.remove( 'open' );

						const sibLink = sib.querySelector( ':scope > a' );
						if ( sibLink ) {
							setAriaExpanded( sibLink, false );
						}

						// Close any open submenus inside that sibling
						const nestedOpen = qa( 'li.open', sib );
						for ( const nested of nestedOpen ) {
							nested.classList.remove( 'open' );
							const nestedLink = nested.querySelector( ':scope > a' );
							if ( nestedLink ) {
								setAriaExpanded( nestedLink, false );
							}
						}
					}
				}
			}
		} else {
			// We are closing this item: also close all open descendants
			const openDescendants = qa( 'li.open', this );
			for ( const li of openDescendants ) {
				li.classList.remove( 'open' );
				const liLink = li.querySelector( ':scope > a' );
				if ( liLink ) {
					setAriaExpanded( liLink, false );
				}
			}
		} if ( willOpen ) {
			if ( this.parentElement === menu ) { // Top leve item
				closeAllSubmenus( this );
			} else {  // nested item
				for ( const sib of siblings ) {
					if ( sib.classList.contains( 'open' ) ) {
						sib.classList.remove( 'open' );

						const sibLink = sib.querySelector( ':scope > a' );
						if ( sibLink ) {
							setAriaExpanded( sibLink, false );
						}

						const nestedOpen = qa( 'li.open', sib );
						for ( const nested of nestedOpen ) {
							nested.classList.remove( 'open' );
							const nestedLink = nested.querySelector( ':scope > a' );
							if ( nestedLink ) {
								setAriaExpanded( nestedLink, false );
							}
						}
					}
				}
			}
		} else {
			const openDescendants = qa( 'li.open', this );
			for ( const li of openDescendants ) {
				li.classList.remove( 'open' );
				const liLink = li.querySelector( ':scope > a' );
				if ( liLink ) {
					setAriaExpanded( liLink, false );
				}
			}
		}

		this.classList.toggle( 'open', willOpen );
		if ( link ) {
			setAriaExpanded( link, willOpen );
		}

		if ( backButton ) {
			backButton.style.setProperty( 'display', willOpen ? 'flex' : 'none' );
		}

		if ( mqMobile.matches ) {
			for ( const sib of siblings ) {
				sib.classList.toggle( 'hidden', willOpen );
			}
		}
	}

	/**
	 * Close all open submenus, optionally preserving `exceptLi`.
	 *
	 * @param  exceptLi
	 */
	function closeAllSubmenus( exceptLi ) {
		if ( ! menu ) {
			return;
		}
		const openItems = qa( 'li.open', menu );

		for ( const li of openItems ) {
			if ( li === exceptLi ) {
				continue;
			}
			li.classList.remove( 'open' );
			const a = li.querySelector( ':scope > a' );
			if ( a ) {
				setAriaExpanded( a, false );
			}
		}

		const allItems = qa( 'li', menu );
		for ( const item of allItems ) {
			item.classList.remove( 'hidden' );
		}

		const backButton = document.getElementById( 'back-button' );
		if ( backButton ) {
			backButton.style.setProperty( 'display', 'none' );
		}
	}

	/**
	 * Close last submenu level on mobile
	 *
	 * @param  exceptLi
	 */

	function closeLastSubmenuLevel() {
		if ( ! menu ) {
			return;
		}

		const openItems = qa( 'li.open', menu );
		if ( ! openItems.length ) {
			return;
		}

		// The last one in DOM order is the deepest open item
		const target = openItems[ openItems.length - 1 ],

			toClose = [ target, ...qa( 'li.open', target ) ];

		for ( const li of toClose ) {
			li.classList.remove( 'open' );
			const link = li.querySelector( ':scope > a' );
			if ( link ) {
				setAriaExpanded( link, false );
			}
		}

		// On mobile: unhide siblings at this level
		if ( mqMobile.matches ) {
			const siblings = qa( ':scope > li', target.parentElement ).filter(
				( el ) => el !== target
			);
			for ( const sib of siblings ) {
				sib.classList.remove( 'hidden' );
			}
		}

		// Check if there are still any open submenus left
		const stillOpen = qa( 'li.open', menu );

		if ( backButton ) {
			if ( stillOpen.length ) {
				backButton.style.setProperty( 'display', 'flex' );
			} else {
				backButton.style.setProperty( 'display', 'none' );

				const allItems = qa( 'li', menu );
				for ( const item of allItems ) {
					item.classList.remove( 'hidden' );
				}
			}
		}
	}

	/**
	 * Calculate WP admin bar height and apply CSS var + margin-top.
	 */
	function calculateAdminBarHeight() {
		const wpAdminBar = document.getElementById( 'wpadminbar' );
		if ( wpAdminBar ) {
			const html = document.documentElement;
			// Set CSS var for use in styles
			document.body.style.setProperty( '--admin-bar-height', `${ wpAdminBar.offsetHeight }px` );
			// Ensure page content is pushed below admin bar
			html.style.setProperty( 'margin-top', `${ wpAdminBar.offsetHeight }px`, 'important' );
		} else {
			document.body.style.setProperty( '--admin-bar-height', '0px' );
		}
		isAdminBarCalculated = true;
	}

	/* =========================
	 * Header Search Form
	 * ========================= */
	qa( '.header-search-form' ).forEach( ( form ) => {
		const btn = q( '.search-submit', form ),
			input = q( '.search-field', form );

		if ( ! btn ) {
			return;
		}

		form.classList.add( 'is-collapsed' );
		setAriaExpanded( btn, false );

		// Expand on button click (first click only when collapsed)
		btn.addEventListener( 'click', ( e ) => {
			if ( form.classList.contains( 'is-collapsed' ) ) {
				e.preventDefault();
				form.classList.remove( 'is-collapsed' );
				setAriaExpanded( btn, true );
				if ( input ) {
					input.focus();
				}
			}
		} );

		// Collapse on ESC within the form
		form.addEventListener( 'keydown', ( e ) => {
			if ( e.key === 'Escape' || e.keyCode === 27 ) {
				form.classList.add( 'is-collapsed' );
				setAriaExpanded( btn, false );
				btn.focus();
			}
		} );

		// Click-away collapses the form
		document.addEventListener( 'click', ( e ) => {
			if ( ! form.contains( e.target ) ) {
				form.classList.add( 'is-collapsed' );
				setAriaExpanded( btn, false );
			}
		} );
	} );

	/* =========================
	 * Logic to change sticky header
	 * BG color on scroll
	 * ========================= */
	const ScrollManager = {
		// Configuration
		el: document.querySelector( '.site-header.sticky' ),
		threshold: 50,
		ticking: false,
		lastScrollY: 0,

		// The logic to update the UI
		updateUI() {
			this.el.classList.toggle( 'scrolled', this.lastScrollY > this.threshold );
			this.ticking = false;
		},

		// The scroll event handler
		onScroll() {
			this.lastScrollY = window.scrollY;

			if ( ! this.ticking ) {
				// Use bind(this) so 'this' inside updateUI still refers to ScrollManager
				window.requestAnimationFrame( this.updateUI.bind( this ) );
				this.ticking = true;
			}
		},

		// Entry point
		init() {
			if ( ! this.el ) return;
			window.addEventListener( 'scroll', () => this.onScroll(), { passive: true } );

			// Run once on load in case the user refreshes mid-page
			this.onScroll(); 
		}
	};

	ScrollManager.init();

} )();
