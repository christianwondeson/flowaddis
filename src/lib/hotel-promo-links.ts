/**
 * Home / promo → hotels: open destination picker (no auto-search) with a typed hint
 * that filters the same LocationInput suggestions as the main hotel page.
 */
export function hotelsDestinationPickUrl(
    locationSearchHint: string,
    dateParams: URLSearchParams,
    extra?: Record<string, string | undefined>,
): string {
    const p = new URLSearchParams(dateParams.toString());
    p.set('query', locationSearchHint.trim());
    p.set('pickLocation', '1');
    if (extra) {
        for (const [k, v] of Object.entries(extra)) {
            if (v != null && v !== '') p.set(k, v);
        }
    }
    return `/hotels?${p.toString()}`;
}
