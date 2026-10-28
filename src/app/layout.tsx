import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Fonts are self-hosted (latin subset, WOFF2) so builds don't depend on Google Fonts
// and pages stay light on slow connections. Licences: src/app/fonts/LICENSE-*.txt (SIL OFL).
const display = localFont({
  src: "./fonts/big-shoulders-var.woff2",
  variable: "--font-display",
  weight: "100 900",
  display: "swap",
  fallback: ["Arial Narrow", "Impact", "sans-serif"],
});

const body = localFont({
  src: [
    { path: "./fonts/atkinson-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/atkinson-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-body",
  display: "swap",
  fallback: ["Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "HiveConcerts", template: "%s · HiveConcerts" },
  description:
    "Propose the live shows you want in your city, back them, and help make them happen.",
  openGraph: { siteName: "HiveConcerts", type: "website" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ECEBF3" },
    { media: "(prefers-color-scheme: dark)", color: "#15122B" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} antialiased`}>{children}</body>
    </html>
  );
}
