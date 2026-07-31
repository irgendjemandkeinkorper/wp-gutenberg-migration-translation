jQuery(function( $ ){
	
	/***Scroll To Top ***/
	
	var scrollTop = $(".scrollTop");

	$(window).scroll(function() {
		// declare variable
		var topPos = $(this).scrollTop();

		// if user scrolls down - show scroll to top button
		if (topPos > 100) {
		$(scrollTop).css("opacity", "1");

		} else {
		$(scrollTop).css("opacity", "0");
		}

	}); // scroll END

	//Click event to scroll to top
	$(scrollTop).click(function() {
		
		$('html, body').animate({
		scrollTop: 0
		}, 800);
		return false;

	});
	
});