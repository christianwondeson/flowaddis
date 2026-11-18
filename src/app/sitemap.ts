import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://bookaddis.com').replace(/\/$/, '');
    const now = new Date();

    const staticRoutes: MetadataRoute.Sitemap = [
        {
            url: `${baseUrl}`,
            lastModified: now,
            changeFrequency: 'daily',
            priority: 1.0,
        },
        {
            url: `${baseUrl}/shuttles`,
            lastModified: now,
            changeFrequency: 'weekly',
            priority: 0.85,
        },
        {
            url: `${baseUrl}/conferences`,
            lastModified: now,
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/about`,
            lastModified: now,
            changeFrequency: 'monthly',
            priority: 0.6,
        },
        {
            url: `${baseUrl}/contact`,
            lastModified: now,
            changeFrequency: 'monthly',
            priority: 0.6,
        },
        {
            url: `${baseUrl}/help`,
            lastModified: now,
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${baseUrl}/terms`,
            lastModified: now,
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        {
            url: `${baseUrl}/privacy`,
            lastModified: now,
            changeFrequency: 'yearly',
            priority: 0.3,
        },
    ];

    // Attempt to include verified hotel landing pages
    let hotelRoutes: MetadataRoute.Sitemap = [];
    try {
        const backend = (process.env.BACKEND_URL || 'https://api-prod.bookaddis.com').replace(/\/$/, '');
        const res = await fetch(`${backend}/api/v1/hotels/search?limit=50`, {
            next: { revalidate: 86400 }, // cache for 24 hours
            signal: AbortSignal.timeout(5000),
        }).catch(() => null);

        if (res?.ok) {
            const data = await res.json().catch(() => null);
            const items = Array.isArray(data?.hotels)
                ? data.hotels
                : Array.isArray(data)
                  ? data
                  : data?.items || [];
            hotelRoutes = items
                .filter((h: any) => h?.id)
                .map((h: any) => ({
                    url: `${baseUrl}/hotels/${encodeURIComponent(h.id)}`,
                    lastModified: h.updated_at ? new Date(h.updated_at) : now,
                    changeFrequency: 'weekly' as const,
                    priority: 0.75,
                }));
        }
    } catch {
        /* fallback to static routes only if backend is unreachable */
    }

    return [...staticRoutes, ...hotelRoutes];
}
