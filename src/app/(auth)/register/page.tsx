/**
 * Pagina Registrazione
 *
 * Form completo con validazione forte password,
 * OAuth Google, animazione staggerata.
 */

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { signIn } from "next-auth/react"
import { motion } from "framer-motion"
import { Mail, Lock, User, Eye, EyeOff, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { registerSchema } from "@/lib/validations"

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] as const } },
}

const passwordRules = [
  { label: "Almeno 8 caratteri", test: (p: string) => p.length >= 8 },
  { label: "Una lettera maiuscola", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Un numero", test: (p: string) => /[0-9]/.test(p) },
  { label: "Un carattere speciale", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
]

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const parsed = registerSchema.safeParse({ name, email, password })
    if (!parsed.success) {
      setError(parsed.error.issues[0].message)
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Errore durante la registrazione")
        return
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.ok) {
        const { getSession } = await import("next-auth/react")
        const session = await getSession()
        const dest = session?.user?.role === "CUSTOMER" ? "/portale" : "/dashboard"
        router.push(dest)
        router.refresh()
      }
    } catch {
      setError("Errore di connessione. Riprova.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="w-full max-w-md">
      <motion.div variants={fadeUp} className="glass-card p-8">
        <motion.div variants={fadeUp} className="flex flex-col items-center mb-8">
          <Image
            src="/LOGO.png"
            alt="FruttaGest"
            width={320}
            height={120}
            priority
            className="mb-4 h-20 w-auto"
          />
          <h1 className="text-2xl font-bold tracking-tight">Crea un account</h1>
          <p className="text-sm text-muted-foreground mt-1">Inizia a gestire la tua attivita</p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <motion.div variants={fadeUp}>
            <Input icon={User} placeholder="Nome e cognome" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
          </motion.div>
          <motion.div variants={fadeUp}>
            <Input icon={Mail} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          </motion.div>
          <motion.div variants={fadeUp}>
            <div className="relative">
              <Input
                icon={Lock}
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </motion.div>

          {password && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-1.5">
              {passwordRules.map((rule) => {
                const ok = rule.test(password)
                return (
                  <div key={rule.label} className="flex items-center gap-2 text-xs">
                    {ok ? <Check className="h-3 w-3 text-emerald-500" /> : <X className="h-3 w-3 text-muted-foreground" />}
                    <span className={ok ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}>{rule.label}</span>
                  </div>
                )
              })}
            </motion.div>
          )}

          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-destructive text-center">
              {error}
            </motion.p>
          )}

          <motion.div variants={fadeUp}>
            <Button type="submit" className="w-full" loading={loading}>
              Crea Account
            </Button>
          </motion.div>
        </form>

        <motion.div variants={fadeUp} className="relative my-6">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
            oppure
          </span>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Button variant="outline" className="w-full" onClick={() => signIn("google", { callbackUrl: "/dashboard" })} type="button">
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continua con Google
          </Button>
        </motion.div>

        <motion.p variants={fadeUp} className="text-center text-sm text-muted-foreground mt-6">
          Hai gia un account?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">Accedi</Link>
        </motion.p>
      </motion.div>
    </motion.div>
  )
}
