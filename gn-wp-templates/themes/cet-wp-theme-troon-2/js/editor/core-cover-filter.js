import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useEffect } from '@wordpress/element';

const withCoverClass = createHigherOrderComponent(
	( BlockListBlock ) => ( props ) => {
		if ( props.name !== 'core/cover' ) {
			return <BlockListBlock { ...props } />;
		}

		const { clientId } = props;

		useEffect( () => {
			const blockEl = document.querySelector( `[data-block="${ clientId }"]` );
			if ( ! blockEl ) return;

			const bg = blockEl.querySelector( '.wp-block-cover__background' );
			if ( bg ) bg.classList.add( 'cet-block-background' );

			const inner = blockEl.querySelector( '.wp-block-cover__inner-container' );
			if ( inner ) inner.classList.add( 'cet-block-inner-container' );
		}, [ clientId ] );

		const customClass = 'cet-block-type-cover';

		return (
			<BlockListBlock
				{ ...props }
				className={ `${ props.className ? props.className + ' ' : '' }${ customClass }` }
			/>
		);
	},
	'withCoverClass'
);

addFilter(
	'editor.BlockListBlock',
    'cet-wp-theme-troon-2/cover-block-class',
	withCoverClass
);
