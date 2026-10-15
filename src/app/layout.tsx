import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col bg-black text-white font-sans selection:bg-white selection:text-black">
        {children}
      </body>
    </html>
  );
}
