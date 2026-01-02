import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "FlowAddis",
  description: "Book flights, hotels, conferences, and shuttles with ease.",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
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
