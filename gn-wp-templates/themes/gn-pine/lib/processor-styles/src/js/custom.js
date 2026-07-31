import topBarHeights from "./topbarheights";

function domReady( fn ) {
    // If script loads early
    document.addEventListener( "DOMContentLoaded", fn );
    // If script loads normally
    if ( document.readyState === "interactive" || document.readyState === "complete" ) {
        fn();
    }
}

domReady( function() {
    topBarHeights();
});

// Document Ready Event Listeners
domReady( function() {

}  );