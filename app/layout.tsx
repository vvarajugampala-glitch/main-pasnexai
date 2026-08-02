import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { VisitorTracker } from "./VisitorTracker";

export const metadata: Metadata = {
  metadataBase: new URL("https://pasnex.com"),
  title: {
    default: "Pasnex.ai | AI Automation Platform",
    template: "%s | Pasnex.ai",
  },
  description:
    "AI-powered social media and customer conversation automation for growing businesses.",
  keywords: [
    "AI automation",
    "Instagram automation",
    "WhatsApp automation",
    "social media automation",
    "customer conversation automation",
    "Pasnex.ai",
  ],
  authors: [{ name: "Pasnex.ai" }],
  creator: "Pasnex.ai",
  publisher: "Pasnex.ai",
  openGraph: {
    title: "Pasnex.ai | AI Automation Platform",
    description:
      "Automate Instagram, Facebook, WhatsApp and customer conversations with AI workflows that work 24/7.",
    url: "https://pasnex.com",
    siteName: "Pasnex.ai",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Pasnex.ai AI Automation Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pasnex.ai | AI Automation Platform",
    description:
      "AI-powered social media and customer conversation automation for growing businesses.",
    images: ["/opengraph-image"],
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/apple-icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
        <Suspense fallback={null}>
          <VisitorTracker />
        </Suspense>
      </body>
    </html>
  );
}
