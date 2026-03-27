"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { signIn, useSession } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import { Mail, Lock, User, Eye, EyeOff, Check, X, ArrowRight, ArrowLeft } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { loginSchema, registerSchema } from "@/lib/validations"
import { cn } from "@/lib/utils"

interface AuthUnifiedProps {
  initialMode?: "login" | "register" | "forgot"
}

export default function AuthUnified({ initialMode = "login" }: AuthUnifiedProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"
  const [mode, setMode] = useState<"login" | "register" | "forgot">(initialMode)
  
  // Transition logic
  const toggleMode = () => setMode(prev => prev === "login" ? "register" : "login")
  const goToForgot = () => setMode("forgot")
  const goToLogin = () => setMode("login")

  return (
    <div className="w-full flex justify-center p-4">
      <motion.div 
        layout
        className="relative w-full max-w-4xl min-h-[640px] glass-card overflow-hidden flex flex-col md:flex-row shadow-2xl rounded-[24px]"
      >
        {/* Animated Background Overlay (Desktop Only) */}
        <motion.div
          initial={false}
          animate={{ x: mode === "login" || mode === "forgot" ? "100%" : "0%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="absolute inset-0 w-1/2 z-20 hidden md:flex flex-col items-center justify-center p-12 text-white overflow-hidden"
        >
          <div className="absolute inset-0 z-0">
             <Image 
               src="/auth_accent_bg_1774527767182.png" 
               alt="Background" 
               fill 
               className="object-cover scale-110 brightness-[0.7] saturate-[1.2] opacity-40 mix-blend-overlay"
               priority
             />
             <div className="absolute inset-0 bg-emerald-600 shadow-inner" />
          </div>

          <svg width="0" height="0" className="absolute">
            <filter id="white-to-transparent" colorInterpolationFilters="sRGB">
              <feColorMatrix type="matrix" values="0 0 0 0 1 
                                                   0 0 0 0 1 
                                                   0 0 0 0 1 
                                                   -5 -5 -5 6 0" />
            </filter>
          </svg>

          {/* Floating Back Button (Pill Style) */}
          <Link href="/" className="absolute top-8 left-8 z-10">
            <motion.div 
              whileHover={{ x: -4, backgroundColor: "rgba(255,255,255,0.25)" }}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-full text-xs font-semibold transition-all backdrop-blur-xl shadow-lg"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Torna al Sito</span>
            </motion.div>
          </Link>

          {/* Green Panel Content */}
          <AnimatePresence mode="wait">
            {mode === "login" ? (
              <motion.div
                key="to-register"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="relative z-10 text-center space-y-4 flex flex-col items-center"
              >
                <motion.div 
                  animate={{ y: [-10, 10, -10], rotate: [0, 1, -1, 0] }}
                  transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                  className="space-y-2 flex flex-col items-center"
                >
                  <div className="flex items-center justify-center transition-all drop-shadow-[0_20px_20px_rgba(0,0,0,0.4)]">
                     <Image 
                       src="/LOGO.png" 
                       alt="Logo" 
                       width={320} 
                       height={120} 
                       className="object-contain"
                       style={{ filter: "url(#white-to-transparent)" }}
                     />
                  </div>
                  <motion.div
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="relative w-80 h-48 rounded-2xl overflow-hidden shadow-2xl skew-x-[-12deg] skew-y-[4deg] border border-white/20"
                  >
                     <Image 
                       src="/crm_dashboard_preview_1774528867412.png" 
                       alt="CRM Preview" 
                       fill 
                       className="object-cover"
                     />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  </motion.div>
                </motion.div>
                <div className="space-y-4">
                  <h2 className="text-4xl font-bold font-sans tracking-tight">Nuovo qui?</h2>
                  <p className="text-emerald-50 max-w-xs leading-relaxed text-lg font-light opacity-90">
                    Entra nel futuro della logistica ortofrutticola con la nostra suite integrata.
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={toggleMode}
                  className="bg-white text-emerald-900 border-none hover:bg-emerald-50 rounded-full h-14 px-12 text-base font-bold shadow-[0_20px_40px_-10px_rgba(0,0,0,0.4)] transition-all hover:scale-105 active:scale-95"
                >
                  Registrati Ora
                </Button>
              </motion.div>
            ) : mode === "register" ? (
              <motion.div
                key="to-login"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="relative z-10 text-center space-y-4 flex flex-col items-center"
              >
                <motion.div 
                  animate={{ y: [10, -10, 10], rotate: [0, -1, 1, 0] }}
                  transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                  className="space-y-2 flex flex-col items-center"
                >
                  <div className="flex items-center justify-center transition-all drop-shadow-[0_20px_20px_rgba(0,0,0,0.4)]">
                     <Image 
                       src="/LOGO.png" 
                       alt="Logo" 
                       width={320} 
                       height={120} 
                       className="object-contain"
                       style={{ filter: "url(#white-to-transparent)" }}
                     />
                  </div>
                  <motion.div
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     className="relative w-80 h-48 rounded-2xl overflow-hidden shadow-2xl skew-x-[12deg] skew-y-[-4deg] border border-white/20"
                  >
                     <Image 
                       src="/crm_dashboard_preview_1774528867412.png" 
                       alt="CRM Preview" 
                       fill 
                       className="object-cover"
                     />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  </motion.div>
                </motion.div>
                <div className="space-y-4">
                  <h2 className="text-4xl font-bold font-sans tracking-tight">Bentornato!</h2>
                  <p className="text-emerald-50 max-w-xs leading-relaxed text-lg font-light opacity-90">
                    Sempre in prima linea nella gestione della filiera di eccellenza.
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={toggleMode}
                  className="bg-white text-emerald-900 border-none hover:bg-emerald-50 rounded-full h-14 px-12 text-base font-bold shadow-[0_20px_40px_-10px_rgba(0,0,0,0.4)] transition-all hover:scale-105 active:scale-95"
                >
                  Accedi al tuo Account
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="to-login-from-forgot"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="relative z-10 text-center space-y-4 flex flex-col items-center"
              >
                <div className="flex items-center justify-center mb-4 drop-shadow-[0_20px_20px_rgba(0,0,0,0.4)]">
                   <Image 
                     src="/LOGO.png" 
                     alt="Logo" 
                     width={320} 
                       height={120} 
                       className="object-contain"
                       style={{ filter: "url(#white-to-transparent)" }}
                   />
                </div>
                <div className="space-y-4">
                  <h2 className="text-4xl font-bold font-sans tracking-tight">Supporto</h2>
                  <p className="text-emerald-50 max-w-xs leading-relaxed text-lg font-light opacity-90">
                    Siamo qui per aiutarti a recuperare l&apos;accesso in un lampo.
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={goToLogin}
                  className="bg-white text-emerald-900 border-none hover:bg-emerald-50 rounded-full h-14 px-12 text-base font-bold shadow-[0_20px_40px_-10px_rgba(0,0,0,0.4)] transition-all hover:scale-105 active:scale-95"
                >
                  Indietro al Login
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Forms Container */}
        <div className="flex w-full min-h-[600px]">
          {/* Section 1: Login & Forgot */}
          <div className={cn(
            "w-full md:w-1/2 p-8 md:p-14 flex flex-col justify-center transition-all duration-500 bg-white",
            mode === "register" ? "opacity-0 md:opacity-20 blur-sm md:blur-none pointer-events-none" : "z-10 opacity-100"
          )}>
            <AnimatePresence mode="wait">
              {mode === "login" ? (
                <motion.div
                  key="login-view"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="w-full"
                >
                  <div className="text-center md:text-left mb-8">
                     <motion.div 
                       whileHover={{ scale: 1.05 }}
                       className="flex justify-center md:justify-start mb-6 drop-shadow-sm cursor-default transition-all"
                     >
                       <Image src="/LOGO.png" alt="Logo" width={180} height={70} className="h-10 w-auto mix-blend-multiply" />
                     </motion.div>
                     <h1 className="text-3xl font-bold tracking-tight">Bentornato</h1>
                     <p className="text-muted-foreground mt-1">Accedi per gestire la tua filieria.</p>
                  </div>
                  <LoginForm callbackUrl={callbackUrl} onForgot={goToForgot} />
                </motion.div>
              ) : mode === "forgot" ? (
                <motion.div
                  key="forgot-view"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="w-full"
                >
                  <div className="text-center md:text-left mb-8">
                     <motion.div 
                       whileHover={{ scale: 1.05 }}
                       className="flex justify-center md:justify-start mb-6 drop-shadow-sm cursor-default transition-all"
                     >
                       <Image src="/LOGO.png" alt="Logo" width={180} height={70} className="h-10 w-auto mix-blend-multiply" />
                     </motion.div>
                     <h1 className="text-3xl font-bold tracking-tight">Recupero</h1>
                     <p className="text-muted-foreground mt-1">Reimposta la tua password in pochi passi.</p>
                  </div>
                  <ForgotPasswordForm onBack={goToLogin} />
                </motion.div>
              ) : null}
            </AnimatePresence>
            
            <div className="md:hidden mt-8 text-center text-sm">
              {mode === "forgot" ? (
                 <button onClick={goToLogin} className="text-primary font-semibold">Torna al Login</button>
              ) : (
                 <>Non hai un account? <button onClick={toggleMode} className="text-primary font-semibold">Registrati</button></>
              )}
            </div>
          </div>

          {/* Register Form Section */}
          <div className={cn(
            "w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center transition-all duration-500 bg-white",
            mode === "login" ? "opacity-0 md:opacity-100 pointer-events-none md:pointer-events-auto" : "z-10"
          )}>
            <div className="text-center md:text-left mb-8 flex flex-col md:items-start items-center">
               <motion.div 
                 whileHover={{ scale: 1.05 }}
                 className="mb-6 drop-shadow-sm cursor-default transition-all"
               >
                 <Image src="/LOGO.png" alt="Logo" width={180} height={70} className="h-10 w-auto mix-blend-multiply" />
               </motion.div>
               <h1 className="text-3xl font-bold tracking-tight">Crea un account</h1>
               <p className="text-muted-foreground mt-1">Unisciti alla rete FruttaGest.</p>
            </div>
            <RegisterForm callbackUrl={callbackUrl} />
            
            <div className="md:hidden mt-8 text-center text-sm">
              Hai già un account? <button onClick={toggleMode} className="text-primary font-semibold">Accedi</button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function LoginForm({ callbackUrl, onForgot }: { callbackUrl: string, onForgot: () => void }) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })
      if (result?.error) {
        setError("Credenziali non valide")
      } else {
        // Fetch session to check role for redirect
        const { getSession } = await import("next-auth/react")
        const session = await getSession()
        const dest = session?.user?.role === "CUSTOMER" ? "/portale" : callbackUrl
        router.push(dest)
        router.refresh()
      }
    } catch {
      setError("Errore durante l'accesso")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Button 
        variant="outline" 
        className="w-full h-12 shadow-sm border-muted flex items-center justify-center gap-3 hover:bg-muted/50 transition-colors"
        type="button"
        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Continua con Google
      </Button>

      <div className="relative py-2 flex items-center gap-4">
        <Separator className="flex-1" />
        <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Oppure</span>
        <Separator className="flex-1" />
      </div>

      <Input 
        icon={Mail} 
        label="EMAIL" 
        value={email} 
        onChange={e => setEmail(e.target.value)} 
        placeholder="admin@fruttagest.com"
      />
      
      <div className="space-y-1">
        <div className="flex justify-between items-center">
           <label className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase px-1">PASSWORD</label>
           <button 
             type="button"
             onClick={onForgot}
             className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wider"
           >
             Dimenticata?
           </button>
        </div>
        <div className="relative">
          <Input 
            icon={Lock} 
            type={showPassword ? "text" : "password"} 
            value={password} 
            onChange={e => setPassword(e.target.value)}
            className="pr-10"
          />
          <button 
            type="button" 
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {error && <p className="text-destructive text-xs text-center">{error}</p>}

      <Button type="submit" loading={loading} className="w-full h-12 rounded-xl group overflow-hidden">
        Accedi
        <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
      </Button>

    </form>
  )
}

function ForgotPasswordForm({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    
    try {
      // Simulate API call or call existing resetPassword action if available
      const { resetPassword } = await import("@/lib/actions")
      await resetPassword(email)
      setSent(true)
    } catch {
      setError("Errore durante l'invio")
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="text-center py-6 space-y-6">
        <div className="flex justify-center">
          <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center">
            <Check className="h-8 w-8 text-emerald-600" />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Email inviata con successo! Controlla la tua casella di posta per il link di ripristino.
        </p>
        <Button onClick={onBack} variant="outline" className="w-full">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Torna al Login
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input 
        icon={Mail} 
        label="EMAIL DI RECUPERO" 
        value={email} 
        onChange={e => setEmail(e.target.value)} 
        placeholder="inserisci la tua email"
        required
      />
      {error && <p className="text-destructive text-xs text-center">{error}</p>}
      <Button type="submit" loading={loading} className="w-full h-12">
        Invia Link di Reset
      </Button>
      <div className="text-center">
        <button 
          type="button" 
          onClick={onBack}
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Annulla e torna al Login
        </button>
      </div>
    </form>
  )
}

function RegisterForm({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    // Validazione base
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
      if (res.ok) {
        await signIn("credentials", { email, password, redirect: false })
        const { getSession } = await import("next-auth/react")
        const session = await getSession()
        const dest = session?.user?.role === "CUSTOMER" ? "/portale" : callbackUrl
        router.push(dest)
        router.refresh()
      } else {
        const data = await res.json()
        setError(data.error || "Errore")
      }
    } catch {
      setError("Errore server")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input icon={User} label="NOME" value={name} onChange={e => setName(e.target.value)} placeholder="Mario Rossi" />
      <Input icon={Mail} label="EMAIL" value={email} onChange={e => setEmail(e.target.value)} placeholder="mario@esempio.it" />
      
      <div className="space-y-1">
        <label className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase px-1">PASSWORD</label>
        <div className="relative">
          <Input 
            icon={Lock} 
            type={showPassword ? "text" : "password"} 
            value={password} 
            onChange={e => setPassword(e.target.value)}
          />
          <button 
            type="button" 
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {error && <p className="text-destructive text-xs text-center">{error}</p>}

      <Button type="submit" loading={loading} className="w-full h-12 rounded-xl group overflow-hidden">
        Registrati Ora
        <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
      </Button>

      <div className="relative py-2 flex items-center gap-4">
        <Separator className="flex-1" />
        <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Oppure</span>
        <Separator className="flex-1" />
      </div>

      <Button 
        variant="outline" 
        className="w-full h-12 shadow-sm border-muted flex items-center justify-center gap-3 hover:bg-muted/50 transition-colors"
        type="button"
        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Registrati con Google
      </Button>

    </form>
  )
}
