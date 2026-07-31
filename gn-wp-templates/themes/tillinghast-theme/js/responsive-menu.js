jQuery(document).ready(function( $ ){
	
	$("header .genesis-nav-menu").addClass("responsive-menu").before('<div class="responsive-menu-icon"></div>');
    
    $(".responsive-menu-icon").click(function(){
    	$("header .genesis-nav-menu").slideToggle();
    });
	
	if(window.innerWidth < 1023 ) {
		$("header .genesis-nav-menu").removeClass("desktop-responsive-menu");
		$(".responsive-menu > .menu-item").removeClass("menu-open");
	}
	
	jQuery(".responsive-menu .menu-item.menu-item-has-children").click( function( e ){

		jQuery(this).find( '.sub-menu:first' ).slideToggle( function() {

			jQuery(this).parent().toggleClass("menu-open");
		});
		
		if( e.target !== this ) {
			return;
		}
	});

});