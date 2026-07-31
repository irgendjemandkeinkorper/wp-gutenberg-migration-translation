import "./bootstrap/menu-jerryrig";
import './ghostkit-tabs-a11y';

function domReady(fn) {
    // If script loads early
    document.addEventListener("DOMContentLoaded", fn);
    // If script loads normally
    if (document.readyState === "interactive" || document.readyState === "complete") {
        fn();
    }
}

domReady(function () {
});