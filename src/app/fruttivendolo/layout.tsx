import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "FruttaGest Fruttivendolo — Gestionale per negozi di frutta e verdura",
  description:
    "Il gestionale per fruttivendoli: punto cassa smart, fidelity card, e-commerce locale e gestione scarti. Prova il software per il tuo negozio.",
  openGraph: {
    title: "FruttaGest Fruttivendolo — Gestionale per negozi ortofrutticoli",
    description:
      "Punto cassa smart, fidelity card clienti, e-commerce locale e gestione scarti per il tuo negozio.",
    url: "https://www.fruttagest.it/fruttivendolo",
  },
  twitter: {
    title: "FruttaGest Fruttivendolo — Gestionale per negozi ortofrutticoli",
    description:
      "Punto cassa smart, fidelity card clienti, e-commerce locale e gestione scarti per il tuo negozio.",
  },
  alternates: {
    canonical: "https://www.fruttagest.it/fruttivendolo",
  },
}

export default function FruttivendoloLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
