export default function scrollToContent() {
    var button = document.getElementById("scroll-to-content");
    var welcome = document.getElementById("dogwood-content-start");

    if ( button !== null ) {
        button.onclick = function() {
            welcome.scrollIntoView();
        };
    }
}