export const LOCALE_COOKIE_NAME = 'BOOKADDIS_LOCALE';

export const SUPPORTED_LOCALES = ['en', 'am'] as const;

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = 'en';

export function isAppLocale(value: string | undefined): value is AppLocale {
    return value === 'en' || value === 'am';
}

export function resolveLocale(raw: string | undefined | null): AppLocale {
    const v = raw ?? undefined;
    if (isAppLocale(v)) return v;
    return DEFAULT_LOCALE;
}
