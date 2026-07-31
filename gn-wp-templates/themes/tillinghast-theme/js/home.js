jQuery(function( $ ){
	
	var navHeight = $('.site-header').outerHeight();
	var windowHeight = $( window ).height();

	$( '.image-section' ) .css({'height': windowHeight +'px'});

	$( window ).resize(function(){

		var windowHeight = $( window ).height();

		$( '.image-section' ) .css({'height': windowHeight +'px'});

	});
	
	var mobileHeight = windowHeight - navHeight;
	
	if(window.innerWidth < 1023) {
		$( '.image-section' ) .css({'height': mobileHeight +'px'});
	}

});