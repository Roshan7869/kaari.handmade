import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import Navbar from "@/components/Navbar";
import KaariFooter from "@/components/KaariFooter";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kaari Marketplace - Handmade Crochet Products",
  description: "Discover unique handmade crochet products crafted with love. Shop custom designs, artisanal crafts, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <Providers>
          <Navbar />
          <main className="min-h-screen">
            {children}
          </main>
          <KaariFooter />
        </Providers>
      </body>
    </html>
  );
}
