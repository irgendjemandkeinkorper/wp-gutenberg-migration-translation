import React from 'react';
import * as ReactDOM from 'react-dom';

const endScrollToTop = new Event( 'ScrollToTop::End' )

function ReturnToTopButton( props ) {

    const handleClickEvent = function( event ) {
        const topAnchor = document.querySelector( event.currentTarget.attributes.target.value );

        topAnchor.scrollIntoView( { behavior: "smooth" } );

        // I don't like having to figure how promises work
        // So instead this checks every 100ms if scrolling has finished
        // Then focuses on the button target
        // This is so that there's a smooth scroll transition
        // It removes the event listener so that it doesn't constantly focus on that item
        let scrollTimeout;
        // This makes it possible to find the specific event to remove
        const handleScrollTimeoutEvent = ( event ) => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(function() {
                dispatchEvent( endScrollToTop );
            }, 100);
        }

        addEventListener( 'scroll', handleScrollTimeoutEvent );
        addEventListener( 'ScrollToTop::End', ( event ) => {
            topAnchor.focus();

            removeEventListener( 'scroll', handleScrollTimeoutEvent );
        } );
    }

    return (
        <button 
            className='return-to-top-button'
            onClick={ handleClickEvent }
            target='#first-skip-link'
            >
            <span className='dashicons dashicons-arrow-up-alt2'></span>
        </button>
    );
}

const returnToTopButton = function() {
    let rTTB = document.querySelector( '.return-to-top-button__container' );
    let topAnchor = document.querySelector( '.genesis-skip-link a' );

    topAnchor.setAttribute( 'id', 'first-skip-link' );

    ReactDOM.render( <ReturnToTopButton />, rTTB );
}

export { returnToTopButton };

export default returnToTopButton;