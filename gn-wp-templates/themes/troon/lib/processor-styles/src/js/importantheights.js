
export default function importantHeights() {
    const container = document.querySelector( '.site-container' );
    const topBar = document.querySelector( '.top-bar' );

    if ( topBar !== null ) {
        container.style.setProperty( '--top-bar-height', topBar.offsetHeight + 'px' );
    }
}