import './editor/editor-block-supports';
import './editor/core-button-extension';
import './editor/core-columns-extension';
import './editor/core-cover-filter';
import './editor/instructors-tabs-editor';

if ( window.cetTroon2Settings?.enableIcons ) {
	import(
		/* webpackChunkName: "icons-toolbar" */
		'./editor/toolbar/rich-text-insert-icon-format-toolbar'
	);
}
