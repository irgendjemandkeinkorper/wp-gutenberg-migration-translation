/**
 * WordPress Rich Text Toolbar Component
 *
 * This file uses React hooks within the WordPress block editor's RichTextToolbarButton render function.
 * WordPress editor patterns require this structure and don't follow standard React component naming conventions.
 * ESLint rules for React hooks, complexity, and variable shadowing are disabled for this file.
 */
/* eslint-disable react-hooks/rules-of-hooks, complexity, no-shadow, @wordpress/i18n-no-variables, react-hooks/exhaustive-deps */

import { registerFormatType, insert, create } from '@wordpress/rich-text';
import { RichTextToolbarButton, store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { Icon, create as createIcon } from '@wordpress/icons';
import { Fragment, useCallback, useReducer, useEffect, useRef, useMemo } from '@wordpress/element';
import {
	Popover,
	ComboboxControl,
	SelectControl,
	ColorPalette,
	Button,
} from '@wordpress/components';
import domReady from '@wordpress/dom-ready';

// Feature flag guard - wrap all logic
if ( window.cetTroon2Settings?.enableIcons ) {
	const POPOVER_WIDTH = '320px',
		ICON_DEFAULT_SIZE = 'lg',
		ICON_SIZES = [
			{
				label: __( 'Extra Small', 'cet-wp-theme-troon-2' ),
				numValue: 24,
				value: 'xs',
				width: '24px',
				height: '24px',
			},
			{
				label: __( 'Small', 'cet-wp-theme-troon-2' ),
				numValue: 32,
				value: 'sm',
				width: '32px',
				height: '32px',
			},
			{
				label: __( 'Medium', 'cet-wp-theme-troon-2' ),
				numValue: 40,
				value: 'md',
				width: '40px',
				height: '40px',
			},
			{
				label: __( 'Large', 'cet-wp-theme-troon-2' ),
				numValue: 56,
				value: ICON_DEFAULT_SIZE,
				width: '56px',
				height: '56px',
			},
		],
		DEFAULT_ICON_CATEGORY = {
			label: __( 'All', 'cet-wp-theme-troon-2' ),
			value: 'all',
		},
		SPACE_DATA_ATTRIBUTE = 'data-cet-icon-space',
		SPACE = `<span ${ SPACE_DATA_ATTRIBUTE }="1" style="display: inline-block; width: 0.25em;">&#8203;</span>`;

	registerFormatType( 'cet/icon', {
		title: __( 'Icon', 'cet-wp-theme-troon-2' ),
		tagName: 'span',
		className: 'cet-icon',
		edit( { value, onChange } ) {
			const ACTIONS = {
					refresh: 'REFRESH',
					openPopover: 'OPEN_POPOVER',
					setSearchCategory: 'SET_SEARCH_CATEGORY',
					setIconSize: 'SET_ICON_SIZE',
					setIconColor: 'SET_ICON_COLOR',
					setIcon: 'SET_ICON',
					setIconsData: 'SET_ICON_SET',
				},
				initialState = {
					isPopoverOpened: false,
					searchCategory: DEFAULT_ICON_CATEGORY.value,
					iconSize: [ ...ICON_SIZES ].find(
						( { value } ) => value === ICON_DEFAULT_SIZE
					),
					iconColor: '#000',
					icon: { name: '' },
					iconSet: [],
					iconCategories: [],
					iconColors: [],
				},
				reducer = ( state, action ) => {
					if ( ACTIONS.refresh === action.type ) {
						return {
							// reset selections, but keep loaded icons/categories/colors
							...state,
							isPopoverOpened: false,
							searchCategory: DEFAULT_ICON_CATEGORY.value,
							iconSize: [ ...ICON_SIZES ].find(
								( { value } ) => value === ICON_DEFAULT_SIZE
							),
							iconColor: '#000',
							icon: { name: '' },
						};
					}

					if ( ACTIONS.openPopover === action.type ) {
						return { ...state, isPopoverOpened: action.payload };
					}

					if ( ACTIONS.setSearchCategory === action.type ) {
						return { ...state, searchCategory: action.payload };
					}

					if ( ACTIONS.setIconSize === action.type ) {
						return { ...state, iconSize: action.payload };
					}

					if ( ACTIONS.setIconColor === action.type ) {
						return { ...state, iconColor: action.payload };
					}

					if ( ACTIONS.setIcon === action.type ) {
						return { ...state, icon: action.payload };
					}

					if ( ACTIONS.setIconsData === action.type ) {
						const { icons, categories, colors } = action.payload;
						return {
							...state,
							iconSet: icons,
							iconCategories: categories,
							iconColors: colors,
						};
					}

					return state;
				},
				[ state, dispatch ] = useReducer( reducer, { ...initialState } ),
				filterOptions = useMemo(
					() =>
						state.iconSet
							.filter( ( { category } ) => {
								return (
									DEFAULT_ICON_CATEGORY.value === state.searchCategory ||
									state.searchCategory === category
								);
							} )
							.map( ( { name } ) => ( {
								label: __(
									name.charAt( 0 ).toUpperCase() + name.slice( 1 ),
									'cet-wp-theme-troon-2'
								),
								value: name,
							} ) ),
					[ state.iconSet, state.searchCategory ]
				),
				onPopoverClose = useCallback(
					() => dispatch( { type: ACTIONS.openPopover, payload: false } ),
					[ dispatch ]
				),
				onFormatClick = () =>
					dispatch( {
						type: ACTIONS.openPopover,
						payload: ! state.isPopoverOpened,
					} ),
				onComboboxChange = useCallback(
					( inputValue ) => {
						if ( ! inputValue ) {
							dispatch( {
								type: ACTIONS.setIcon,
								payload: { name: '' },
							} );
							return;
						}

						const icon = state.iconSet.find( ( { name } ) => name === inputValue );
						if ( icon ) {
							dispatch( {
								type: ACTIONS.setIcon,
								payload: { name: icon.name },
							} );
						}
					},
					[ dispatch, state.iconSet ]
				),
				timeoutRef = useRef(),
				onComboboxFilter = ( inputValue ) => {
					clearTimeout( timeoutRef.current );
					timeoutRef.current = setTimeout( () => onComboboxChange( inputValue ), 300 );
				},
				onSearchCategoryChange = useCallback(
					( value ) => dispatch( { type: ACTIONS.setSearchCategory, payload: value } ),
					[ dispatch ]
				),
				onIconSizeChange = useCallback(
					( inputValue ) => {
						const size = [ ...ICON_SIZES ].find(
							( { value } ) => value === inputValue
						);
						if ( size ) {
							dispatch( { type: ACTIONS.setIconSize, payload: size } );
						}
					},
					[ dispatch ]
				),
				onIconColorChange = useCallback(
					( hexValue ) => dispatch( { type: ACTIONS.setIconColor, payload: hexValue } ),
					[ dispatch ]
				),
				insertIcon = () => {
					const icon = `icon-${ state.icon.name }-icon`,
						classNames = [ 'cet-icon', icon, `icon-size--${ state.iconSize.value }` ]
							.filter( Boolean )
							.join( ' ' ),
						styles = [
							`--cet-icon-color: ${ state.iconColor };`.trim(),
							`--cet-icon-width: ${ state.iconSize.width || '24px' };`.trim(),
							`--cet-icon-height: ${ state.iconSize.height || '24px' };`.trim(),
							`--cet-icon-scale: ${
								Math.round( ( state.iconSize.numValue / 24 ) * 100 ) / 100
							};`.trim(),
						].join( ' ' ),
						attributes = Object.entries( {
							style: styles,
							contenteditable: 'false',
							'data-cet-icon': icon,
						} )
							.map( ( [ key, value ] ) => `${ key }="${ value }"` )
							.join( ' ' ),
						html = `<span class="${ classNames }" ${ attributes }>&#8203;</span>${ SPACE }`,
						next = insert( value, create( { html } ) );
					onChange( next );
					dispatch( { type: ACTIONS.refresh } );
				},
				shouldShow = useSelect( ( select ) => {
					const editor = select( blockEditorStore ),
						clientId = editor.getSelectedBlockClientId();
					if ( ! clientId ) {
						return false;
					}

					const name = editor.getBlockName( clientId );
					return name?.startsWith( 'cet/' ) || 'core/paragraph' === name;
				}, [] );

			useEffect( () => {
				const cetIconsIds =
					window.cetIcons &&
					window.cetIcons.ids &&
					Array.isArray( window.cetIcons.ids ) &&
					window.cetIcons.ids.length > 0
						? [ ...new Set( window.cetIcons.ids ) ]
						: [];
				if ( cetIconsIds.length < 1 ) {
					return;
				}

				const colors =
						window.cetGnbBlockColors && Array.isArray( window.cetGnbBlockColors )
							? window.cetGnbBlockColors.map( ( { value, color } ) => ( {
									name: value,
									color,
							  } ) )
							: [],
					normalizedIconsData = cetIconsIds.map( ( id ) => {
						const normalizedId = id.replace( /^icon-/, '' ).replace( /-icon$/, '' ),
							parts = normalizedId.split( '-' );
						if ( 1 === parts.length ) {
							return {
								name: normalizedId,
								category: 'other',
							};
						}

						return {
							name: parts[ 0 ],
							category: parts.slice( 1 ).join( '-' ),
						};
					} );

				dispatch( {
					type: ACTIONS.setIconsData,
					payload: {
						colors,
						categories: [ ...normalizedIconsData ].map( ( { category } ) => ( {
							label: __(
								category.charAt( 0 ).toUpperCase() + category.slice( 1 ),
								'cet-wp-theme-troon-2'
							),
							value: category,
						} ) ),
						icons: [ ...normalizedIconsData ],
					},
				} );
			}, [] );

			if ( ! shouldShow ) {
				return null;
			}

			return (
				<Fragment>
					<RichTextToolbarButton
						icon={ <Icon icon={ createIcon } /> }
						title={ __( 'Insert icon', 'cet-wp-theme-troon-2' ) }
						onClick={ onFormatClick }
					/>
					{ state.isPopoverOpened && (
						<Popover position="overlay" onClose={ onPopoverClose } offset={ -100 }>
							<div
								style={ {
									padding: '1rem 1rem 0 1rem',
									width: POPOVER_WIDTH,
								} }
							>
								<ComboboxControl
									label={ __( 'Search', 'cet-wp-theme-troon-2' ) }
									value={ state.icon.name || '' }
									options={ filterOptions }
									onFilterValueChange={ onComboboxFilter }
									onChange={ onComboboxChange }
								/>

								<SelectControl
									label={ __( 'Categories', 'cet-wp-theme-troon-2' ) }
									value={ state.searchCategory }
									onChange={ onSearchCategoryChange }
									options={ [ DEFAULT_ICON_CATEGORY, ...state.iconCategories ] }
								/>

								{ state.icon && state.icon.name && (
									<Fragment>
										<SelectControl
											label={ __( 'Icon Size', 'cet-wp-theme-troon-2' ) }
											value={
												state.iconSize.value
													? state.iconSize.value
													: ICON_DEFAULT_SIZE
											}
											onChange={ onIconSizeChange }
											options={ [ ...ICON_SIZES ].map(
												( { label, value } ) => ( {
													label,
													value,
												} )
											) }
										/>

										{ Array.isArray( state.iconColors ) &&
											state.iconColors.length > 0 && (
												<div
													style={ {
														marginBlockStart: 8,
													} }
												>
													<div
														style={ {
															marginBottom: 4,
														} }
													>
														{ __(
															'Pick color',
															'cet-wp-theme-troon-2'
														) }
													</div>

													<ColorPalette
														value={ state.iconColor }
														colors={ state.iconColors }
														onChange={ onIconColorChange }
														disableCustomColors={ true }
														asButtons={ true }
													/>
												</div>
											) }
									</Fragment>
								) }
							</div>

							{ state.icon && state.icon.name && (
								<div
									style={ {
										margin: '1rem',
										padding: '1rem',
										backgroundColor: '#ccc',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										maxWidth: `calc(${ POPOVER_WIDTH } - 2rem)`,
									} }
								>
									<span
										className={ `icon-${ state.icon.name }-icon` }
										style={ {
											'--cet-icon-color': state.iconColor,
											'--cet-icon-width': state.iconSize.width || '24px',
											'--cet-icon-height': state.iconSize.height || '24px',
											'--cet-icon-scale':
												Math.round(
													( state.iconSize.numValue / 24 ) * 100
												) / 100,
										} }
									></span>
								</div>
							) }

							<div
								style={ {
									margin: '1rem',
									display: 'flex',
									justifyContent: 'center',
								} }
							>
								<Button
									variant="primary"
									onClick={ insertIcon }
									disabled={ ! state.icon?.name }
									style={ {
										width: '100%',
										display: 'flex',
										justifyContent: 'center',
									} }
								>
									{ __( 'Insert Icon', 'cet-wp-theme-troon-2' ) }
								</Button>
							</div>
						</Popover>
					) }
				</Fragment>
			);
		},
	} );

	/**
	 * Emulation of deleting an icon as a text element
	 */
	domReady( () => {
		document.addEventListener(
			'keydown',
			( e ) => {
				if ( ! [ 'Backspace', 'Delete' ].includes( e.key ) ) {
					return;
				}

				const sel = window.getSelection();
				if ( ! sel || ! sel.rangeCount ) {
					return;
				}

				const node = sel.anchorNode,
					element = node?.nodeType === 1 ? node : node.parentElement;
				if ( ! element || ! element.hasAttribute( SPACE_DATA_ATTRIBUTE ) ) {
					return;
				}

				const icon =
					'Backspace' === e.key
						? element.previousElementSibling
						: element.nextElementSibling;
				if ( ! icon || ! icon.classList.contains( 'cet-icon' ) ) {
					return;
				}

				e.preventDefault();
				const range = document.createRange();
				range.setStartBefore( icon );
				range.setStartAfter( icon );
				sel.removeAllRanges();
				sel.addRange( range );
				range.deleteContents();
				icon.remove();
				element.remove();

				const editable = element.closest( '[contenteditable="true"]' );
				if ( editable ) {
					editable.dispatchEvent(
						new InputEvent( 'input', {
							bubbles: true,
							cancelable: true,
							inputType: 'deleteContentBackward',
						} )
					);
					editable.dispatchEvent(
						new Event( 'change', { bubbles: true, cancelable: true } )
					);
				}
			},
			{ capture: true }
		);
	} );
}
