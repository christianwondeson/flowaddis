import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "BookAddis - Your Gateway to Ethiopia",
  description: "Hotels, Flights, Events, Car Rentals – Secure Payments & Bookings",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover" as const,
};

import { Providers } from "@/components/providers";
import { PublicLayout } from "@/components/layout/public-layout";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body
        className="antialiased font-sans text-slate-900"
        style={{ backgroundColor: '#F8FAFC' }}
      >
        <Providers>
          <PublicLayout>
            {children}
          </PublicLayout>
        </Providers>
      </body>
    </html>
  );
}
