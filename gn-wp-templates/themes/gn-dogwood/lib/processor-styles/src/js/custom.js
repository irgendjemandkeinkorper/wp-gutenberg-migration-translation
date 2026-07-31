import buttonArrow from "./buttonarrow";
import importantHeights from "./importantheights";
import scrollToContent from "./scrolltocontent";

function domReady( fn ) {
    // If script loads early
    document.addEventListener( "DOMContentLoaded", fn );
    // If script loads normally
    if ( document.readyState === "interactive" || document.readyState === "complete" ) {
        fn();
    }
}

domReady( function() {
    buttonArrow();
    importantHeights();
    scrollToContent();
});

// Document Ready Event Listeners
domReady( function() {
    //document.addEventListener( "DOMContentLoaded", buttonArrow );
}  );