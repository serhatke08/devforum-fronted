import type { Metadata } from "next";
import { Providers } from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "DevForum - Türkiye'nin En Büyük Yazılım ve Teknoloji Forumu",
  description: "DevForum, yazılım geliştiriciler, freelancerlar, tasarımcılar ve teknoloji meraklıları için Türkiye'nin en aktif forum platformu. Yazılım, tasarım, SEO, sosyal medya, freelance iş fırsatları ve daha fazlası için hemen katıl!",
  keywords: "yazılım forumu, programlama forumu, developer forum, freelance, web tasarım, mobil uygulama, SEO, Google Ads, sosyal medya, JavaScript, React, Python, Node.js, türkiye forum, teknoloji forumu",
  authors: [{ name: "DevForum" }],
  openGraph: {
    type: "website",
    url: "https://devforum.xyz/",
    siteName: "DevForum",
    title: "DevForum - Türkiye'nin En Büyük Yazılım ve Teknoloji Forumu",
    description: "Yazılım geliştiriciler, freelancerlar ve teknoloji meraklıları için Türkiye'nin en aktif forum platformu",
    images: [
      {
        url: "https://devforum.xyz/devmark-logo.png",
        width: 1200,
        height: 630,
        alt: "DevForum Logo"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "DevForum - Türkiye'nin En Büyük Yazılım ve Teknoloji Forumu",
    description: "Yazılım geliştiriciler, freelancerlar ve teknoloji meraklıları için Türkiye'nin en aktif forum platformu",
    images: ["https://devforum.xyz/devmark-logo.png"],
    creator: "@devforum"
  },
  alternates: {
    canonical: "https://devforum.xyz/"
  },
  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <head>
        {/* Favicons */}
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      </head>
      <body className="antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
