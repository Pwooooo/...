import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EntropyTube - Video Sharing Platform",
  description: "Next-generation video streaming and sharing platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#0f0f0f] text-zinc-100 font-sans">
        {children}
      </body>
    </html>
  );
}
