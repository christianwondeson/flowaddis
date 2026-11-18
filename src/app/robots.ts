import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bookaddis.com';

    return {
        rules: [
            {
                userAgent: '*',
                allow: [
                    '/',
                    '/hotels',
                    '/hotels/*',
                    '/shuttles',
                    '/conferences',
                    '/about',
                    '/contact',
                    '/help',
                    '/terms',
                    '/privacy',
                ],
                disallow: [
                    '/admin/',
                    '/api/',
                    '/profile/',
                    '/dashboard/',
                    '/booking/',
                    '/partner/pending',
                    '/settings/',
                    '/_next/',
                ],
            },
        ],
        sitemap: `${baseUrl.replace(/\/$/, '')}/sitemap.xml`,
        host: baseUrl,
    };
}
