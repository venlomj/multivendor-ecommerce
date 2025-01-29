// Next.js
import type { Metadata } from "next";
import { Geist, Barlow } from "next/font/google";

// Global css
import "./globals.css";

// Theme Provider
import { ThemeProvider } from "next-themes";

// Fonts
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

const barlowFont = Barlow({
  subsets: ['latin'],
  weight: ['500', '700'],
  variable: "--font-barlow",
});

// Metadata
export const metadata: Metadata = {
  title: "MulTiShop - Your Multivendor Ecommerce Platform",
  description: "MulTiShop is a powerful multivendor eCommerce platform that connects buyers and sellers seamlessly. Shop from multiple vendors, manage your store, and grow your business with ease.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Add the SVG favicon link */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body
        className={`${geistSans.variable} ${barlowFont.variable} antialiased`}
      >
        <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange>
        {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
