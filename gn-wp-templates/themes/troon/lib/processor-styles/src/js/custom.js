import knowOffcanvas from "./boostrapjerryrig";
import importantHeights from "./importantheights";
import removeLoader from "./loader";

function domReady( fn ) {
    // If script loads early
    document.addEventListener( "DOMContentLoaded", fn );
    // If script loads normally
    if ( document.readyState === "interactive" || document.readyState === "complete" ) {
        fn();
    }
}

domReady( function() {
    knowOffcanvas();
    importantHeights();
    removeLoader();
});

// Document Ready Event Listeners
domReady( function() {

}  );