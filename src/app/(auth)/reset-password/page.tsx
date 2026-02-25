/**
 * Pagina Reimposta Password
 */

"use client"

import { useState, use } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Lock, Leaf, ArrowLeft, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { updatePassword } from "@/lib/actions"
import { useRouter } from "next/navigation"

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] as const } },
}

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const params = use(searchParams)
  const token = params.token
  const router = useRouter()

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!token) {
      setError("Token mancante o non valido")
      return
    }

    if (password !== confirmPassword) {
      setError("Le password non coincidono")
      return
    }

    setLoading(true)
    try {
      await updatePassword({ token, password, confirmPassword })
      setSuccess(true)
      setTimeout(() => {
        router.push("/login")
      }, 3000)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Si è verificato un errore. Riprova.")
      }
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-xl font-bold text-destructive mb-4">Link non valido</h1>
        <p className="mb-4">Il link per il reset della password non è valido o è scaduto.</p>
        <Link href="/login">
          <Button variant="outline">Torna al login</Button>
        </Link>
      </div>
    )
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="w-full max-w-md">
      <motion.div variants={fadeUp} className="glass-card p-8">
        <motion.div variants={fadeUp} className="flex flex-col items-center mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-md)] mb-4">
            <Leaf className="h-8 w-8" strokeWidth={1.75} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {success ? "Password aggiornata" : "Nuova password"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1 text-center">
            {success
              ? "La tua password è stata aggiornata con successo"
              : "Inserisci la nuova password per il tuo account"}
          </p>
        </motion.div>

        {success ? (
          <motion.div variants={fadeUp} className="flex flex-col items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Sarai reindirizzato al login tra pochi secondi...
            </p>
            <Link href="/login">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Vai al login
              </Button>
            </Link>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <motion.div variants={fadeUp}>
              <Input
                icon={Lock}
                type="password"
                placeholder="Nuova password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </motion.div>

            <motion.div variants={fadeUp}>
              <Input
                icon={Lock}
                type="password"
                placeholder="Conferma password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </motion.div>

            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-destructive text-center">
                {error}
              </motion.p>
            )}

            <motion.div variants={fadeUp}>
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? "Aggiornamento in corso..." : "Reimposta password"}
              </Button>
            </motion.div>
          </form>
        )}
      </motion.div>
    </motion.div>
  )
}
