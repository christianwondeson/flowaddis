/**
 * Formats a Date object to YYYY-MM-DD in local time.
 */
export function formatDateLocal(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Parses a YYYY-MM-DD string into a Date object at midnight local time.
 */
export function parseDateLocal(dateStr: string): Date {
    if (!dateStr) return new Date();
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
}

/**
 * Formats a Date object to a concise English string: e.g., "Sun, Jan 4, 2026".
 */
export function formatDateEnglish(date: Date): string {
    try {
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    } catch {
        // Fallback formatting
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    }
}

/**
 * Convenience: Formats a YYYY-MM-DD string into English string, if possible.
 */
export function formatDateEnglishStr(dateStr?: string): string {
    if (!dateStr) return '';
    const d = parseDateLocal(dateStr);
    return formatDateEnglish(d);
}

/**
 * Formats a date range for display: "Oct 25 - Nov 1" (mockup style).
 */
export function formatDateRangeShort(checkIn?: string, checkOut?: string): string {
    if (!checkIn || !checkOut) return 'Select dates';
    const d1 = parseDateLocal(checkIn);
    const d2 = parseDateLocal(checkOut);
    const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${fmt(d1)} - ${fmt(d2)}`;
}
