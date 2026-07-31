function domReady(fn) {
    // If script loads early
    document.addEventListener("DOMContentLoaded", fn);
    // If script loads normally
    if (document.readyState === "interactive" || document.readyState === "complete" ) {
        fn();
    }
}

// Header Updates
const stickyHeaderHeightEvents = function() {
    const siteHeader = document.querySelector(".site-header");
    const headerHeight = siteHeader.childNodes[0].offsetHeight;
    siteHeader.style.setProperty('--header-height', headerHeight + "px");

    const offset = siteHeader.offsetTop;

    if (document.documentElement.scrollTop > offset) {
        siteHeader.classList.add('sticky');
    } else {
        siteHeader.classList.remove('sticky')
    }
};
// End Header Updates

// Remove social links styling from before menu
const setSocialLinksStyle = function() {
    const socialLinks = document.querySelector('.before-header .wp-block-social-links');

    if (socialLinks && document.querySelector("body:not(.before-social-normal)")) {
        socialLinks.classList.add("is-style-logos-only");
    }
}

domReady(function() {
    // This fixes some issues with slower loading templates
    stickyHeaderHeightEvents();
    setTimeout(stickyHeaderHeightEvents, 600);

    setSocialLinksStyle();
});


// Document Ready Event Listeners
domReady(function() {
    document.addEventListener('scroll', stickyHeaderHeightEvents, false);
}  );