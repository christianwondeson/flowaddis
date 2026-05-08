export { en, type Messages } from '../locales/en';
export { am } from '../locales/am';

import type { Messages } from '../locales/en';
import { en } from '../locales/en';
import { am } from '../locales/am';
import type { AppLocale } from '../config';

export function getMessages(locale: AppLocale): Messages {
    return locale === 'am' ? am : en;
}

export function getTranslation(messages: Messages, key: string): string {
    const parts = key.split('.');
    let cur: unknown = messages;
    for (const p of parts) {
        if (cur && typeof cur === 'object' && p in cur) {
            cur = (cur as Record<string, unknown>)[p];
        } else {
            return key;
        }
    }
    return typeof cur === 'string' ? cur : key;
}

/** Replace `{year}` style placeholders in translated strings. */
export function interpolate(template: string, vars: Record<string, string | number>): string {
    let out = template;
    for (const [k, v] of Object.entries(vars)) {
        out = out.replaceAll(`{${k}}`, String(v));
    }
    return out;
}
