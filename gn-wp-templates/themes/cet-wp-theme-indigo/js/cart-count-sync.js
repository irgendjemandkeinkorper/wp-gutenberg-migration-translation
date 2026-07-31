( function( window ) {
	function getSelectors() {
		const cartStore = ( function() {
			if ( ! window.wp || ! window.wp.data || ! window.wc || ! window.wc.wcBlocksData ) {
				return null;
			}
			return window.wc.wcBlocksData.cartStore || null;
		} )();
		return cartStore ? window.wp.data.select( cartStore ) : null;
	}

	function updateHeaderCount() {
		const selector = getSelectors();
		if ( ! selector || ! selector.getCartData ) {
			return;
		}

		const cart = selector.getCartData();
		const countElement = document.querySelector( '.cart-count' );
		if ( ! cart || ! countElement ) {
			return;
		}

		const count = cart.itemsCount || 0,
			icon = document.querySelector( '.header-cart .material-symbols-outlined' );

		countElement.textContent = count;
		countElement.classList.toggle( 'is-empty', count === 0 );
		countElement.setAttribute( 'aria-hidden', count ? 'false' : 'true' );
		icon.textContent = ( count ? 'add_' : '' ) + 'shopping_cart';
	}
	const readyInterval = setInterval( function() {
		// Initial render
		clearInterval( readyInterval );
		updateHeaderCount();

		// Re-render whenever the cart store changes
		let lastCount = null;
		window.wp.data.subscribe( function() {
			const sel = getSelectors(),
				data = sel.getCartData(),
				current = data.itemsCount || 0;
			if ( ! sel || ! sel.getCartData || ! data ) {
				return;
			}
			if ( current !== lastCount ) {
				lastCount = current;
				updateHeaderCount();
			}
		} );
	}, 100 );
} )( window );
