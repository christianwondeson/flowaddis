/** User appearance: explicit light or dark only. */
export type ThemePreference = "light" | "dark";

export const THEME_STORAGE_KEY = "flowaddis-theme";

/** Dispatched on window after theme is written (syncs ThemeProvider + other listeners). */
export const THEME_CHANGE_EVENT = "flowaddis-theme-changed";

/** Default site look: light until the user turns on dark mode in Settings. */
export const DEFAULT_THEME_PREFERENCE: ThemePreference = "light";

export function readStoredThemePreference(): ThemePreference {
    if (typeof window === "undefined") return DEFAULT_THEME_PREFERENCE;
    try {
        const raw = localStorage.getItem(THEME_STORAGE_KEY);
        if (raw === "dark") return "dark";
        if (raw === "light") return "light";
        if (raw === "system") return "light";
    } catch {
        /* private mode */
    }
    return DEFAULT_THEME_PREFERENCE;
}

export function resolveTheme(pref: ThemePreference): "light" | "dark" {
    return pref === "dark" ? "dark" : "light";
}

/** Apply `dark` class on `<html>` (Tailwind class strategy). */
export function applyDarkClassToHtml(isDark: boolean): void {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", isDark);
}

/**
 * Persist preference, update the document class, and notify listeners (keeps React state in sync).
 */
export function writeStoredThemePreference(pref: ThemePreference): void {
    try {
        localStorage.setItem(THEME_STORAGE_KEY, pref);
    } catch {
        /* private mode / quota — still apply class + notify so UI and React state can recover */
    }
    applyDarkClassToHtml(pref === "dark");
    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent<ThemePreference>(THEME_CHANGE_EVENT, { detail: pref }));
    }
}
