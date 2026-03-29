/**
 * Lead Contact Form — Componente Client per fruttagest.it
 * 
 * Raccoglie i dati dei prospect e li salva nel Master DB come Lead.
 */

"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Loader2, Send, Sparkles } from "lucide-react"

// Schema Validazione
const contactSchema = z.object({
  name: z.string().min(2, "Il nome è troppo breve"),
  email: z.string().email("Email non valida"),
  company: z.string().optional(),
  phone: z.string().optional(),
  message: z.string().min(10, "Il messaggio deve avere almeno 10 caratteri"),
})

type ContactValues = z.infer<typeof contactSchema>

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const form = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      phone: "",
      message: "",
    },
  })

  async function onSubmit(data: ContactValues) {
    setIsSubmitting(true)
    try {
      // Nota: Questa azione richiederà una route API pubblica o una Server Action NON protetta da requireSuperAdmin
      const response = await fetch("/api/public/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error("Errore durante l'invio")

      setIsSuccess(true)
      toast.success("Richiesta inviata con successo! Ti contatteremo presto.")
      form.reset()
    } catch (error) {
      toast.error("Si è verificato un errore. Riprova più tardi.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-3xl p-10 text-center space-y-4 animate-in fade-in zoom-in duration-500">
        <div className="h-16 w-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white">
          <Sparkles className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">Grazie {form.getValues("name")}!</h2>
        <p className="text-emerald-700 dark:text-emerald-400 max-w-sm mx-auto text-sm leading-relaxed">
          Abbiamo ricevuto la tua richiesta per FruttaGest. Davide ti contatterà al più presto 
          all'indirizzo <strong>{form.getValues("email")}</strong>.
        </p>
        <Button 
           variant="outline" 
           className="mt-4 rounded-full" 
           onClick={() => setIsSuccess(false)}
        >
          Invia un'altra richiesta
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border/50 shadow-2xl rounded-3xl p-6 lg:p-8">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Nome Completo *</label>
            <Input 
               {...form.register("name")} 
               placeholder="Mario Rossi" 
               className="rounded-xl bg-muted/30 border-none focus-visible:ring-emerald-500"
            />
            {form.formState.errors.name && <p className="text-destructive text-[10px] font-bold ml-1">{form.formState.errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Email Aziendale *</label>
            <Input 
               {...form.register("email")} 
               type="email" 
               placeholder="mario@azienda.it" 
               className="rounded-xl bg-muted/30 border-none focus-visible:ring-emerald-500"
            />
            {form.formState.errors.email && <p className="text-destructive text-[10px] font-bold ml-1">{form.formState.errors.email.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Azienda (opzionale)</label>
            <Input 
               {...form.register("company")} 
               placeholder="F.lli Rossi Ortofrutta" 
               className="rounded-xl bg-muted/30 border-none focus-visible:ring-emerald-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Telefono (opzionale)</label>
            <Input 
               {...form.register("phone")} 
               type="tel" 
               placeholder="+39 333 1234567" 
               className="rounded-xl bg-muted/30 border-none focus-visible:ring-emerald-500"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Messaggio o Domande *</label>
          <Textarea 
             {...form.register("message")} 
             placeholder="Raccontaci brevemente di cosa si occupa la tua azienda e quali moduli ti interessano..." 
             className="rounded-2xl bg-muted/30 border-none min-h-[120px] focus-visible:ring-emerald-500 resize-none"
          />
          {form.formState.errors.message && <p className="text-destructive text-[10px] font-bold ml-1">{form.formState.errors.message.message}</p>}
        </div>

        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Invio in corso...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Richiedi Informazioni
            </>
          )}
        </Button>
        <p className="text-[10px] text-center text-muted-foreground py-2">
          Inviando accetti la nostra Informativa sulla Privacy. Risponderemo entro 24/48h.
        </p>
      </form>
    </div>
  )
}
