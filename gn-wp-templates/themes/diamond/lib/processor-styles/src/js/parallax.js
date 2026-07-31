// This is a generic function that will add a parallax variable to the paraent of an element
// The height of the element
const parallaxMovement = function( element, parent = null ) {
    // Security against bad calls
    if ( element ) {
        let elemHeight = element.clientHeight;
        let parentHeight = 0, parentElem;
    
        if ( parent === null ) {
            parentElem = element.offsetParent;
            parentHeight = parentElem.clientHeight;
        } else {
            parentElem = parent;
            parentHeight = parent.clientHeight;
        }
    
        // Only work if element parent is smaller than parent so weird movement otherwise doesn't happen
        let movement = 0;
        if ( elemHeight > parentHeight ) {
            // The transform is from the top of the parent
            // The transform should reach the bottom of the element 
            // by the time the top of the screen reaches the bottom of the parent
            let max_mov = elemHeight - parentHeight;
            if ( elemHeight > parentHeight + parentHeight ) {
                max_mov = elemHeight - ( parentHeight + parentHeight );
            }
            // Clamp the max value to 1 so it elem cannot move more than 100% of it's parent
            // I couldn't figure out the specifics of the math without adding another lerp
            let t = Math.min(document.documentElement.scrollTop / parentHeight, 1 );
            let bottomEdge = window.innerHeight + document.documentElement.scrollTop;
        
            if ( bottomEdge < parentElem.offsetTop ) {
                movement = 0;
            } else if ( document.documentElement.scrollTop > parentElem.offsetTop + parentHeight ) {
                movement = max_mov * -1;
            } else {
                movement = ( 1 - t ) * 0 + t * Math.abs( max_mov );
                // Inaccurate alternative equasion
                // movement = 0 + t * (Math.abs(max_mov) - 0);
            }
        } else {
            movement = 0;
        }
            
        parentElem.style.setProperty( '--parallax-movement', movement.toFixed( 4 ) * -1 + 'px' );
    }
}

// This is where we're defining what elements we want to target with parallax
const doParallax = function() {
    // Only allow parallax on desktop screen sizes
    // so we are less likely to fire this command on mobile devices
    if (window.innerWidth > 960 && document.querySelector(".entry-image, .theme-parallax")) {
        parallaxMovement(document.querySelector(".entry-image, .theme-parallax"));
    }
}

export { doParallax };