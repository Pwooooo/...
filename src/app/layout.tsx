import type { Metadata } from "next";
import { Titillium_Web } from "next/font/google";
import "./globals.css";

const titilliumWeb = Titillium_Web({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  variable: "--font-titillium",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Entropy",
  description: "Next-generation video streaming platform",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/entropy-icon.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/entropy-icon.png",
    apple: "/entropy-icon.png",
  },
};

import { AuthProvider } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { MiniPlayerProvider } from "@/context/MiniPlayerContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark h-full antialiased ${titilliumWeb.variable}`}>
      <head>
        <meta name="theme-color" content="#191b20" />
        <link rel="icon" href="/entropy-icon.png" type="image/png" sizes="any" />
        <link rel="shortcut icon" href="/entropy-icon.png" />
        <link rel="apple-touch-icon" href="/entropy-icon.png" />
      </head>
      <body className={`min-h-full flex flex-col bg-background text-foreground ${titilliumWeb.className} selection:bg-[#e2e4e9] selection:text-[#141519]`}>
        {/* Subtle matte vignette & micro-grain for a softer gray canvas */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[35] bg-[radial-gradient(ellipse_90%_80%_at_55%_20%,rgba(255,255,255,0.02)_0%,transparent_60%,rgba(0,0,0,0.22)_100%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[35] bg-matte-grain opacity-[0.028]"
        />
        <AuthProvider>
          <NotificationProvider>
            <MiniPlayerProvider>{children}</MiniPlayerProvider>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
