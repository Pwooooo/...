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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark h-full antialiased ${titilliumWeb.variable}`}>
      <body className={`min-h-full flex flex-col bg-black text-white ${titilliumWeb.className} selection:bg-white selection:text-black`}>
        {children}
      </body>
    </html>
  );
}
