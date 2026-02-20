/**
 * Pagina Hub Report
 *
 * Punto di accesso a tutti i report disponibili.
 */

import Link from "next/link"
import { TrendingUp, BarChart3, PieChart, Users } from "lucide-react"

const reports = [
  {
    title: "Report Vendite",
    description: "Fatturato giornaliero, settimanale, mensile. Confronti periodo.",
    href: "/report/vendite",
    icon: TrendingUp,
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  {
    title: "Analisi Prodotti",
    description: "Prodotti più venduti, stagionalità, trend quantità.",
    href: "/report/prodotti",
    icon: BarChart3,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  {
    title: "Analisi Clienti",
    description: "Top clienti per fatturato, frequenza ordini, zona.",
    href: "/report/clienti",
    icon: Users,
    color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  },
  {
    title: "Margini di Profitto",
    description: "Margini per prodotto e cliente. Confronto costo/vendita.",
    href: "/report/margini",
    icon: PieChart,
    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
]

export default function ReportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Report</h1>
        <p className="text-muted-foreground mt-1">
          Analisi e statistiche del tuo business
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {reports.map((report) => (
          <Link
            key={report.href}
            href={report.href}
            className="group glass-card p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
          >
            <div className="flex items-start gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${report.color}`}>
                <report.icon className="h-6 w-6" strokeWidth={1.75} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                  {report.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {report.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
