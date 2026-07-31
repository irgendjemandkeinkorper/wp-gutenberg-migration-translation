

export default function knowOffcanvas() {
    let offcanvas = document.querySelector( '.offcanvas' );

    if ( offcanvas ) {
        let body = document.querySelector( 'body' );
        let html = document.querySelector( 'html' );
        let open = document.querySelector( '.navbar-toggler' );
    
        offcanvas.addEventListener( 'show.bs.offcanvas', _event => {
            open.setAttribute( 'aria-expanded', true );
            body.classList.add( 'transitioning' );
            body.classList.add( 'hello' );
            html.style.overflowX = 'hidden';
        } );
    
        offcanvas.addEventListener( 'shown.bs.offcanvas', _event => {
            body.classList.remove( 'transitioning' );
            offcanvas.focus();
        } );
    
        offcanvas.addEventListener( 'hide.bs.offcanvas', _event => {
            open.setAttribute( 'aria-expanded', false );
            body.classList.add( 'transitioning' );
            body.classList.remove( 'hello' );
        } );
    
        offcanvas.addEventListener( 'hidden.bs.offcanvas', _event => {
            body.classList.remove( 'transitioning' );
            html.style.overflowX = null;
        } );
    }
}