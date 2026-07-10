/**
 * Pagina Contatti — fruttagest.it
 * 
 * Include il form di cattura Lead collegato al Master DB.
 */

import type { Metadata } from "next"
import Link from "next/link"
import { PublicHeader } from "@/components/layouts/public-header"
import { ContactForm } from "@/components/leads/contact-form"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronRight, Shield } from "lucide-react"

export const metadata: Metadata = {
  title: "Contatti — Richiedi una demo di FruttaGest",
  description:
    "Contatta FruttaGest per richiedere una demo personalizzata. Raccontaci la tua attività e ti mostreremo come il gestionale può aiutarti.",
  openGraph: {
    title: "Contatti — Richiedi una demo di FruttaGest",
    description:
      "Richiedi una demo personalizzata del gestionale ortofrutticolo FruttaGest.",
    url: "https://www.fruttagest.it/contact",
  },
  twitter: {
    title: "Contatti — Richiedi una demo di FruttaGest",
    description:
      "Richiedi una demo personalizzata del gestionale ortofrutticolo FruttaGest.",
  },
  alternates: {
    canonical: "https://www.fruttagest.it/contact",
  },
}

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-background">
      <PublicHeader />
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        
        <div className="text-center mb-16">
           <Badge variant="outline" className="rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 mb-4 px-4 py-1">
              Contatti & Demo
           </Badge>
           <h1 className="text-4xl lg:text-6xl font-black tracking-tight text-foreground">
             Parliamo del tuo <span className="bg-gradient-to-r from-emerald-500 to-blue-600 bg-clip-text text-transparent">successo</span>.
           </h1>
           <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
             Hai domande su FruttaGest o vuoi vedere una demo personalizzata per la tua azienda? 
             Compila il form e ti risponderemo il giorno stesso.
           </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
          
          {/* Colonna Form (3/5) */}
          <div className="lg:col-span-3">
             <ContactForm />
          </div>

          {/* Colonna Info (2/5) */}
          <div className="lg:col-span-2 space-y-8">
            
            <section className="bg-card/50 p-6 rounded-3xl border border-border/40 shadow-sm transition-all hover:bg-card">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold">
                  DF
                </div>
                <h2 className="text-lg font-bold text-foreground">Ideatore del progetto</h2>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                FruttaGest è stato ideato e sviluppato da <strong>Davide Fiore</strong> per digitalizzare 
                la filiera ortofrutticola italiana.
              </p>
              <Link
                href="https://davidefiore.com"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
              >
                Scopri di più su davidefiore.com
                <ChevronRight className="h-4 w-4" />
              </Link>
            </section>

            <section className="bg-card/50 p-6 rounded-3xl border border-border/40 shadow-sm transition-all hover:bg-card">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-10 w-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-600">
                  <Shield className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-bold text-foreground">Supporto Tecnico</h2>
              </div>
              <ul className="space-y-3">
                 {[
                   "Demo gratuite e personalizzate",
                   "Integrazioni API e listini",
                   "Supporto tecnico dedicato 24/7",
                   "Consulenza sulla digitalizzazione"
                 ].map((item, i) => (
                   <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {item}
                   </li>
                 ))}
              </ul>
            </section>

             <section className="bg-emerald-600 p-8 rounded-3xl text-white shadow-xl shadow-emerald-500/10">
                <h2 className="text-xl font-bold mb-2">Sei già cliente?</h2>
                <p className="text-white/80 text-sm mb-6">
                  Accedi direttamente alla tua area riservata per gestire ordini e catalogo.
                </p>
                <Link href="/login">
                  <Button variant="outline" className="w-full rounded-2xl bg-white/10 hover:bg-white text-white hover:text-emerald-700 border-white/20">
                    Vai al Login
                  </Button>
                </Link>
             </section>

          </div>
        </div>
      </div>
    </main>
  )
}
