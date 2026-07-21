import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Amala Curriculum",
  description:
    "A design tool with the curriculum built in — understand, navigate, and design transformative learning.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}
