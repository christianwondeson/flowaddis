import type { Metadata } from "next";
import Script from "next/script";
import { cookies } from "next/headers";
import "../styles/globals.css";
import { Providers } from "@/components/providers";
import { PublicLayout } from "@/components/layout/public-layout";
import { LOCALE_COOKIE_NAME, resolveLocale, type AppLocale } from "@/lib/i18n/config";

export const metadata: Metadata = {
  title: "BookAddis - Your Gateway to Ethiopia",
  description: "Hotels, Flights, Events, Car Rentals – Secure Payments & Bookings",
  icons: {
    icon: "/assets/images/logo.png",
    shortcut: "/assets/images/logo.png",
    apple: "/assets/images/logo.png",
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
