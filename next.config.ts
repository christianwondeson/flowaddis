import type { NextConfig } from "next";

/**
 * Mitigates XSS impact on first-party cookies (including Stripe Radar cookies, which
 * cannot be HttpOnly because Stripe.js must read them).
 */
function buildContentSecurityPolicy(isDev: boolean): string {
  // Next.js App Router emits inline bootstrap/hydration scripts in production HTML; without
  // 'unsafe-inline' or per-build hashes/nonces, the browser blocks them (dev worked because
  // NODE_ENV=development used the looser branch). See: https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy
  const scriptSrc = isDev
    ? "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://www.google.com https://www.gstatic.com https://apis.google.com https://www.googletagmanager.com https://www.recaptcha.net"
    : "script-src 'self' 'unsafe-inline' https://js.stripe.com https://www.google.com https://www.gstatic.com https://apis.google.com https://www.googletagmanager.com https://www.recaptcha.net";

  const parts = [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://api.bookaddis.com https://cms.bookaddis.com https://api.stripe.com https://m.stripe.network https://*.stripe.com https://*.googleapis.com https://*.gstatic.com https://www.google-analytics.com https://www.googletagmanager.com https://firebase.googleapis.com https://securetoken.googleapis.com https://identitytoolkit.googleapis.com https://firestore.googleapis.com https://firebaseinstallations.googleapis.com https://www.recaptcha.net wss://*.firebaseio.com https://*.firebaseio.com wss://*.googleapis.com",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://www.google.com https://www.recaptcha.net https://recaptcha.google.com",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://checkout.stripe.com",
    "frame-ancestors 'self'",
  ];
  if (!isDev) {
    parts.push("upgrade-insecure-requests");
  }
  return parts.join("; ");
}

const nextConfig: NextConfig = {
  output: 'standalone',
  async headers() {
    const isDev = process.env.NODE_ENV !== 'production';
    const csp = buildContentSecurityPolicy(isDev);
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          ...(isDev
            ? []
            : [
                {
                  key: 'Strict-Transport-Security',
                  value: 'max-age=63072000; includeSubDomains; preload',
                },
              ]),
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
        ],
      },
    ];
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.booking.com',
      },
      {
        protocol: 'https',
        hostname: '**.bstatic.com',
      },
    ],
  },
};

export default nextConfig;
