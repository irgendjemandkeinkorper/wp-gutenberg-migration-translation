// This adds the elipses at the end of the navigation
// when there are too many navigation items for a single row of navigaiton
const createNavOverflow = function() {
    let elem = document.querySelector( ".nav-primary .genesis-nav-menu" )
    let containerWidth = elem.clientWidth;
    let itemsWidth = 0;

    document.querySelectorAll( ".nav-primary .genesis-nav-menu > .menu-item" ).forEach( ( item ) => {
        itemsWidth += item.offsetWidth;

        // This gets the width of the navigation
        // When the total width of the navigation items exceeds the navigation
        // It moves them all into a special menu item just for them
        if ( itemsWidth > containerWidth ) {
            if ( !document.querySelector( ".nav-primary .overflow" ) ) {
                // Create the list item and its basic structure
                let newItem = document.createElement( "li" );
                newItem.classList.add( "overflow" );
                newItem.classList.add( "menu-item" )
                newItem.classList.add( "menu-item-has-children" );
                // We're using a button instead of a link here to more clearly indicate this has an inveractive purpose
                newItem.innerHTML = `
                    <button class="sf-with-ul">
                        <span class="sr-only">More Items</span>
                        <span class="fas fa-ellipsis-h"></span>
                    </button>
                    <ul class="sub-menu"></ul>
                `;

                elem.insertBefore( newItem, item );

                // If the width of the additional element exceeds the width of the navigation
                // then we'll have to remove the element before it so that it remains on one line

                if ( itemsWidth + newItem.offsetWidth > containerWidth ) {
                    let subMenu = document.querySelector( ".nav-primary .overflow > .sub-menu" );
                    subMenu.append( document.getElementById( newItem.previousElementSibling.id ) );
                }
            }

            document.querySelector( ".nav-primary .overflow > .sub-menu" ).append( item );
        }
    });
}

export { createNavOverflow };