import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody, SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Add custom attribute to core/button
 *
 * @param {Object} settings - Block settings object
 * @param {string} name     - Block name
 * @return {Object} Modified settings
 */
function addButtonSizeAttribute( settings, name ) {
	if ( name !== 'core/button' ) {
		return settings;
	}

	return {
		...settings,
		attributes: {
			...settings.attributes,
			buttonSize: {
				type: 'string',
				default: 'medium',
			},
		},
	};
}

addFilter(
	'blocks.registerBlockType',
	'cet-wp-theme-troon-2/button-size-attribute',
	addButtonSizeAttribute
);

/**
 * Add control to Styles tab
 */
const withButtonSizeControl = createHigherOrderComponent( ( BlockEdit ) => {
	return ( props ) => {
		if ( props.name !== 'core/button' ) {
			return <BlockEdit { ...props } />;
		}

		const { attributes, setAttributes } = props,
			{ buttonSize = 'medium' } = attributes;

		return (
			<>
				<BlockEdit { ...props } />

				<InspectorControls group="styles">
					<PanelBody
						title={ __( 'Button Size', 'cet-wp-theme-troon-2' ) }
						initialOpen={ true }
					>
						<SelectControl
							label={ __( 'Size', 'cet-wp-theme-troon-2' ) }
							value={ buttonSize }
							options={ [
								{ label: __( 'Large', 'cet-wp-theme-troon-2' ), value: 'large' },
								{ label: __( 'Medium', 'cet-wp-theme-troon-2' ), value: 'medium' },
								{ label: __( 'Small', 'cet-wp-theme-troon-2' ), value: 'small' },
							] }
							onChange={ ( value ) => setAttributes( { buttonSize: value } ) }
						/>
					</PanelBody>
				</InspectorControls>
			</>
		);
	};
}, 'withButtonSizeControl' );

addFilter( 'editor.BlockEdit', 'cet-wp-theme-troon-2/button-size-control', withButtonSizeControl );

/**
 * Add class in editor immediately for live preview
 */
const withButtonSizeEditorClass = createHigherOrderComponent( ( BlockListBlock ) => {
	return ( props ) => {
		if ( props.name !== 'core/button' ) {
			return <BlockListBlock { ...props } />;
		}

		const size = props.attributes?.buttonSize || 'medium',
			className = [ props.className, `is-size-${ size }` ].filter( Boolean ).join( ' ' );

		return <BlockListBlock { ...props } className={ className } />;
	};
}, 'withButtonSizeEditorClass' );

addFilter(
	'editor.BlockListBlock',
	'cet-wp-theme-troon-2/button-size-editor-class',
	withButtonSizeEditorClass
);
