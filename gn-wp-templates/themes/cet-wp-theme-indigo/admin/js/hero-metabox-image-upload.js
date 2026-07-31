// Metabox is guaranteed to be one
jQuery( document ).ready( function( $ ) {
	let heroImageFrame;
	const $uploadButton = $('[data-hero-meta-upload-id="hero-image-upload"]');
	const $removeButton = $('[data-hero-meta-remove-id="hero-image-remove"]');
	const $imageValue = $('[data-hero-meta-value-id="hero_image"]');
	const $imagePreview = $('[data-hero-meta-preview-id="hero-image-preview"]');

	$uploadButton.on( 'click', function( e ) {
		e.preventDefault();

		if ( heroImageFrame ) {
			heroImageFrame.open();
			return;
		}

		heroImageFrame = wp.media( { multiple: false } );
		heroImageFrame.on( 'select', function() {
			const attachment = heroImageFrame.state().get( 'selection' ).first().toJSON();
			$imageValue.val(attachment.id);
			$imagePreview.attr('src', attachment.url).show();
			$removeButton.show();
		} );

		heroImageFrame.open();
	} );

	$removeButton.on( 'click', function( e ) {
		e.preventDefault();

		$imageValue.val('');
		$imagePreview.attr('src', '').hide();
		$removeButton.hide();
	} );
} );
