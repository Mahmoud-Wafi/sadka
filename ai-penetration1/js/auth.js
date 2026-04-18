const API_PORT = '5000';
const API_BASE_URL_STORAGE_KEY = 'ai_penetration_api_base_url';
const authUi = window.authUi || {};

function normalizeApiBaseUrl(baseUrl) {
    return String(baseUrl || '').trim().replace(/\/+$/, '');
}

function getCookie(name) {
    const cookieValue = `; ${document.cookie}`;
    const parts = cookieValue.split(`; ${name}=`);
    if (parts.length === 2) {
        return decodeURIComponent(parts.pop().split(';').shift());
    }
    return '';
}

function rememberApiBaseUrl(baseUrl) {
    const normalized = normalizeApiBaseUrl(baseUrl);
    if (!normalized) {
        return '';
    }

    try {
        localStorage.setItem(API_BASE_URL_STORAGE_KEY, normalized);
    } catch (error) {
        console.warn('Could not persist API base URL:', error);
    }

    return normalized;
}

function getApiBaseCandidates() {
    const params = new URLSearchParams(window.location.search);
    const candidates = [];
    const hosts = [];

    const storedBaseUrl = normalizeApiBaseUrl(localStorage.getItem(API_BASE_URL_STORAGE_KEY));
    const queryBaseUrl = normalizeApiBaseUrl(params.get('apiBase'));
    const queryHost = String(params.get('apiHost') || '').trim();
    const currentHost = String(window.location.hostname || '').trim();

    if (storedBaseUrl) candidates.push(storedBaseUrl);
    if (queryBaseUrl) candidates.push(queryBaseUrl);

    if (queryHost) hosts.push(queryHost);
    if (currentHost) hosts.push(currentHost === '0.0.0.0' ? '127.0.0.1' : currentHost);
    hosts.push('localhost', '127.0.0.1');

    Array.from(new Set(hosts.filter(Boolean))).forEach(host => {
        candidates.push(`http://${host}:${API_PORT}`);
    });

    return Array.from(new Set(candidates.map(normalizeApiBaseUrl).filter(Boolean)));
}

async function resolveApiBaseUrl(forceRefresh = false) {
    if (!forceRefresh) {
        const cached = normalizeApiBaseUrl(localStorage.getItem(API_BASE_URL_STORAGE_KEY));
        if (cached) {
            return cached;
        }
    }

    let lastError = null;

    for (const baseUrl of getApiBaseCandidates()) {
        try {
            const response = await fetch(`${baseUrl}/health/`, {
                credentials: 'include',
                headers: {
                    Accept: 'application/json'
                }
            });
            if (!response.ok) {
                lastError = new Error(`API probe failed with status ${response.status}`);
                continue;
            }
            return rememberApiBaseUrl(baseUrl);
        } catch (error) {
            lastError = error;
        }
    }

    throw lastError || new Error('Unable to reach the backend API on port 5000.');
}

async function ensureCsrfCookie() {
    const baseUrl = await resolveApiBaseUrl();
    await fetch(`${baseUrl}/api/auth/csrf`, {
        credentials: 'include',
        headers: {
            Accept: 'application/json'
        }
    });
}

async function authFetch(path, options = {}) {
    const baseUrl = await resolveApiBaseUrl();
    const method = String(options.method || 'GET').toUpperCase();
    const headers = new Headers(options.headers || {});

    if (!headers.has('Accept')) {
        headers.set('Accept', 'application/json');
    }
    if (!['GET', 'HEAD', 'OPTIONS', 'TRACE'].includes(method)) {
        if (!getCookie('csrftoken')) {
            await ensureCsrfCookie();
        }
        const csrfToken = getCookie('csrftoken');
        if (csrfToken && !headers.has('X-CSRFToken')) {
            headers.set('X-CSRFToken', csrfToken);
        }
    }

    return fetch(`${baseUrl}${path}`, {
        credentials: 'include',
        ...options,
        headers
    });
}

function getSafeNextPath() {
    const params = new URLSearchParams(window.location.search);
    const nextValue = String(params.get('next') || '/dashboard.html').trim();

    try {
        const nextUrl = new URL(nextValue, window.location.origin);
        if (nextUrl.origin !== window.location.origin) {
            return '/dashboard.html';
        }
        return `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}` || '/dashboard.html';
    } catch (error) {
        return '/dashboard.html';
    }
}

function updateNavigationLinks() {
    const nextPath = getSafeNextPath();
    const signupLink = document.getElementById('signupLink');
    const signupLinkSecondary = document.getElementById('signupLinkSecondary');
    const loginLink = document.getElementById('loginLink');
    const loginLinkSecondary = document.getElementById('loginLinkSecondary');

    const setLinkNext = (link, fallbackPath) => {
        if (!link) {
            return;
        }

        try {
            const resolvedUrl = new URL(link.getAttribute('href') || fallbackPath, window.location.origin);
            resolvedUrl.searchParams.set('next', nextPath);
            link.href = `${resolvedUrl.pathname}${resolvedUrl.search}${resolvedUrl.hash}`;
        } catch (error) {
            link.href = `${fallbackPath}?next=${encodeURIComponent(nextPath)}`;
        }
    };

    setLinkNext(signupLink, 'signup.html');
    setLinkNext(signupLinkSecondary, 'signup.html');
    setLinkNext(loginLink, 'login.html');
    setLinkNext(loginLinkSecondary, 'login.html');
}

function showMessage(message, tone = 'danger') {
    const box = document.getElementById('authMessage');
    if (!box) {
        return;
    }

    box.className = `alert auth-alert${tone === 'danger' ? '' : ' alert-success'}`;
    box.textContent = message;
    box.classList.remove('d-none');
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function clearMessage() {
    const box = document.getElementById('authMessage');
    if (!box) {
        return;
    }

    box.classList.add('d-none');
    box.textContent = '';
}

function setSubmittingState(isSubmitting) {
    const button = document.getElementById('authSubmitButton');
    if (!button) {
        return;
    }

    if (!button.dataset.defaultHtml) {
        button.dataset.defaultHtml = button.innerHTML;
    }

    button.disabled = isSubmitting;
    button.setAttribute('aria-busy', isSubmitting ? 'true' : 'false');
    button.innerHTML = isSubmitting
        ? '<span class="spinner-border spinner-border-sm" aria-hidden="true"></span><span>Please wait...</span>'
        : button.dataset.defaultHtml;
}

function setFieldState(input, status = 'default', message = '') {
    if (typeof authUi.setFieldState === 'function') {
        authUi.setFieldState(input, status, message);
    }
}

function clearFieldState(input) {
    if (typeof authUi.clearFieldState === 'function') {
        authUi.clearFieldState(input);
    }
}

function markFieldValid(input, message = '') {
    setFieldState(input, 'valid', message);
    return true;
}

function markFieldInvalid(input, message) {
    setFieldState(input, 'invalid', message);
    return false;
}

function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function focusFirstInvalidField(form) {
    form?.querySelector('.auth-field.is-invalid input, .auth-field.is-invalid textarea')?.focus();
}

function validateLoginEmail() {
    const input = document.getElementById('email');
    if (!input) {
        return true;
    }

    const value = input.value.trim();
    if (!value) {
        return markFieldInvalid(input, 'Enter your email address.');
    }
    if (!isValidEmail(value)) {
        return markFieldInvalid(input, 'Enter a valid email address.');
    }
    return markFieldValid(input);
}

function validateLoginPassword() {
    const input = document.getElementById('password');
    if (!input) {
        return true;
    }

    if (!input.value) {
        return markFieldInvalid(input, 'Enter your password.');
    }
    return markFieldValid(input);
}

function validateSignupFullName() {
    const input = document.getElementById('fullName');
    if (!input) {
        return true;
    }

    const value = input.value.trim();
    if (!value) {
        return markFieldInvalid(input, 'Enter your full name.');
    }
    if (value.length < 2) {
        return markFieldInvalid(input, 'Use at least 2 characters for your name.');
    }
    return markFieldValid(input);
}

function validateSignupEmail() {
    const input = document.getElementById('email');
    if (!input) {
        return true;
    }

    const value = input.value.trim();
    if (!value) {
        return markFieldInvalid(input, 'Enter your email address.');
    }
    if (!isValidEmail(value)) {
        return markFieldInvalid(input, 'Enter a valid email address.');
    }
    return markFieldValid(input);
}

function validateSignupPassword() {
    const input = document.getElementById('password');
    if (!input) {
        return true;
    }

    if (!input.value) {
        return markFieldInvalid(input, 'Create a password.');
    }
    if (input.value.length < 8) {
        return markFieldInvalid(input, 'Use at least 8 characters.');
    }
    return markFieldValid(input);
}

function validateSignupConfirmPassword() {
    const passwordInput = document.getElementById('password');
    const confirmInput = document.getElementById('confirmPassword');
    if (!confirmInput || !passwordInput) {
        return true;
    }

    if (!confirmInput.value) {
        return markFieldInvalid(confirmInput, 'Repeat your password to confirm it.');
    }
    if (confirmInput.value !== passwordInput.value) {
        return markFieldInvalid(confirmInput, 'Passwords must match.');
    }
    return markFieldValid(confirmInput);
}

function validateSignupAccessCode() {
    const input = document.getElementById('accessCode');
    if (!input) {
        return true;
    }

    if (!input.value.trim()) {
        return markFieldInvalid(input, 'Enter the access code you received.');
    }
    return markFieldValid(input);
}

function validateLoginForm() {
    return [validateLoginEmail(), validateLoginPassword()].every(Boolean);
}

function validateSignupForm() {
    return [
        validateSignupFullName(),
        validateSignupEmail(),
        validateSignupPassword(),
        validateSignupConfirmPassword(),
        validateSignupAccessCode(),
    ].every(Boolean);
}

function bindValidation(input, validator) {
    if (!input) {
        return;
    }

    const runValidation = () => validator();
    input.addEventListener('blur', () => {
        input.dataset.touched = 'true';
        runValidation();
    });
    input.addEventListener('input', () => {
        const field = input.closest('.auth-field');
        if (input.dataset.touched === 'true' || field?.classList.contains('is-invalid')) {
            runValidation();
        } else {
            clearFieldState(input);
        }
    });
}

function initLoginValidation() {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    bindValidation(emailInput, validateLoginEmail);
    bindValidation(passwordInput, validateLoginPassword);
}

function initSignupValidation() {
    const fullNameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmInput = document.getElementById('confirmPassword');
    const accessCodeInput = document.getElementById('accessCode');

    bindValidation(fullNameInput, validateSignupFullName);
    bindValidation(emailInput, validateSignupEmail);
    bindValidation(passwordInput, validateSignupPassword);
    bindValidation(confirmInput, validateSignupConfirmPassword);
    bindValidation(accessCodeInput, validateSignupAccessCode);

    passwordInput?.addEventListener('input', () => {
        if (confirmInput?.value || confirmInput?.dataset.touched === 'true') {
            validateSignupConfirmPassword();
        }
    });
}

function applyLoginServerError(message) {
    if (!/invalid email or password/i.test(message)) {
        return;
    }

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    markFieldInvalid(emailInput, 'Check the email and try again.');
    markFieldInvalid(passwordInput, 'Incorrect email or password.');
}

function applySignupServerError(message) {
    const loweredMessage = String(message || '').toLowerCase();

    if (loweredMessage.includes('access code')) {
        markFieldInvalid(document.getElementById('accessCode'), 'This access code is not valid.');
        return;
    }
    if (loweredMessage.includes('passwords do not match')) {
        markFieldInvalid(document.getElementById('confirmPassword'), 'Passwords must match.');
        return;
    }
    if (loweredMessage.includes('email') && loweredMessage.includes('exists')) {
        markFieldInvalid(document.getElementById('email'), 'This email already has an account.');
    }
}

function redirectToApp() {
    window.location.href = getSafeNextPath();
}

async function fetchSession() {
    const response = await authFetch('/api/auth/session');
    if (!response.ok) {
        throw new Error(`Session request failed with status ${response.status}`);
    }
    return response.json();
}

async function redirectIfAuthenticated() {
    const session = await fetchSession();
    if (session.authenticated) {
        redirectToApp();
        return true;
    }
    return false;
}

async function handleLoginSubmit(event) {
    event.preventDefault();
    clearMessage();

    const form = event.currentTarget;
    if (!validateLoginForm()) {
        showMessage('Please fix the highlighted fields and try again.');
        focusFirstInvalidField(form);
        return;
    }

    setSubmittingState(true);

    try {
        const payload = {
            email: document.getElementById('email').value.trim(),
            password: document.getElementById('password').value
        };

        const response = await authFetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.error || 'Login failed.');
        }

        redirectToApp();
    } catch (error) {
        applyLoginServerError(error.message || '');
        showMessage(error.message || 'Login failed.');
    } finally {
        setSubmittingState(false);
    }
}

async function handleSignupSubmit(event) {
    event.preventDefault();
    clearMessage();

    const form = event.currentTarget;
    if (!validateSignupForm()) {
        showMessage('Please fix the highlighted fields and try again.');
        focusFirstInvalidField(form);
        return;
    }

    setSubmittingState(true);

    try {
        const payload = {
            full_name: document.getElementById('fullName').value.trim(),
            email: document.getElementById('email').value.trim(),
            password: document.getElementById('password').value,
            confirm_password: document.getElementById('confirmPassword').value,
            access_code: document.getElementById('accessCode').value.trim()
        };

        const response = await authFetch('/api/auth/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.error || 'Signup failed.');
        }

        redirectToApp();
    } catch (error) {
        applySignupServerError(error.message || '');
        showMessage(error.message || 'Signup failed.');
    } finally {
        setSubmittingState(false);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    updateNavigationLinks();

    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    if (loginForm) {
        initLoginValidation();
        loginForm.addEventListener('submit', handleLoginSubmit);
    }
    if (signupForm) {
        initSignupValidation();
        signupForm.addEventListener('submit', handleSignupSubmit);
    }

    try {
        await redirectIfAuthenticated();
    } catch (error) {
        console.error('Auth page init failed:', error);
        showMessage('Cannot connect to the backend on port 5000. Make sure Django is running.', 'danger');
    }
});
