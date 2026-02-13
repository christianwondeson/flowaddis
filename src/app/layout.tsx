import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "BookAddis - Your Gateway to Ethiopia",
  description: "Hotels, Flights, Events, Car Rentals – Secure Payments & Bookings",
  icons: {
    icon: "/new-logo.ico",
    shortcut: "/new-logo.ico",
    apple: "/new-logo.ico",
  },
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
      <body
        className={`antialiased bg-brand-white font-sans text-brand-dark`}
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
