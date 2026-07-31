
// Header Updates
const stickyHeaderHeightEvents = function() {
    const siteHeader = document.querySelector(".site-header");
    const siteBody = document.querySelector("body");
    const headerHeight = siteHeader.childNodes[0].offsetHeight;
    siteHeader.style.setProperty('--header-height', headerHeight + "px");

    const offset = siteHeader.offsetTop;

    if (document.documentElement.scrollTop > offset) {
        siteHeader.classList.add('sticky');
        siteBody.classList.add('scrolled');
    } else {
        siteHeader.classList.remove('sticky');
        siteBody.classList.remove('scrolled');
    }
};

export { stickyHeaderHeightEvents };