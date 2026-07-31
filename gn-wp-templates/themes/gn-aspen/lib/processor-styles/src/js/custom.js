import pageLoader from "./page-loader";
import { sapphireHeaderInit } from "./sapphire-header";

function domReady( fn ) {
  // If script loads early
  document.addEventListener( "DOMContentLoaded", fn );
  // If script loads normally
  if ( document.readyState === "interactive" || document.readyState === "complete" ) {
      fn();
  }
}

function bodyExists( fn ) {
  var intervalId = window.setInterval( () => {
    if (document.getElementsByTagName('body')[0] !== undefined) {
      window.clearInterval(intervalId);
      fn();
    }
  }, 250);
}

domReady( () => {
  sapphireHeaderInit();
  
  // Make sure that page loader is run if it failed to run earlier
  setTimeout( () => {
    if ( document.querySelector( '.preloader' ).hasChildNodes() ) {
      pageLoader();
    }
  }, 3000 );
} );

bodyExists( function() {
  pageLoader();
} );


