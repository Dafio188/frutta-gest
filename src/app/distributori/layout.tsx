import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "FruttaGest Distributori — Gestionale per distributori ortofrutticoli",
  description:
    "Il gestionale pensato per distributori di frutta e verdura. Ordini da WhatsApp con AI, gestione giri, DDT e fatture automatiche. Prova gratis.",
  openGraph: {
    title: "FruttaGest Distributori — Gestionale per distributori ortofrutticoli",
    description:
      "Ordini da WhatsApp con AI, gestione giri e consegne, listini personalizzati, fatturazione automatica.",
    url: "https://www.fruttagest.it/distributori",
  },
  alternates: {
    canonical: "https://www.fruttagest.it/distributori",
  },
}

export default function DistributoriLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
