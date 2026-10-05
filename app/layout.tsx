import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { AppHeader } from "@/components/app-header";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "単語帳",
  description: "覚え具合で3カテゴリーに分けて、テストで復習できる単語帳",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${geistMono.variable} antialiased`}>
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/gen-interface-jp@latest/cdn/400.css"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/gen-interface-jp@latest/cdn/500.css"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/gen-interface-jp@latest/cdn/700.css"
        />
      </head>
      <body className="min-h-dvh">
        <AppHeader />
        <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
