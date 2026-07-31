/**
 * WPForms accessibility enhancements.
 *
 * IMPORTANT:
 * This script runs only on WPForms forms marked with the
 * `data-sunstone-wpf-a11y="true"` attribute added server-side.
 *
 * Features:
 * 1. Compound-field grouping: converts multi-input fields (Name, Address)
 *    from div/label to fieldset/legend and moves sublabels before inputs.
 * 2. AJAX confirmation live-region: resolves the related `.wpforms-container`,
 *    creates a persistent live region, and uses a MutationObserver to announce
 *    success messages to screen readers.
 */
const FORM_SELECTOR = 'form.wpforms-form[data-sunstone-wpf-a11y="true"]',
	LIVE_REGION_CLASS = 'sunstone-wpf-success-live-region',
	SUCCESS_SELECTOR = '.sunstone-wpf-confirmation-status',
	COMPOUND_FIELD_SELECTOR = '.wpforms-field-name, .wpforms-field-address';

function convertCompoundFieldsToFieldsets(form) {
	form.querySelectorAll(COMPOUND_FIELD_SELECTOR).forEach((field) => {
		if (!field.querySelector('.wpforms-field-row-block')) {
			return;
		}

		const fieldset = document.createElement('fieldset'),
			label = field.querySelector(':scope > .wpforms-field-label');

		Array.from(field.attributes).forEach((attr) => {
			fieldset.setAttribute(attr.name, attr.value);
		});

		if (label) {
			const legend = document.createElement('legend');
			legend.className = label.className;
			legend.innerHTML = label.innerHTML;
			fieldset.appendChild(legend);
		}

		Array.from(field.children).forEach((child) => {
			if (child !== label) {
				fieldset.appendChild(child);
			}
		});

		fieldset.querySelectorAll('.wpforms-field-row-block').forEach((block) => {
			const input = block.querySelector('input, select, textarea'),
				sublabel = block.querySelector('.wpforms-field-sublabel');

			if (sublabel && input && input.compareDocumentPosition(sublabel) & Node.DOCUMENT_POSITION_FOLLOWING) {
				block.insertBefore(sublabel, input);
			}
		});

		field.parentNode.replaceChild(fieldset, field);
	});
}

function getContainer(formEl) {
	return formEl?.closest?.('.wpforms-container') || null;
}

function getOrCreateLiveRegion(container) {
	if (!container) {
		return null;
	}

	let liveRegion = container.querySelector(`.${LIVE_REGION_CLASS}`);

	if (liveRegion) {
		return liveRegion;
	}

	liveRegion = document.createElement('div');
	liveRegion.className = `${LIVE_REGION_CLASS} screen-reader-text`;
	liveRegion.setAttribute('role', 'status');
	liveRegion.setAttribute('aria-live', 'polite');
	liveRegion.setAttribute('aria-atomic', 'true');

	container.insertBefore(liveRegion, container.firstChild);

	return liveRegion;
}

function announceSuccessMessage(container) {
	const liveRegion = getOrCreateLiveRegion(container),
		message = container.querySelector(SUCCESS_SELECTOR);

	if (!liveRegion || !message) {
		return;
	}

	let text = message.textContent.trim();

	if (!text || liveRegion.dataset.lastAnnouncement === text) {
		return;
	}

	liveRegion.textContent = '';

	requestAnimationFrame(() => {
		requestAnimationFrame(() => {
			liveRegion.textContent = text;
			liveRegion.dataset.lastAnnouncement = text;
		});
	});
}

function initSuccessObserver(container) {
	if (!container || container.dataset.sunstoneSuccessObserverAttached === 'true') {
		return;
	}

	getOrCreateLiveRegion(container);

	const observer = new MutationObserver(() => {
		announceSuccessMessage(container);
	});

	observer.observe(container, {
		childList: true,
		subtree: true,
	});

	container.dataset.sunstoneSuccessObserverAttached = 'true';
}

document.addEventListener('DOMContentLoaded', () => {
	document.querySelectorAll(FORM_SELECTOR).forEach((form) => {
		convertCompoundFieldsToFieldsets(form);

		const container = getContainer(form);

		if (container) {
			initSuccessObserver(container);
		}
	});
});