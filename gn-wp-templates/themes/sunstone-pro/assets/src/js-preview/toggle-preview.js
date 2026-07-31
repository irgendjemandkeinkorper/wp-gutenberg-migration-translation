const api = wp.customize;

window.addEventListener('DOMContentLoaded', () => {
	const body = document.querySelector( 'body' );

	api( 'sunstone_pro_logo_toggle', function( value ) {
		value.bind( function( to ) {
			if ( ! to && body.classList.contains( 'home' ) ) {
				body.classList.remove( 'logo-hidden' );
			} else {
				body.classList.add( 'logo-hidden' );
			}
		} )
	} )
});