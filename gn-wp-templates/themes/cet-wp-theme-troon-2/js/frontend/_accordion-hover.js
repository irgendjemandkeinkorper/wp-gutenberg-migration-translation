/**
 * Handles hover/focus accordion behavior for the Module One Asset block.
 */

const BLOCK_SELECTOR = ':is([data-cet-block="module-one-asset"], [data-cet-entity="module-one-asset"])',
	ACCORDION_PART = ':is([data-cet-block-part="accordion"], [data-cet-part="accordion"])',
	DESKTOP_QUERY = '(hover: hover) and (pointer: fine)',
	OPEN_DELAY = 200,
	initAccordionHover = () => {
		const blocks = document.querySelectorAll( BLOCK_SELECTOR );

		if ( ! blocks.length ) {
			return;
		}

		const mediaQuery = window.matchMedia( DESKTOP_QUERY );

		blocks.forEach( ( block ) => {
			const accordions = Array.from( block.querySelectorAll( ACCORDION_PART ) );

			if ( ! accordions.length ) {
				return;
			}

			let activeAccordion = null,
				openTimer = null;

			const clearOpenTimer = () => {
					window.clearTimeout( openTimer );
				},
				closeActiveAccordion = () => {
					if ( activeAccordion ) {
						activeAccordion.removeAttribute( 'open' );
						activeAccordion = null;
					}
				},
				openAccordion = ( accordion ) => {
					if ( ! mediaQuery.matches ) {
						return;
					}

					clearOpenTimer();

					openTimer = window.setTimeout( () => {
						if ( activeAccordion && activeAccordion !== accordion ) {
							activeAccordion.removeAttribute( 'open' );
						}

						accordion.setAttribute( 'open', '' );
						activeAccordion = accordion;
					}, OPEN_DELAY );
				};

			accordions.forEach( ( accordion ) => {
				// Enforce one-open-at-a-time for every open mechanism (hover, click, keyboard).
				accordion.addEventListener( 'toggle', () => {
					if ( ! accordion.open ) {
						if ( activeAccordion === accordion ) {
							activeAccordion = null;
						}
						return;
					}

					accordions.forEach( ( other ) => {
						if ( other !== accordion && other.open ) {
							other.removeAttribute( 'open' );
						}
					} );

					activeAccordion = accordion;
				} );

				accordion.addEventListener( 'mouseenter', () => openAccordion( accordion ) );
				accordion.addEventListener( 'focusin', () => openAccordion( accordion ) );
			} );

			// Block-level listeners attached once per block, not once per accordion.
			block.addEventListener( 'mouseleave', () => {
				clearOpenTimer();
				closeActiveAccordion();
			} );

			block.addEventListener( 'focusout', ( event ) => {
				if ( ! block.contains( event.relatedTarget ) ) {
					clearOpenTimer();
					closeActiveAccordion();
				}
			} );
		} );
	};

if ( document.readyState === 'loading' ) {
	document.addEventListener( 'DOMContentLoaded', initAccordionHover );
} else {
	initAccordionHover();
}
