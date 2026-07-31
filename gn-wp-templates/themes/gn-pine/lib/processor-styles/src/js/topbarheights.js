export default function topBarHeights() {
    const siteHeader = document.querySelector( '.site-header' );
    const topBar = document.querySelector( '.top-bar' );
    const topBarHeight = topBar.childNodes[0].offsetHeight;
    siteHeader.style.setProperty( '--top-bar-height', topBarHeight + "px" );
}