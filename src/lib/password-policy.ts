/**
 * Central password rules for signup, password reset, and auth flows.
 * Keep in sync with any server-side checks (e.g. Firebase Identity Platform policies in console).
 */

export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_POLICY_HINT =
    `Use at least ${PASSWORD_MIN_LENGTH} characters with uppercase, lowercase, a number, and a symbol (e.g. !@#$%).`;

const HAS_UPPER = /[A-Z]/;
const HAS_LOWER = /[a-z]/;
const HAS_DIGIT = /[0-9]/;
const HAS_SYMBOL = /[^A-Za-z0-9]/;

/** Top weak / breached-style passwords — block even if they meet character-class rules */
const COMMON_PASSWORDS = new Set(
    [
        'password',
        'password1',
        'password!',
        'password123',
        'password123!',
        'qwerty123',
        'qwerty123!',
        'admin123',
        'letmein1',
        'welcome1',
        'monkey123',
        'dragon123',
        'football1',
        'baseball1',
        'iloveyou1',
        'sunshine1',
        'princess1',
        'abc12345',
        'trustno1',
    ].map((s) => s.toLowerCase()),
);

export type PasswordValidationResult =
    | { ok: true }
    | { ok: false; message: string };

export function validatePasswordStrength(password: string): PasswordValidationResult {
    if (!password || typeof password !== 'string') {
        return { ok: false, message: 'Password is required.' };
    }
    if (password.length < PASSWORD_MIN_LENGTH) {
        return {
            ok: false,
            message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
        };
    }
    if (!HAS_UPPER.test(password)) {
        return { ok: false, message: 'Include at least one uppercase letter.' };
    }
    if (!HAS_LOWER.test(password)) {
        return { ok: false, message: 'Include at least one lowercase letter.' };
    }
    if (!HAS_DIGIT.test(password)) {
        return { ok: false, message: 'Include at least one number.' };
    }
    if (!HAS_SYMBOL.test(password)) {
        return { ok: false, message: 'Include at least one symbol (e.g. !@#$%^&*).' };
    }

    const lower = password.toLowerCase();
    if (COMMON_PASSWORDS.has(lower)) {
        return { ok: false, message: 'This password is too common. Choose a stronger one.' };
    }

    // Long runs of the same character (e.g. Aaaaaaa1!)
    if (/(.)\1{4,}/.test(password)) {
        return { ok: false, message: 'Avoid repeating the same character many times in a row.' };
    }

    // Simple ascending digit runs
    if (/0123456|1234567|2345678|3456789|9876543|8765432|7654321|6543210/.test(password)) {
        return { ok: false, message: 'Avoid obvious number sequences like 1234567.' };
    }

    return { ok: true };
}

/** UI meter: four bars (length, mixed case, digit, symbol); label reflects overall policy. */
export type PasswordMeterState = {
    bars: [boolean, boolean, boolean, boolean];
    /** True when `validatePasswordStrength` passes */
    meetsAllRules: boolean;
    /** Short label for accessibility and UI */
    label: string;
    /** 0–4 bars satisfied */
    filledCount: number;
};

export function getPasswordStrengthMeter(password: string): PasswordMeterState {
    const p = typeof password === 'string' ? password : '';
    const bars: [boolean, boolean, boolean, boolean] = [
        p.length >= PASSWORD_MIN_LENGTH,
        HAS_UPPER.test(p) && HAS_LOWER.test(p),
        HAS_DIGIT.test(p),
        HAS_SYMBOL.test(p),
    ];
    const filledCount = bars.filter(Boolean).length;
    const meetsAllRules = validatePasswordStrength(p).ok === true;

    let label = '';
    if (!p) {
        label = 'Password strength';
    } else if (meetsAllRules) {
        label = 'Strong — meets all requirements';
    } else if (filledCount <= 1) {
        label = 'Weak — keep typing';
    } else if (filledCount === 2) {
        label = 'Fair — add more variety';
    } else if (filledCount === 3) {
        label = 'Good — almost there';
    } else {
        label = 'Almost — adjust per message above';
    }

    return { bars, meetsAllRules, label, filledCount };
}
