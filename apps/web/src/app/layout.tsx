import type { Metadata } from "next";
import { Outfit } from "next/font/google"; // Premium modern font
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Submail - Premium Email Alias System",
  description: "Secure, Discord-gated email forwarding for communities.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${outfit.className} antialiased min-h-screen selection:bg-indigo-500/30`}>
        {children}
      </body>
    </html>
  );
}
