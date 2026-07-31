export default function importantHeights() {
    const siteHeader = document.querySelector( '.site-header' );
    const topBar = document.querySelector( '.top-bar' );

    if ( topBar !== null && siteHeader !== null ) {
        const topBarHeight = topBar.childNodes[0].offsetHeight;
        siteHeader.style.setProperty( '--top-bar-height', topBarHeight + "px" );
    }
}