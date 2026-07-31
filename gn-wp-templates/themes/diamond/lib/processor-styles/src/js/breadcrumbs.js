// I'm going to modify the default breadcrumb functionality if the current location is within primary-navigation hierarchy
const breadcrumbAdjustment = function() {
    let breadcrumb = document.querySelector( ".breadcrumb > .site-inner" );     
    
    if ( breadcrumb ) {
        // The last item will always be the text that represents node for the current page 
        let currentPage = breadcrumb.childNodes[breadcrumb.childNodes.length - 1];
        let breadcrumbParent  = currentPage.parentElement;
    
        if ( document.querySelector( ".breadcrumb" ) && document.querySelector( ".menu-item.current-menu-parent" ) ) {
            let parentElem = document.querySelector( ".current-menu-item" ).parentElement;
    
            // This is to help with the top level navigation items
            if ( parentElem.className !== "wrap" ) {
                parentElem = parentElem.parentElement;
                currentPage.previousSibling;
    
                let currentPageSiblings = document.querySelectorAll( "#" + parentElem.id + " > .sub-menu > .menu-item > a" );
        
                currentPageSiblings.forEach( ( item ) => {
                    // These need to be in a span for simpler styling
                    let newElem = document.createElement( "span" );
                    newElem.classList.add( "breadcrumb-link-wrap" );
        
                    // So we don't have a link to the same page set up in the breadcrumbs
                    if ( item.innerText.toLowerCase() === currentPage.nodeValue.toLowerCase() ) {
                        newElem.classList.add( "current-location" );
                        newElem.append( currentPage );
                    } else {
                        newElem.append( item.cloneNode( true ) );
                    }

                    breadcrumbParent.append( newElem );
                    // Only add children relevant to the current page.
                    if ( item.innerText.toLowerCase() === currentPage.nodeValue.toLowerCase() ) {
                        breadcrumbHasChildren( item, currentPage );
                    }
                } );
            }
        } else {
            // We're using spans, and for some reason genesis wont let me put spans around the last item using filters
            // I'm in this headspace rightnow, so I'm doing it this way so I don't have to think about switching to PHP
            // This part exists for top level navigation items
            let newElem = document.createElement( "span" );
            newElem.classList.add( "breadcrumb-link-wrap" );
            newElem.classList.add( "current-location" );
    
            newElem.append( currentPage );
    
            breadcrumbParent.append( newElem );
    
            // We also need to figure out if this item has children that should be cloned here
            let menuSearch = document.querySelectorAll( ".nav-primary .genesis-nav-menu .menu-item a" );
            let sender;
            menuSearch.forEach( (item) => {
                if ( item.innerText.toLowerCase() === currentPage.nodeValue.toLowerCase() ) {
                    sender = item;
                }
            } );
    
            breadcrumbHasChildren( sender, currentPage )
        }

        breadcrumbOverflow( breadcrumb );
    }
}

const breadcrumbOverflow = ( breadcrumb ) => {
    // After we get everything, lets make sure that if the list is longer than the container can hold
    // We push what we can to some elipses as well
    // This has the added bonus of making it more clear which page we might be on.
    // Though if things are nested too much, this may make it hard to understand
    let breadcrumbWidth = breadcrumb.clientWidth;
    let overflowingWidth = 0;
    let hadChildren = false; // if we add an additional item to site-inner, we'll have to run the loop again

    // We'll need to use an array instead of a NodeList to properly check things
    let items = Array.prototype.slice.call( document.querySelectorAll( ".breadcrumb > .site-inner > *" ) );
    items.forEach( ( item, outsideIndex ) => {
        // This finds the font awesome icons, but says they're 0 width, so we're just using a magic number
        // We're assuming that these will be 8 px wide, but this won't always be true
        // This will still be more accurate than if it was 0
        // If it catches it as an SVG, then it'll just work normally
        let movable = true;
        let buttonWidth = 64 + 8;
        if ( item.classList.contains( "fas" ) && item.offsetWidth === 0 ) {
            overflowingWidth += 8;
            movable = false;
        } else if ( item.nodeName === "svg" ) {
            overflowingWidth += item.clientWidth;
            movable = false;
        } else if( item.classList.contains( "breadcrumb-dropdown" ) ) {
            // Do Nothing, this prevents the breadcrumb dropdown from being added to the total on multiple passthroughs
            overflowingWidth += item.offsetWidth;
        } else if ( item.classList.contains( "breadcrumb-child-container" ) && ! item.classList.contains( "split" ) ) {
            let insideWidth = 0;
            let insideItems = item.querySelectorAll( ".breadcrumb-link-wrap" );

            // We're cloning the node early so we can simplify this process
            let newContainer = item.cloneNode( true );
            newContainer.classList.add( "split" );
            let newContainerNodes = newContainer.querySelectorAll( ".breadcrumb-link-wrap" );

            insideItems.forEach( ( insideItem, insideIndex ) => {
                // Overflow sometimes is miscalculated when children are involved
                if ( overflowingWidth + insideWidth + insideItem.offsetWidth + buttonWidth > breadcrumbWidth ) {
                    insideWidth += insideItem.offsetWidth + buttonWidth;
                } else {
                    insideWidth += insideItem.offsetWidth;
                }

                // Until we're wider than the breadcrumb container, we remove nodes from the clone.
                // Then when we're wider, we remove nodes from the original, 
                if ( insideWidth + overflowingWidth > breadcrumbWidth ) {
                    insideItem.remove();
                } else {
                    newContainerNodes[ insideIndex ].remove();
                }
            } );

            // If there are items in the new container left at the end, 
            // Then we add the clone to the items array in the next available spot
            if ( newContainer.childNodes.length > 0 ) {
                items.splice( outsideIndex + 1 , 0, newContainer );
            }

            if ( item.childNodes.length === 0 ) {
                movable = false;
            } else {
                overflowingWidth += item.offsetWidth;
            }
        } else if ( item.classList.contains( "breadcrumb-child-container" ) && item.classList.contains( "split" ) ) {
            breadcrumb.insertBefore( item, items[ outsideIndex + 1 ] );
            let createdItem = breadcrumb.querySelector( ".breadcrumb-child-container.split" );
            hadChildren = true;
            
            // Width calculatin bug fix for after the container is split
            if ( ( overflowingWidth + item.offsetWidth + buttonWidth ) > breadcrumbWidth ) {
                overflowingWidth += item.offsetWidth + buttonWidth;
            } else {
                overflowingWidth += item.offsetWidth;
            }
        } else {
            // Minor bug fix for items that are roughly the right width to push the overflow onto a new line
            if ( ( overflowingWidth + item.offsetWidth + buttonWidth ) > breadcrumbWidth ) {
                overflowingWidth += item.offsetWidth + buttonWidth;
            } else {
                overflowingWidth += item.offsetWidth;
            }
        }

        // Debugging
        // console.log( breadcrumbWidth );
        // console.log( overflowingWidth );
        // console.log( item );

        if ( overflowingWidth > breadcrumbWidth ) {
            if ( ! document.querySelector( ".breadcrumb .breadcrumb-dropdown" ) ) {
                // Like we did with the navigation, we're goint to create an overflow container
                // I'm goint to try to hack the genesis menu dropdowns to see if I trick it to work with that
                // Later we can use try to create our own unique dropdown functionality so we can have more functionality control

                let newElem = document.createElement( "span" );
                newElem.classList.add( "breadcrumb-link-wrap" );
                newElem.classList.add( "breadcrumb-dropdown" );
                newElem.innerHTML = `
                    <button class="breadcrumb-dropdown-button">
                        <span class="sr-only">More Items</span>
                        <span itemprop="name"><span class="fas fa-ellipsis-h"></span></span>
                    </button>
                    <div class="sub-menu"></div>
                `;

                breadcrumb.insertBefore( newElem, item );
            }

            if ( movable ) {
                breadcrumb.querySelector( ".breadcrumb-dropdown > .sub-menu" ).append( item );
            } else {
                item.remove();
            }
        }
    } );

    if ( hadChildren ) {
        breadcrumbOverflow( breadcrumb );
    }
}

const breadcrumbHasChildren = function( item, currentPage ) {
    let hasChildren = item.parentElement.querySelector( ".sub-menu" );

    if ( hasChildren ) {
        // It needs to be specific so it doesn't pull anything from the child elements of that item
        let children = document.querySelectorAll( "#" + item.parentElement.id + " > .sub-menu > .menu-item > a" );

        // We want to clone the children from the menu after the currently selected item
        let newContainer = document.createElement( "span" );
        newContainer.classList.add( "breadcrumb-child-container" );
        newContainer.setAttribute("data-parent-breadcrumb", item.innerText);

        // We'll also need to add some indicator that this is the children of this item
        let mainContainer = currentPage.parentElement.parentElement;

        // I named these after the direction they face, rather than the directino I want them to go
        let indicatorRight = document.createElement( "span" );
        indicatorRight.classList.add( "fas" );
        let indicatorLeft = indicatorRight.cloneNode( true );
        indicatorRight.classList.add( "fa-angle-right" );
        indicatorLeft.classList.add( "fa-angle-left" );

        mainContainer.append( indicatorRight );
        mainContainer.append( newContainer );
        mainContainer.append( indicatorLeft );

        children.forEach( ( child ) => {
            let newElem = document.createElement( "span" );
            newElem.classList.add( "breadcrumb-link-wrap" );
            newElem.append( child.cloneNode( true ) );

            newContainer.append( newElem );
        } );
    }
}

const breadcrumbToggle = function( event ) {
    if ( event.target.closest( ".breadcrumb-dropdown-button" ) ) {
        let targetParent = event.target.closest(".breadcrumb-dropdown-button").parentElement;
        let submenu = targetParent.querySelector( ".sub-menu" );

        // I'm using promises here because I've been meaning to learn how to use them for awhile
        // Using promises in this way can reduce the instances of graphical bugs that are encountered
        // When a user rapidly triggers something it should interupt the animation and reverse direction
        // without queueing the timouts to complete in a weird way.
        let togglePromise = new Promise( ( transitionTo, transitionAway ) => {
            if ( submenu.classList.contains( "active" ) ) {
                transitionAway( submenu )
            } else {
                transitionTo( submenu );
            }
        } );

        togglePromise
            .then( ( returnedSubmenu ) => {
                returnedSubmenu.classList.add( "active" );
                returnedSubmenu.classList.add( "transitioning" );
                setTimeout( () => {
                    returnedSubmenu.classList.remove( "transitioning" );
                }, 100 );
            }, ( returnedSubmenu ) => {
                returnedSubmenu.classList.add( "transitioning" );
                setTimeout( () => {
                    returnedSubmenu.classList.remove( "transitioning" );
                    returnedSubmenu.classList.remove( "active" );
                }, 100 );
            } );
    }
}

export { breadcrumbAdjustment, breadcrumbToggle };