/**
 * WPForms descriptive validation messages
 *
 */

const VALIDATION_FORM_SELECTOR = '.wpforms-container form.wpforms-form';
const NAME_REGEX = /^[\p{L}\s'-]+$/u;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FIELD_CONFIGS = [
	{
		match: (input) => input.classList.contains('wpforms-field-name-first'),
		requiredMessage: 'Error: Please enter your first name.',
		invalidMessage: 'Error: First name can only contain letters.',
		isValid: (value) => NAME_REGEX.test(value),
		errorContainer: (input) => input.closest('.wpforms-field-row-block'),
	},
	{
		match: (input) => input.classList.contains('wpforms-field-name-last'),
		requiredMessage: 'Error: Please enter your last name.',
		invalidMessage: 'Error: Last name can only contain letters.',
		isValid: (value) => NAME_REGEX.test(value),
		errorContainer: (input) => input.closest('.wpforms-field-row-block'),
	},
	{
		match: (input) => input.type === 'email',
		requiredMessage: 'Error: Please enter your email address.',
		invalidMessage: 'Error: Please provide a valid email address that includes an "@" symbol.',
		isValid: (value) => EMAIL_REGEX.test(value),
		errorContainer: (input) => input.closest('.wpforms-field'),
	},
	{
		match: (input) => input.tagName.toLowerCase() === 'textarea',
		requiredMessage: 'Error: Please enter your message.',
		errorContainer: (input) => input.closest('.wpforms-field'),
	},
];

function getFieldConfig(input) {
	return FIELD_CONFIGS.find((config) => config.match(input)) || null;
}

function getTrackedInputs(form) {
	return Array.from(form.querySelectorAll('input, textarea')).filter((input) =>
		getFieldConfig(input)
	);
}

function getInputValue(input) {
	return input?.value ? input.value.trim() : '';
}

function getErrorId(input) {
	return input?.id ? `${input.id}-error` : '';
}

function getFieldContainer(input) {
	return input?.closest('.wpforms-field') || null;
}

function getPreferredErrorNode(form, errorId) {
	if (!form || !errorId) {
		return null;
	}

	const errorNodes = Array.from(form.querySelectorAll(`#${CSS.escape(errorId)}`));

	if (!errorNodes.length) {
		return null;
	}

	return (
		errorNodes.find((node) => node.dataset.sunstoneA11yNormalized === 'true') ||
		errorNodes[0]
	);
}

function dedupeErrorNodes(form, errorId) {
	if (!form || !errorId) {
		return null;
	}

	const errorNodes = Array.from(form.querySelectorAll(`#${CSS.escape(errorId)}`));

	if (!errorNodes.length) {
		return null;
	}

	const preferredNode =
		errorNodes.find((node) => node.dataset.sunstoneA11yNormalized === 'true') ||
		errorNodes[0];

	errorNodes.forEach((node) => {
		if (node !== preferredNode) {
			node.remove();
		}
	});

	return preferredNode;
}

function getInputForErrorNode(form, errorNode) {
	if (!form || !errorNode) {
		return null;
	}

	const explicitFor = errorNode.getAttribute('for');

	if (explicitFor) {
		return form.querySelector(`#${CSS.escape(explicitFor)}`);
	}

	if (errorNode.id?.endsWith('-error')) {
		const inputId = errorNode.id.replace(/-error$/, '');

		return inputId ? form.querySelector(`#${CSS.escape(inputId)}`) : null;
	}

	return null;
}

function removeDescribedByReference(input, errorId) {
	if (!input || !errorId) {
		return;
	}

	const nextValue = (input.getAttribute('aria-describedby') || '')
		.split(/\s+/)
		.filter(Boolean)
		.filter((id) => id !== errorId)
		.join(' ');

	if (nextValue) {
		input.setAttribute('aria-describedby', nextValue);
	} else {
		input.removeAttribute('aria-describedby');
	}
}

function clearFieldError(input) {
	if (!input?.id) {
		return;
	}

	const form = input.closest('form');
	const fieldContainer = getFieldContainer(input);
	const errorId = getErrorId(input);

	if (!form || !errorId) {
		return;
	}

	form.querySelectorAll(`#${CSS.escape(errorId)}`).forEach((node) => node.remove());

	removeDescribedByReference(input, errorId);
	input.removeAttribute('aria-invalid');
	input.classList.remove('wpforms-error');

	if (fieldContainer && !fieldContainer.querySelector('.wpforms-error')) {
		fieldContainer.classList.remove('wpforms-has-error');
	}
}

function setFieldError(input, message) {
	if (!input?.id) {
		return false;
	}

	const form = input.closest('form');
	const fieldContainer = getFieldContainer(input);
	const config = getFieldConfig(input);
	const errorContainer = config?.errorContainer?.(input);
	const errorId = getErrorId(input);

	if (!form || !fieldContainer || !errorContainer || !errorId) {
		return false;
	}

	let errorNode = getPreferredErrorNode(form, errorId);

	if (!errorNode) {
		errorNode = document.createElement('div');
		errorNode.className = 'wpforms-error';
		errorNode.id = errorId;
		errorContainer.appendChild(errorNode);
	}

	errorNode.textContent = message;
	errorNode = dedupeErrorNodes(form, errorId) || errorNode;

	input.setAttribute('aria-invalid', 'true');
	input.setAttribute('aria-describedby', errorId);
	input.classList.add('wpforms-error');
	fieldContainer.classList.add('wpforms-has-error');

	return false;
}

function validateField(input, { showRequired = false } = {}) {
	const config = getFieldConfig(input);

	if (!config) {
		return true;
	}

	const value = getInputValue(input);
	const isRequired = input.hasAttribute('required');

	if (!value) {
		clearFieldError(input);

		if (showRequired && isRequired) {
			return setFieldError(input, config.requiredMessage);
		}

		return true;
	}

	if (config.isValid && !config.isValid(value)) {
		return setFieldError(input, config.invalidMessage);
	}

	clearFieldError(input);
	return true;
}

function validateFormFields(form, { showRequired = false, focusInvalid = false } = {}) {
	let firstInvalidInput = null;
	let isFormValid = true;

	getTrackedInputs(form).forEach((input) => {
		const isValid = validateField(input, { showRequired });

		if (!isValid) {
			isFormValid = false;

			if (!firstInvalidInput) {
				firstInvalidInput = input;
			}
		}
	});

	if (!isFormValid && firstInvalidInput && focusInvalid) {
		firstInvalidInput.focus();
	}

	return isFormValid;
}

function getValidationMessage(input, originalMessage) {
	const config = getFieldConfig(input);

	if (!config) {
		return originalMessage;
	}

	const value = getInputValue(input);
	const message = (originalMessage || '').trim().toLowerCase();
	const isRequiredMessage = message === 'this field is required.';
	const isEmailMessage =
		message.includes('valid email') ||
		message.includes('email address is incomplete') ||
		message.includes('enter a valid email');

	if (isRequiredMessage) {
		return config.requiredMessage;
	}

	if (value && config.invalidMessage) {
		if (
			(input.type === 'email' && (isEmailMessage || !config.isValid(value))) ||
			(input.type !== 'email' && config.isValid && !config.isValid(value))
		) {
			return config.invalidMessage;
		}
	}

	return originalMessage;
}

function updateValidationMessages(form) {
	form.querySelectorAll('.wpforms-error').forEach((errorNode) => {
		const input = getInputForErrorNode(form, errorNode);

		if (!input) {
			return;
		}

		const nextMessage = getValidationMessage(input, errorNode.textContent);

		if (nextMessage !== errorNode.textContent) {
			errorNode.textContent = nextMessage;
		}

		dedupeErrorNodes(form, getErrorId(input));
	});
}

function attachLiveValidation(form) {
	getTrackedInputs(form).forEach((input) => {
		input.addEventListener('input', () => {
			validateField(input, { showRequired: false });
		});

		input.addEventListener('blur', () => {
			validateField(input, { showRequired: true });
		});
	});
}

function initValidationForm(form) {
	if (!form || form.dataset.sunstoneValidationAttached === 'true') {
		return;
	}

	attachLiveValidation(form);
	updateValidationMessages(form);

	new MutationObserver(() => {
		updateValidationMessages(form);
	}).observe(form, {
		childList: true,
		subtree: true,
	});

	form.addEventListener(
		'submit',
		(event) => {
			const isFormValid = validateFormFields(form, {
				showRequired: true,
				focusInvalid: true,
			});

			if (!isFormValid) {
				event.preventDefault();
				event.stopPropagation();
				event.stopImmediatePropagation();
			}
		},
		true
	);

	form.dataset.sunstoneValidationAttached = 'true';
}

document.addEventListener('DOMContentLoaded', () => {
	document.querySelectorAll(VALIDATION_FORM_SELECTOR).forEach(initValidationForm);
});