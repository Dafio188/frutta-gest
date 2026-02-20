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

export const metadata: Metadata = {
  title: {
    default: "FruttaGest — Gestionale Ortofrutticolo",
    template: "%s | FruttaGest",
  },
  description:
    "Gestionale completo per la vendita di prodotti ortofrutticoli a ristoranti e supermercati. Ordini, DDT, fatture, gestione finanziaria.",
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
}

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
      </head>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        {children}
        <div id="toast-portal" />
      </body>
    </html>
  )
}
