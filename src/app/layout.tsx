/**
 * Root Layout — FruttaGest
 *
 * Layout radice con font Apple-style, metadata SEO,
 * toast notifications globali, command palette e tema dark/light.
 */

import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const siteUrl = "https://www.fruttagest.it"
const siteName = "FruttaGest"
const siteDescription =
  "Gestionale completo per la vendita di prodotti ortofrutticoli a ristoranti e supermercati. Ordini, DDT, fatture, gestione finanziaria."

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "FruttaGest — Gestionale Ortofrutticolo",
    template: "%s | FruttaGest",
  },
  description: siteDescription,
  keywords: [
    "gestionale",
    "ortofrutticolo",
    "frutta",
    "verdura",
    "ristoranti",
    "supermercati",
    "DDT",
    "fatture",
  ],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FruttaGest",
  },
  formatDetection: {
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "FruttaGest — Gestionale Ortofrutticolo",
    description: siteDescription,
    url: siteUrl,
    siteName: siteName,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "it_IT",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FruttaGest — Gestionale Ortofrutticolo",
    description: siteDescription,
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: siteUrl,
  },
}

import {
  SoftwareApplicationSchema,
  OrganizationSchema,
  FAQSchema,
} from "@/components/json-ld-schemas"
import { AuthProvider } from "@/providers/auth-provider"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#22c55e" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <SoftwareApplicationSchema />
        <OrganizationSchema />
        <FAQSchema />
      </head>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
        <div id="toast-portal" />
      </body>
    </html>
  )
}
