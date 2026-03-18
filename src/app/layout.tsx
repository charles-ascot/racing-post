import type { Metadata } from "next";
import "./globals.css";

export const runtime = "edge";

export const metadata: Metadata = {
  title: "RPScrape Dashboard",
  description: "Horse Racing Data Scraper",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#E4E3E0] text-[#141414] font-sans">
        {children}
      </body>
    </html>
  );
}
