'use client';

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import {
    LOCALE_COOKIE_NAME,
    type AppLocale,
    resolveLocale,
    DEFAULT_LOCALE,
} from '@/lib/i18n/config';
import { getMessages, getTranslation, interpolate } from '@/lib/i18n/messages';

type LocaleContextValue = {
    locale: AppLocale;
    /** Persist preference and refresh server components (cookie + router.refresh). */
    setLocale: (locale: AppLocale) => void;
    /** Dot-path key into messages, e.g. `nav.flights`. */
    t: (key: string, vars?: Record<string, string | number>) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
    initialLocale,
    children,
}: {
    initialLocale: AppLocale;
    children: ReactNode;
}) {
    const router = useRouter();
    const [locale, setLocaleState] = useState<AppLocale>(() => resolveLocale(initialLocale));

    useEffect(() => {
        setLocaleState(resolveLocale(initialLocale));
    }, [initialLocale]);

    const messages = useMemo(() => getMessages(locale), [locale]);

    const setLocale = useCallback(
        (next: AppLocale) => {
            document.cookie = `${LOCALE_COOKIE_NAME}=${next};path=/;max-age=31536000;SameSite=Lax${
                typeof window !== 'undefined' && window.location.protocol === 'https:' ? ';Secure' : ''
            }`;
            setLocaleState(next);
            router.refresh();
        },
        [router],
    );

    const t = useCallback(
        (key: string, vars?: Record<string, string | number>) => {
            const raw = getTranslation(messages, key);
            return vars ? interpolate(raw, vars) : raw;
        },
        [messages],
    );

    const value = useMemo(
        () => ({ locale, setLocale, t }),
        [locale, setLocale, t],
    );

    return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocaleContext(): LocaleContextValue {
    const ctx = useContext(LocaleContext);
    if (!ctx) {
        throw new Error('useLocaleContext must be used within LocaleProvider');
    }
    return ctx;
}

/** Hook for translated strings and locale switching. Works without provider using English fallbacks. */
export function useTranslations() {
    const ctx = useContext(LocaleContext);
    const messages = useMemo(() => getMessages(ctx?.locale ?? DEFAULT_LOCALE), [ctx?.locale]);

    const t = useCallback(
        (key: string, vars?: Record<string, string | number>) => {
            const raw = getTranslation(messages, key);
            return vars ? interpolate(raw, vars) : raw;
        },
        [messages],
    );

    if (!ctx) {
        return {
            locale: DEFAULT_LOCALE,
            setLocale: (_next: AppLocale) => {
                /* no provider */
            },
            t,
        };
    }

    return { locale: ctx.locale, setLocale: ctx.setLocale, t: ctx.t };
}
