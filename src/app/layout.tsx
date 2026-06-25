import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Poodle's Diary",
  description: "Feeding & pooping tracker for Poodle the Shih Tzu",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
