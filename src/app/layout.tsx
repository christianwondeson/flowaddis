import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "FlowAddis - Your Gateway to Ethiopia",
  description: "Book flights, hotels, conferences, and shuttles in Ethiopia with ease. Your premium travel companion.",
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
