import { parseDateLocal } from '@/lib/date-utils';

/** Calendar / table day: "Aug 1, 2026" */
export function formatAdminDate(
    value?: string | Date | null,
    opts?: { weekday?: boolean },
): string {
    if (value == null || value === '') return '';
    const d =
        value instanceof Date
            ? value
            : /^\d{4}-\d{2}-\d{2}$/.test(value)
              ? parseDateLocal(value)
              : new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    try {
        return d.toLocaleDateString('en-US', {
            ...(opts?.weekday ? { weekday: 'short' as const } : {}),
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    } catch {
        const months = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
        ];
        return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    }
}

/** Admin tables with time: "Aug 1, 2026, 11:45 AM" */
export function formatAdminDateTime(value?: string | Date | null): string {
    if (value == null || value === '') return '';
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    try {
        return d.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });
    } catch {
        return formatAdminDate(d);
    }
}

/** Month picker label: "August 2026" */
export function formatAdminMonth(ym: string): string {
    const [y, m] = ym.split('-').map(Number);
    if (!y || !m) return ym;
    return new Date(y, m - 1, 1).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
    });
}
