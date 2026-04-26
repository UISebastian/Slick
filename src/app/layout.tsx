import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Slick",
  description: "Signal-driven growth operating system for agencies"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
