import { subscribe, select } from '@wordpress/data';

function getCartSelector() {
	if ( ! window.wc?.wcBlocksData?.cartStore ) {
		return null;
	}
	return select( window.wc.wcBlocksData.cartStore );
}

function updateHeaderCount() {
	const selector = getCartSelector();
	if ( ! selector?.getCartData ) {
		return;
	}

	const cart = selector.getCartData();
	const countElements = document.querySelectorAll( '.cart-count' );
	if ( ! cart || ! countElements.length ) {
		return;
	}

	const count = cart.itemsCount || 0;

	countElements.forEach( ( el ) => {
		el.textContent = count || '';
		el.classList.toggle( 'is-empty', count === 0 );
		el.setAttribute( 'aria-hidden', count ? 'false' : 'true' );
	} );
}

const readyInterval = setInterval( () => {
	clearInterval( readyInterval );
	updateHeaderCount();

	let lastCount = null;
	subscribe( () => {
		const selector = getCartSelector();
		if ( ! selector?.getCartData ) {
			return;
		}
		const data = selector.getCartData();
		if ( ! data ) {
			return;
		}
		const current = data.itemsCount || 0;
		if ( current !== lastCount ) {
			lastCount = current;
			updateHeaderCount();
		}
	} );
}, 100 );
