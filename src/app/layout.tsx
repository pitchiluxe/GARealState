import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "GA Real Estate Academy — by Erick OMARI",
  description: "AI-powered Georgia Real Estate certification exam prep platform. Created by Erick OMARI.",
  icons: {
    icon: "/icon.jpg",
    apple: "/icon.jpg",
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
