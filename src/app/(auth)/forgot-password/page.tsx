/**
 * Pagina Recupero Password
 */

"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Mail, Leaf, ArrowLeft, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { forgotPasswordSchema } from "@/lib/validations"
import { resetPassword } from "@/lib/actions"

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] as const } },
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const parsed = forgotPasswordSchema.safeParse({ email })
    if (!parsed.success) {
      setError(parsed.error.issues[0].message)
      return
    }

    setLoading(true)
    try {
      await resetPassword(email)
      setSent(true)
    } catch {
      setError("Errore durante l'invio. Riprova.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="w-full max-w-md">
      <motion.div variants={fadeUp} className="glass-card p-8">
        <motion.div variants={fadeUp} className="flex flex-col items-center mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-md)] mb-4">
            <Leaf className="h-8 w-8" strokeWidth={1.75} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {sent ? "Email inviata" : "Recupera password"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1 text-center">
            {sent
              ? "Controlla la tua casella email per il link di reset"
              : "Inserisci la tua email per ricevere il link di reset"}
          </p>
        </motion.div>

        {sent ? (
          <motion.div variants={fadeUp} className="flex flex-col items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Se l&apos;email <strong>{email}</strong> e associata a un account, riceverai un link per reimpostare la password.
            </p>
            <Link href="/login">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Torna al login
              </Button>
            </Link>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <motion.div variants={fadeUp}>
              <Input
                icon={Mail}
                type="email"
                placeholder="La tua email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </motion.div>

            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-destructive text-center">
                {error}
              </motion.p>
            )}

            <motion.div variants={fadeUp} className="space-y-3">
              <Button type="submit" className="w-full" loading={loading}>
                Invia link di reset
              </Button>
              <Link href="/login" className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Torna al login
              </Link>
            </motion.div>
          </form>
        )}
      </motion.div>
    </motion.div>
  )
}
