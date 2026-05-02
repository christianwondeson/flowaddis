/** URL-safe slug for Strapi `slug` / UIDs. */
export function slugifyName(name: string): string {
    const s = name
        .trim()
        .toLowerCase()
        .replace(/['"]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return s || `item-${Date.now()}`;
}
