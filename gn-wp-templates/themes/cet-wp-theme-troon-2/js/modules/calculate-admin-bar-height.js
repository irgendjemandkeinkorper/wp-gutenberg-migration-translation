const calculateAdminBarHeight = () => {
	const wpAdminBar = document.getElementById( 'wpadminbar' );
	if ( wpAdminBar ) {
		wpAdminBar.style.position = 'fixed';
		const htmlMarginTop =
			parseFloat( getComputedStyle( document.documentElement ).marginTop ) || 0;
		if ( htmlMarginTop < wpAdminBar.offsetHeight ) {
			document.documentElement.style.marginTop =
				`${ wpAdminBar.offsetHeight }px !important`.trim();
		}
	}

	document.body.style.setProperty(
		'--admin-bar-height',
		wpAdminBar ? `${ wpAdminBar.offsetHeight }px` : '0px'
	);
};

export { calculateAdminBarHeight };
