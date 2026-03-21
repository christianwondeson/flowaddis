"use client";

import React, {
    createContext,
    useCallback,
    useContext,
    useLayoutEffect,
    useMemo,
    useState,
} from "react";
import {
    type ThemePreference,
    THEME_CHANGE_EVENT,
    readStoredThemePreference,
    resolveTheme,
    writeStoredThemePreference,
    applyDarkClassToHtml,
} from "@/lib/theme-storage";

export type ThemeContextValue = {
    preference: ThemePreference;
    resolvedTheme: "light" | "dark";
    setTheme: (pref: ThemePreference) => void;
};

const defaultThemeValue: ThemeContextValue = {
    preference: "light",
    resolvedTheme: "light",
    setTheme: () => {},
};

const ThemeContext = createContext<ThemeContextValue>(defaultThemeValue);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [preference, setPreferenceState] = useState<ThemePreference>("light");
    const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

    const syncFromPreference = useCallback((pref: ThemePreference) => {
        setPreferenceState(pref);
        setResolvedTheme(resolveTheme(pref));
    }, []);

    // Initial read + match <html> class to storage (with layout inline script).
    useLayoutEffect(() => {
        const pref = readStoredThemePreference();
        syncFromPreference(pref);
        applyDarkClassToHtml(pref === "dark");
    }, [syncFromPreference]);

    // Stay in sync when any code calls writeStoredThemePreference (e.g. Settings switch).
    useLayoutEffect(() => {
        const handler = (e: Event) => {
            const ce = e as CustomEvent<ThemePreference>;
            const pref = ce.detail;
            if (pref !== "light" && pref !== "dark") return;
            syncFromPreference(pref);
        };
        window.addEventListener(THEME_CHANGE_EVENT, handler);
        return () => window.removeEventListener(THEME_CHANGE_EVENT, handler);
    }, [syncFromPreference]);

    const setTheme = useCallback((pref: ThemePreference) => {
        writeStoredThemePreference(pref);
        syncFromPreference(pref);
    }, [syncFromPreference]);

    const value = useMemo(
        () => ({
            preference,
            resolvedTheme,
            setTheme,
        }),
        [preference, resolvedTheme, setTheme],
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
    return useContext(ThemeContext);
}
