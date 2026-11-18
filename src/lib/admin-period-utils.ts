import { formatDateLocal } from '@/lib/date-utils';

export type PeriodPreset =
    | 'this_month'
    | 'last_month'
    | 'last_3_months'
    | 'this_year'
    | 'custom';

export const PERIOD_PRESETS: { id: PeriodPreset; label: string }[] = [
    { id: 'this_month', label: 'This month' },
    { id: 'last_month', label: 'Last month' },
    { id: 'last_3_months', label: 'Last 3 months' },
    { id: 'this_year', label: 'This year' },
    { id: 'custom', label: 'Custom' },
];

/** First and last calendar day of the month containing `date`. */
export function monthBounds(date = new Date()) {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return { start, end };
}

export function defaultLastMonthRange() {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    const { start, end } = monthBounds(d);
    return {
        from: formatDateLocal(start),
        to: formatDateLocal(end),
    };
}

export function presetToRange(preset: Exclude<PeriodPreset, 'custom'>): {
    from: string;
    to: string;
} {
    const now = new Date();
    switch (preset) {
        case 'this_month': {
            const { start, end } = monthBounds(now);
            return { from: formatDateLocal(start), to: formatDateLocal(end) };
        }
        case 'last_month': {
            const d = new Date(now);
            d.setMonth(d.getMonth() - 1);
            const { start, end } = monthBounds(d);
            return { from: formatDateLocal(start), to: formatDateLocal(end) };
        }
        case 'last_3_months': {
            const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
            return { from: formatDateLocal(start), to: formatDateLocal(end) };
        }
        case 'this_year':
            return {
                from: `${now.getFullYear()}-01-01`,
                to: formatDateLocal(new Date(now.getFullYear(), 11, 31)),
            };
    }
}

export function detectPreset(from: string, to: string): PeriodPreset {
    if (!from || !to) return 'custom';
    for (const { id } of PERIOD_PRESETS) {
        if (id === 'custom') continue;
        const range = presetToRange(id);
        if (range.from === from && range.to === to) return id;
    }
    return 'custom';
}

export const ADMIN_MIN_DATE = new Date(2020, 0, 1);
