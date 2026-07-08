import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "FruttaGest Grossisti — Gestionale per grossisti ortofrutticoli",
  description:
    "Il gestionale per grossisti di frutta e verdura: vendita al banco, gestione stoccaggio e lotti, contabilità semplificata, resi e sconti.",
  openGraph: {
    title: "FruttaGest Grossisti — Gestionale per grossisti ortofrutticoli",
    description:
      "Vendita al banco veloce, gestione stoccaggio e lotti, contabilità semplificata, resi e sconti.",
    url: "https://www.fruttagest.it/grossisti",
  },
  alternates: {
    canonical: "https://www.fruttagest.it/grossisti",
  },
}

export default function GrossistiLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
