import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { AuthProvider } from "@/components/auth/auth-provider";
import { SITE_URL } from "@/lib/site";
import { en } from "@/i18n/en";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: en.app.name, template: `%s — ${en.app.name}` },
  description: en.app.tagline,
  openGraph: {
    title: en.app.name,
    description: en.app.tagline,
    type: "website",
    siteName: en.app.name,
  },
  twitter: { card: "summary", title: en.app.name, description: en.app.tagline },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <AuthProvider />
        {children}
      </body>
    </html>
  );
}
