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
import { Header } from "@/components/shared/header";
import { Footer } from "@/components/shared/footer";

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
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
