export default function buttonArrow() {
    const nodeList = document.querySelectorAll(".wp-block-button__link");

    if ( nodeList.length > 0 ) {
        for (let i = 0; i < nodeList.length; i++) {
            const firstTextNode = nodeList[i].firstChild,
            newSpan = document.createElement('span');

            // Append "Lorem Ipsum" text to new span:
            newSpan.appendChild( document.createTextNode(firstTextNode.nodeValue) );

            // Replace old text node with new span:
            nodeList[i].replaceChild( newSpan, firstTextNode );
        }
    }
}