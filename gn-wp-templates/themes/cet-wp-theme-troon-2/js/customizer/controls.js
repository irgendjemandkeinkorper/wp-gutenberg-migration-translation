/**
 * Customizer controls JS.
 *
 * Handles multi-checkbox control synchronization via event delegation.
 */

document.addEventListener( 'change', ( event ) => {
	if (
		! event.target.matches(
			'[data-cet-control="multi-checkbox"] input[type="checkbox"]'
		)
	) {
		return;
	}

	const container = event.target.closest(
		'[data-cet-control="multi-checkbox"]'
	);

	if ( ! container ) {
		return;
	}

	const hidden = container.querySelector(
		'input[data-cet-multi-checkbox-value]'
	);
	const checkboxes = container.querySelectorAll( 'input[type="checkbox"]' );
	const settingId = container.getAttribute( 'data-cet-setting-id' );

	if ( ! hidden || ! checkboxes.length ) {
		return;
	}

	const selected = [];

	checkboxes.forEach( ( checkbox ) => {
		if ( checkbox.checked ) {
			selected.push( checkbox.value );
		}
	} );

	const value = selected.join( ',' );

	hidden.value = value;

	hidden.dispatchEvent( new Event( 'input', { bubbles: true } ) );
	hidden.dispatchEvent( new Event( 'change', { bubbles: true } ) );

	if (
		settingId &&
		window.wp &&
		wp.customize &&
		wp.customize.has( settingId )
	) {
		wp.customize( settingId ).set( value );
	}
} );