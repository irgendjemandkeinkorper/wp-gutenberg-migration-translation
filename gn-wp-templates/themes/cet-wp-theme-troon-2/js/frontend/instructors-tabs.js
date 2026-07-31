/**
 * Instructors Tabs
 *
 * Activates tab-switching behaviour for the instructors section block.
 * Reads trigger / panel indices from data attributes added server-side by InstructorsTabs.php.
 * Trigger active state uses is-active class; panel active state uses data-cet-tab-active attribute.
 */

const instructorsTabs = {
	options: {
		sectionSelector: ':is([data-cet-block="instructors"], [data-cet-entity="instructors"])',
		triggerSelector: '[data-cet-tab-trigger]',
		panelSelector: '[data-cet-tab-panel]',
	},

	init( options = {} ) {
		this.options = { ...this.options, ...options };

		document.querySelectorAll( this.options.sectionSelector ).forEach( ( section ) => {
			this.initSection( section );
		} );
	},

	initSection( section ) {
		const { triggerSelector, panelSelector } = this.options;

		const triggers = [ ...section.querySelectorAll( triggerSelector ) ];
		const panels = [ ...section.querySelectorAll( panelSelector ) ];

		if ( ! triggers.length || ! panels.length ) {
			return;
		}

		this.activateTab( triggers, panels, 0 );

		section.addEventListener( 'click', ( e ) => {
			const trigger = e.target.closest( triggerSelector );
			if ( ! trigger ) {
				return;
			}

			e.preventDefault();

			const index = triggers.indexOf( trigger );
			if ( index !== -1 ) {
				this.activateTab( triggers, panels, index );
			}
		} );
	},

	activateTab( triggers, panels, index ) {
		triggers.forEach( ( trigger, i ) => {
			trigger.classList.toggle( 'is-active', i === index );
		} );

		panels.forEach( ( panel, i ) => {
			panel.toggleAttribute( 'data-cet-tab-active', i === index );
		} );
	},
};

document.addEventListener( 'DOMContentLoaded', () => instructorsTabs.init() );
