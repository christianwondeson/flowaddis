import type { Metadata } from "next";
import Script from "next/script";
import { cookies } from "next/headers";
import "../styles/globals.css";
import { Providers } from "@/components/providers";
import { PublicLayout } from "@/components/layout/public-layout";
import { LOCALE_COOKIE_NAME, resolveLocale, type AppLocale } from "@/lib/i18n/config";
import { RootJsonLd } from "@/components/seo/json-ld";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bookaddis.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "BookAddis | Hotels, Airport Shuttles & Conferences in Ethiopia",
    template: "%s | BookAddis",
  },
  description:
    "Book verified hotels, reliable Bole airport shuttles, and premier conference venues across Addis Ababa and Ethiopia. Pay securely with CBE Birr, Telebirr, or Mastercard / Visa.",
  keywords: [
    "Hotels in Addis Ababa",
    "Addis Ababa hotel booking",
    "Bole Airport Shuttle",
    "Addis Ababa Accommodation",
    "Ethiopia Hotel Booking",
    "Conference Venues Addis Ababa",
    "BookAddis",
    "CBE Birr hotel payment",
    "Telebirr hotel",
    "አዲስ አበባ ሆቴሎች",
    "የጉዞ እና ሆቴል ቦታ ማስያዣ",
  ],
  authors: [{ name: "BookAddis", url: siteUrl }],
  creator: "BookAddis",
  publisher: "BookAddis",
  formatDetection: {
    email: true,
    address: true,
    telephone: true,
  },
  alternates: {
    canonical: "/",
    languages: {
      "en-US": "/?lang=en",
      "am-ET": "/?lang=am",
    },
  },
  openGraph: {
    title: "BookAddis | Hotels, Airport Shuttles & Conferences in Ethiopia",
    description:
      "Find and reserve verified hotels, Bole airport transfers, and event spaces in Addis Ababa. Pay on arrival or prepay online.",
    url: siteUrl,
    siteName: "BookAddis",
    images: [
      {
        url: "/assets/images/addis-ababa-night.webp",
        width: 1200,
        height: 630,
        alt: "BookAddis - Explore Addis Ababa Hotels and Accommodations",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BookAddis | Hotels, Airport Shuttles & Conferences in Ethiopia",
    description:
      "Book verified hotels and conference halls in Addis Ababa. Pay with CBE Birr, Telebirr, or Card.",
    images: ["/assets/images/addis-ababa-night.webp"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "googleaea07ee726f620ab",
  },
  other: {
    "geo.region": "ET-AA",
    "geo.placename": "Addis Ababa",
    "geo.position": "9.005401;38.763611",
    "ICBM": "9.005401, 38.763611",
  },
  icons: {
    icon: "/assets/images/favicon-32.png",
    shortcut: "/assets/images/favicon-32.png",
    apple: "/assets/images/logo-192.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover" as const,
};

function htmlLang(locale: AppLocale): string {
  return locale === "am" ? "am" : "en";
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const initialLocale = resolveLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);

  return (
    <html lang={htmlLang(initialLocale)} suppressHydrationWarning>
      <head>
        <RootJsonLd />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Noto+Sans+Ethiopic:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <Script src="/theme-init.js" strategy="beforeInteractive" />
      </head>
      <body
        className={`antialiased font-sans bg-background text-foreground min-h-screen ${initialLocale === "am" ? "font-ethiopic" : ""}`}
        suppressHydrationWarning
      >
        <Providers initialLocale={initialLocale}>
          <PublicLayout>{children}</PublicLayout>
        </Providers>
      </body>
    </html>
  );
}
