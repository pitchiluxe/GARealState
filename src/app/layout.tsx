import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const APP_URL = process.env.NEXTAUTH_URL || "https://garealstate.vercel.app";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#0A0F1E",
};

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "GA Real Estate Academy — AI Exam Prep by Erick OMARI",
    template: "%s | GA Real Estate Academy",
  },
  description: "AI-powered Georgia Real Estate certification exam prep. Study with an AI copilot, practice tests, law updates, and interactive knowledge graphs.",
  keywords: [
    "Georgia Real Estate exam prep",
    "GREC license exam",
    "GA real estate practice test",
    "Georgia salesperson license",
    "real estate certification Georgia",
    "AI exam prep",
  ],
  authors: [{ name: "Erick OMARI" }],
  creator: "Erick OMARI",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  icons: {
    icon: "/icon.jpg",
    apple: "/icon.jpg",
    shortcut: "/icon.jpg",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: APP_URL,
    siteName: "GA Real Estate Academy",
    title: "GA Real Estate Academy — AI Exam Prep",
    description: "Pass your Georgia Real Estate exam with AI-powered study tools, practice tests, and real-time coaching.",
    images: [{ url: "/icon.jpg", width: 512, height: 512, alt: "GA Real Estate Academy" }],
  },
  twitter: {
    card: "summary",
    title: "GA Real Estate Academy — AI Exam Prep",
    description: "Pass your Georgia Real Estate exam with AI-powered study tools and practice tests.",
    images: ["/icon.jpg"],
    creator: "@ErickOMARI",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <body className="bg-surface-base text-white antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
