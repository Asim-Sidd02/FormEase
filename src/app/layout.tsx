import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SiteHeader, MobileTabBar } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Toaster } from "@/components/toast";
import { themeScript } from "@/components/theme";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "FormEase — Know what to do. Do it with confidence.",
    template: "%s · FormEase",
  },
  description:
    "Personalised, step-by-step guidance for passports, Aadhaar, PAN, driving licences and certificates in India. Independent, plain-language and source-backed.",
  applicationName: "FormEase",
  keywords: ["passport", "aadhaar", "pan card", "driving licence", "birth certificate", "income certificate", "india", "government process", "documents"],
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f7f6" },
    { media: "(prefers-color-scheme: dark)", color: "#0b110f" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${sans.variable} [--font-display:var(--font-sans)]`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh font-sans antialiased">
        <SiteHeader />
        <main id="main" className="min-h-[60vh]">
          {children}
        </main>
        <SiteFooter />
        <MobileTabBar />
        <Toaster />
      </body>
    </html>
  );
}
