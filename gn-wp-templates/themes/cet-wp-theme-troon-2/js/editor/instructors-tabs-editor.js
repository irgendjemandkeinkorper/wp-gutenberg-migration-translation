import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useEffect, useLayoutEffect, useRef } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

// Stores the active tab index for each block instance, keyed by clientId.
// Lives outside React so it survives component remounts: Gutenberg can unmount and
// remount the HOC at any time (e.g. on editor navigation or block selection changes),
// and useState/useRef would reset to 0 on every remount (both have component-instance
// lifetime, not page lifetime). useMemo has the same limitation. The Map persists for
// the lifetime of the editor page, which is the correct scope for editor UI state.
const activeTabIndexMap = new Map();

// Caches the wrapped component per BlockEdit reference to prevent React remounting.
// Gutenberg calls applyFilters('editor.BlockEdit', ...) inside its own render cycle,
// which means createHigherOrderComponent is called on every render and returns a new
// function reference each time. React treats a new function reference as a different
// component type and unmounts/remounts the tree. The WeakMap breaks that cycle: if we
// have already wrapped this BlockEdit, return the same component reference.
// Note: hooks (useMemo, useCallback) cannot be used here because this factory function
// runs outside a React component — hooks are only legal inside function components or
// custom hooks. The WeakMap key is the BlockEdit function itself, so entries are
// garbage-collected automatically when Gutenberg releases its reference.
const componentCache = new WeakMap();

/**
 * Bootstrap data-cet-tab-trigger / data-cet-tab-panel attributes and the
 * cet-tabs-trigger-link CSS class onto the live editor DOM.
 *
 * PHP (InstructorsTabs.php) applies these server-side for the frontend; the editor
 * renders blocks as React components so PHP never runs — this function replicates
 * the same contracts client-side.
 *
 * CSS class selectors (.cet-tabs-nav, .cet-tabs-trigger) are used here only as a
 * one-time bootstrap to locate elements before data attributes exist. After this
 * function runs, all ongoing JS logic uses data attributes only.
 */
function applyDataAttributes( container ) {
	const nav = container.querySelector( '.cet-tabs-nav' );
	if ( nav ) {
		[ ...nav.querySelectorAll( '.cet-tabs-trigger' ) ].forEach( ( wrapper, i ) => {
			wrapper.classList.add( 'cet-block-part-type-button' );
			const link = wrapper.firstElementChild;
			if ( link ) {
				link.setAttribute( 'data-cet-tab-trigger', String( i ) );
				link.classList.add( 'cet-tabs-trigger-link' );
			}
		} );
	}

	[ ...container.querySelectorAll( '.is-style-instructors-panel' ) ].forEach(
		( panel, i ) => panel.setAttribute( 'data-cet-tab-panel', String( i ) )
	);
}

/**
 * Toggle active state on triggers and panels to reflect the current active tab.
 * Triggers use is-active class; panels use data-cet-tab-active attribute.
 * Panels use an attribute because Gutenberg's React reconciliation resets class
 * lists to what the component renders, stripping any imperatively added classes.
 */
function applyActiveState( container, activeIndex ) {
	const triggers = [ ...container.querySelectorAll( '[data-cet-tab-trigger]' ) ];
	const panels = [ ...container.querySelectorAll( '[data-cet-tab-panel]' ) ];

	triggers.forEach( ( t, i ) => {
		t.classList.toggle( 'is-active', i === activeIndex );
	} );

	panels.forEach( ( p, i ) => {
		p.toggleAttribute( 'data-cet-tab-active', i === activeIndex );
	} );
}

const withInstructorsTabs = createHigherOrderComponent( ( BlockEdit ) => {
	if ( componentCache.has( BlockEdit ) ) {
		return componentCache.get( BlockEdit );
	}

	const InstructorsTabsEditor = function( props ) {
		const classNames = props.attributes?.className?.split( ' ' ) ?? [];
		if (
			props.name !== 'core/columns' ||
			! classNames.includes( 'is-style-instructors' )
		) {
			return <BlockEdit { ...props } />;
		}

		const { clientId } = props;
		const containerRef = useRef( null );

		// Triggers a re-render when blocks are added/removed so useLayoutEffect
		// re-applies data attributes to any newly created DOM elements.
		useSelect(
			( select ) => select( blockEditorStore ).getBlocks( clientId ),
			[ clientId ]
		);

		const selectedClientId = useSelect(
			( select ) => select( blockEditorStore ).getSelectedBlockClientId(),
			[]
		);

		// No dependency array — runs after every render so React's className reconciliation
		// never leaves panels in the wrong state before the browser paints.
		useLayoutEffect( () => {
			const container = containerRef.current;
			if ( ! container ) {
				return;
			}
			applyDataAttributes( container );
			applyActiveState( container, activeTabIndexMap.get( clientId ) ?? 0 );
		} );

		// Capture phase so the click fires before the editor intercepts it.
		// data-cet-tab-trigger is only set on nav triggers (never on panel buttons),
		// so no nav scope check is needed.
		useEffect( () => {
			const container = containerRef.current;
			if ( ! container ) {
				return;
			}

			const handleClick = ( e ) => {
				const trigger = e.target.closest( '[data-cet-tab-trigger]' );
				if ( ! trigger ) {
					return;
				}
				const triggers = [ ...container.querySelectorAll( '[data-cet-tab-trigger]' ) ];
				const index = triggers.indexOf( trigger );
				if ( index === -1 ) {
					return;
				}
				e.preventDefault();
				e.stopPropagation();
				activeTabIndexMap.set( clientId, index );
				applyActiveState( container, index );
			};

			container.addEventListener( 'click', handleClick, true );
			return () => container.removeEventListener( 'click', handleClick, true );
		}, [] );

		// Switch the active panel when the user selects a block inside it from
		// the Document Overview sidebar. Uses contains() in both directions to
		// handle cases where [data-block] is a wrapper around the panel element
		// rather than the panel element itself.
		useEffect( () => {
			if ( ! selectedClientId || ! containerRef.current ) {
				return;
			}
			const selectedEl = containerRef.current.querySelector(
				`[data-block="${ selectedClientId }"]`
			);
			if ( ! selectedEl ) {
				return;
			}
			const panels = [ ...containerRef.current.querySelectorAll( '[data-cet-tab-panel]' ) ];
			const panelIndex = panels.findIndex(
				( panel ) => panel.contains( selectedEl ) || selectedEl.contains( panel )
			);
			if ( panelIndex !== -1 ) {
				activeTabIndexMap.set( clientId, panelIndex );
				applyActiveState( containerRef.current, panelIndex );
			}
		}, [ selectedClientId ] );

		return (
			<div ref={ containerRef } className="cet-block-type-instructors">
				<BlockEdit { ...props } />
			</div>
		);
	};

	componentCache.set( BlockEdit, InstructorsTabsEditor );
	return InstructorsTabsEditor;
}, 'withInstructorsTabs' );

addFilter(
	'editor.BlockEdit',
	'cet-wp-theme-troon-2/instructors-tabs-editor',
	withInstructorsTabs
);
