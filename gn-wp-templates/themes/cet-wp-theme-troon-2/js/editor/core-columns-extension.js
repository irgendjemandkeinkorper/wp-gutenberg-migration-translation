import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody, RangeControl, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const CARD_STYLES = (
	window.cetTroon2Settings?.carouselStyles || [ 'big-cards', 'small-cards' ]
).map( ( style ) => `is-style-${ style }` );

function isCardStyle( className ) {
	return CARD_STYLES.some( ( style ) => className?.includes( style ) );
}

function addCarouselAttributes( settings, name ) {
	if ( name !== 'core/columns' ) {
		return settings;
	}

	return {
		...settings,
		attributes: {
			...settings.attributes,
			carousel: {
				type: 'boolean',
				default: false,
			},
			mobileOnlyCarousel: {
				type: 'boolean',
				default: false,
			},
			slidesPerView: {
				type: 'number',
				default: 1,
			},
		},
	};
}

addFilter(
	'blocks.registerBlockType',
	'cet-wp-theme-troon-2/columns-carousel-attributes',
	addCarouselAttributes
);

const withCarouselControls = createHigherOrderComponent( ( BlockEdit ) => {
	return ( props ) => {
		if ( props.name !== 'core/columns' || ! isCardStyle( props.attributes?.className ) ) {
			return <BlockEdit { ...props } />;
		}

		const { attributes, setAttributes } = props,
			{ carousel = false, mobileOnlyCarousel = false, slidesPerView = 1 } = attributes;

		return (
			<>
				<BlockEdit { ...props } />

				<InspectorControls>
					<PanelBody
						title={ __( 'Carousel', 'cet-wp-theme-troon-2' ) }
						initialOpen={ true }
					>
						<ToggleControl
							label={ __( 'Carousel', 'cet-wp-theme-troon-2' ) }
							checked={ carousel }
							onChange={ ( value ) => setAttributes( { carousel: value } ) }
						/>
						<ToggleControl
							label={ __( 'Mobile Only Carousel', 'cet-wp-theme-troon-2' ) }
							checked={ mobileOnlyCarousel }
							onChange={ ( value ) => setAttributes( { mobileOnlyCarousel: value } ) }
						/>
						{ carousel && (
							<RangeControl
								label={ __( 'Slides Per View (Desktop)', 'cet-wp-theme-troon-2' ) }
								value={ slidesPerView }
								onChange={ ( value ) => setAttributes( { slidesPerView: value } ) }
								min={ 1 }
								max={ 6 }
							/>
						) }
					</PanelBody>
				</InspectorControls>
			</>
		);
	};
}, 'withCarouselControls' );

addFilter(
	'editor.BlockEdit',
	'cet-wp-theme-troon-2/columns-carousel-controls',
	withCarouselControls
);
