/**
 * Legacy RKV/Members sidebar accordion toggle.
 *
 * Handles the mobile show/hide for the members sidebar. The old theme used
 * Bootstrap collapse JS; this replaces it without that dependency.
 *
 * Bound to data attributes so CSS selectors and JS hooks stay decoupled.
 */

const TOGGLE_SELECTOR = '[data-rkv-sidebar-toggle]',
	WRAP_SELECTOR = '[data-rkv-sidebar-wrap]',
	OPEN_CLASS = 'is-open',
	initRkvSidebar = () => {
		const button = document.querySelector( TOGGLE_SELECTOR );

		if ( ! button ) {
			return;
		}

		const wrap = document.querySelector( WRAP_SELECTOR );

		if ( ! wrap ) {
			return;
		}

		button.addEventListener( 'click', () => {
			const isExpanded = button.getAttribute( 'aria-expanded' ) === 'true';
			button.setAttribute( 'aria-expanded', String( ! isExpanded ) );
			wrap.classList.toggle( OPEN_CLASS, ! isExpanded );
		} );
	};

if ( document.readyState === 'loading' ) {
	document.addEventListener( 'DOMContentLoaded', initRkvSidebar );
} else {
	initRkvSidebar();
}
