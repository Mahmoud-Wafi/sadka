function setPasswordToggleState(button, input) {
    const icon = button.querySelector('i');
    const isVisible = input.type === 'text';
    button.setAttribute('aria-label', isVisible ? 'Hide password' : 'Show password');

    if (!icon) {
        return;
    }

    icon.classList.toggle('fa-eye', !isVisible);
    icon.classList.toggle('fa-eye-slash', isVisible);
}

function getFieldElements(input) {
    const field = input?.closest('.auth-field') || null;
    return {
        field,
        shell: input?.closest('.auth-input-shell') || null,
        feedback: field?.querySelector('.auth-field-feedback') || null,
    };
}

function getDefaultFeedbackText(feedback) {
    if (!feedback) {
        return '';
    }

    const initialText = String(feedback.dataset.defaultMessage || feedback.textContent || '').trim();
    feedback.dataset.defaultMessage = initialText;
    return initialText;
}

function renderFieldFeedback(feedback, message = '', tone = 'default') {
    if (!feedback) {
        return;
    }

    const defaultMessage = getDefaultFeedbackText(feedback);
    const resolvedMessage = String(message || defaultMessage || '').trim();
    feedback.textContent = resolvedMessage;
    feedback.classList.toggle('is-visible', Boolean(resolvedMessage));
    feedback.classList.toggle('is-error', tone === 'error' && Boolean(resolvedMessage));
    feedback.classList.toggle('is-success', tone === 'success' && Boolean(resolvedMessage));
}

function setFieldState(input, status = 'default', message = '') {
    if (!input) {
        return;
    }

    const { field, shell, feedback } = getFieldElements(input);
    [field, shell].forEach((element) => {
        if (!element) {
            return;
        }

        element.classList.remove('is-invalid', 'is-valid');
    });

    if (status === 'invalid') {
        [field, shell].forEach((element) => element?.classList.add('is-invalid'));
        input.setAttribute('aria-invalid', 'true');
        renderFieldFeedback(feedback, message, 'error');
        return;
    }

    input.removeAttribute('aria-invalid');

    if (status === 'valid') {
        [field, shell].forEach((element) => element?.classList.add('is-valid'));
    }

    renderFieldFeedback(feedback, message, status === 'valid' && message ? 'success' : 'default');
}

function clearFieldState(input) {
    setFieldState(input, 'default');
}

function initFieldFeedback(root = document) {
    root.querySelectorAll('.auth-field-feedback').forEach((feedback) => {
        const defaultMessage = getDefaultFeedbackText(feedback);
        if (defaultMessage) {
            feedback.classList.add('is-visible');
        }
    });
}

function initPasswordToggles(root = document) {
    root.querySelectorAll('[data-toggle-password]').forEach((button) => {
        const targetId = button.getAttribute('data-target');
        const input = targetId ? root.getElementById(targetId) || document.getElementById(targetId) : null;
        if (!input) {
            return;
        }

        setPasswordToggleState(button, input);
        button.addEventListener('click', () => {
            input.type = input.type === 'password' ? 'text' : 'password';
            setPasswordToggleState(button, input);
        });
    });
}

function getPasswordStrength(password) {
    if (!password) {
        return 0;
    }

    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    return Math.min(score, 4);
}

function getPasswordStrengthLabel(score) {
    if (score <= 1) return 'Weak password. Add length and complexity.';
    if (score === 2) return 'Fair password. Add more variety for better security.';
    if (score === 3) return 'Good password. One more layer makes it stronger.';
    return 'Strong password.';
}

function initSignupFeedback(root = document) {
    const passwordInput = root.getElementById('password') || document.getElementById('password');
    const confirmInput = root.getElementById('confirmPassword') || document.getElementById('confirmPassword');
    const strengthMeter = root.getElementById('passwordStrengthMeter') || document.getElementById('passwordStrengthMeter');
    const strengthText = root.getElementById('passwordStrengthText') || document.getElementById('passwordStrengthText');
    const matchText = root.getElementById('passwordMatchText') || document.getElementById('passwordMatchText');

    if (!passwordInput || !strengthMeter || !strengthText) {
        return;
    }

    const updateStrength = () => {
        const score = getPasswordStrength(passwordInput.value);
        strengthMeter.setAttribute('data-level', String(score));
        strengthText.textContent = passwordInput.value
            ? getPasswordStrengthLabel(score)
            : 'Use 8+ characters, including letters, numbers, and a symbol.';
    };

    const updateMatch = () => {
        if (!matchText || !confirmInput) {
            return;
        }

        matchText.classList.remove('is-good', 'is-bad');

        if (!confirmInput.value) {
            matchText.textContent = 'Repeat the same password to confirm it.';
            return;
        }

        if (confirmInput.value === passwordInput.value) {
            matchText.textContent = 'Passwords match.';
            matchText.classList.add('is-good');
            return;
        }

        matchText.textContent = 'Passwords do not match yet.';
        matchText.classList.add('is-bad');
    };

    passwordInput.addEventListener('input', () => {
        updateStrength();
        updateMatch();
    });

    if (confirmInput) {
        confirmInput.addEventListener('input', updateMatch);
    }

    updateStrength();
    updateMatch();
}

function initAuthUi(root = document) {
    initFieldFeedback(root);
    initPasswordToggles(root);
    initSignupFeedback(root);
}

window.authUi = Object.assign(window.authUi || {}, {
    clearFieldState,
    getPasswordStrength,
    initAuthUi,
    setFieldState,
});

document.addEventListener('DOMContentLoaded', () => {
    initAuthUi();
});
