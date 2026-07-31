function sapphireHeaderScroll() {
    const { header } = this;

    if ( header.dataset.themeHeader ) {

        const data = JSON.parse( header.dataset.themeHeader );

        if ( header.classList.contains( data.bg.stuck ) && document.documentElement.scrollTop > header.getBoundingClientRect().top ) {
            header.classList.remove( data.navbar.stuck );
            header.classList.remove( data.bg.stuck );
            header.classList.remove( data.translucent.stuck );
            header.classList.add( data.navbar.sticky );
            header.classList.add( data.bg.sticky );
            header.classList.add( data.translucent.sticky );
        }
    }
}

function sapphireHeaderUnScroll() {
    const { header } = this;

    if ( header.dataset.themeHeader ) {
        const data = JSON.parse( header.dataset.themeHeader );

        if ( header.classList.contains( data.bg.sticky ) ) {
            header.classList.add( data.navbar.stuck );
            header.classList.add( data.bg.stuck );
            header.classList.add( data.translucent.stuck );
            header.classList.remove( data.navbar.sticky );
            header.classList.remove( data.bg.sticky );
            header.classList.remove( data.translucent.sticky );
        }
    }
}

export function sapphireHeaderInit() {
    const header = document.querySelector( ".navbar" );
    
    const headerScroll = {
        handleEvent: sapphireHeaderScroll,
        header: header,
    };
    
    const headerUnScroll = {
        handleEvent: sapphireHeaderUnScroll,
        header: header,
    };

    headerScroll.handleEvent();
    document.addEventListener( 'nbcsn::theme::scrolled', headerScroll );
    document.addEventListener( 'nbcsn::theme::unscrolled', headerUnScroll );
}