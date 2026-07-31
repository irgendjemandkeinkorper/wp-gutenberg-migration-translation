import { stickyHeaderHeightEvents } from "./header";
import returnToTopButton, { ReturnToTopButton } from './return-to-top';
// import { createNavOverflow } from "./navigation";
// import { breadcrumbAdjustment, breadcrumbToggle } from "./breadcrumbs";
// import { doParallax } from "./parallax";
// import { printThisPage } from "./print-page";
// import { rosterAccordionFunctionality } from "./roster";

function domReady( fn ) {
    // If script loads early
    document.addEventListener( "DOMContentLoaded", fn );
    // If script loads normally
    if ( document.readyState === "interactive" || document.readyState === "complete" ) {
        fn();
    }
}

const elementMovement = function() {
    // This fixes some issues with slower loading templates
    stickyHeaderHeightEvents();
    setTimeout( stickyHeaderHeightEvents, 600 );

    // createNavOverflow();
    // breadcrumbAdjustment();
}

domReady( function() {
    elementMovement();
    returnToTopButton();
    // rosterAccordionFunctionality();
});


// Document Ready Event Listeners
domReady( function() {
    document.addEventListener( 'scroll', stickyHeaderHeightEvents, false );
    // document.addEventListener( 'scroll', doParallax, false );
    // document.addEventListener( 'click', breadcrumbToggle, false );
    // document.addEventListener( 'click', printThisPage, false );
}  );