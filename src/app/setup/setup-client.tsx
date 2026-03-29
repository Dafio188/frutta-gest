/**
 * Setup Client — Form di attivazione Tenant
 *
 * Mostra il branding del cliente, l'email già confermata 
 * e richiede l'impostazione della password di accesso.
 */

"use client"

import { useState } from "react"
import { Shield, Lock, CreditCard, CheckCircle2, ArrowRight, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { completeTenantSetup } from "@/lib/actions-master"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface SetupClientProps {
  token: string
  organizationName: string
  email: string
}

export function SetupClient({ token, organizationName, email }: SetupClientProps) {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const router = useRouter()

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      return toast.error("Le password non coincidono")
    }
    if (password.length < 8) {
      return toast.error("La password deve avere almeno 8 caratteri")
    }

    setIsSubmitting(true)
    try {
      await completeTenantSetup(token, password)
      setIsSuccess(true)
      toast.success("Account attivato con successo!")
      setTimeout(() => {
        router.push("/login")
      }, 3000)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <Card className="max-w-md w-full border-none shadow-2xl p-6 text-center animate-in fade-in zoom-in duration-500">
        <div className="h-20 w-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 text-white shadow-lg shadow-emerald-500/20">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <CardTitle className="text-2xl font-black mb-2">Benvenuto in FruttaGest!</CardTitle>
        <CardDescription className="text-base">
          La piattaforma per <strong>{organizationName}</strong> è attiva. 
          Ti stiamo portando al modulo di login...
        </CardDescription>
        <div className="mt-8">
           <Button className="w-full rounded-2xl h-12" onClick={() => router.push("/login")}>
             Vai al Login Subito
             <ArrowRight className="ml-2 h-4 w-4" />
           </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="max-w-md w-full border-none shadow-2xl overflow-hidden ring-1 ring-border/10">
      <div className="bg-primary/5 p-8 border-b border-border/50 text-center">
         <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary">
            <Shield className="h-7 w-7" />
         </div>
         <CardTitle className="text-xl font-bold">Attivazione Piattaforma</CardTitle>
         <CardDescription className="mt-2">
           Stai attivando l'account amministratore per <br />
           <span className="font-bold text-foreground">{organizationName}</span>
         </CardDescription>
      </div>

      <CardContent className="p-8 space-y-6">
        <div className="bg-muted/50 p-4 rounded-2xl flex items-center gap-3">
           <div className="h-8 w-8 bg-background rounded-full flex items-center justify-center">
              <Lock className="h-4 w-4 text-muted-foreground" />
           </div>
           <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Admin Email</p>
              <p className="text-sm font-semibold truncate max-w-[200px]">{email}</p>
           </div>
        </div>

        <form onSubmit={handleSetup} className="space-y-4">
           <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Nuova Password</label>
              <Input 
                 type="password" 
                 required 
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 className="h-12 rounded-xl bg-muted/30 border-none focus-visible:ring-primary"
                 placeholder="Scegli una password sicura..."
              />
           </div>

           <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Conferma Password</label>
              <Input 
                 type="password" 
                 required 
                 value={confirmPassword}
                 onChange={(e) => setConfirmPassword(e.target.value)}
                 className="h-12 rounded-xl bg-muted/30 border-none focus-visible:ring-primary"
                 placeholder="Ripeti la password..."
              />
           </div>

           <Button 
             type="submit" 
             disabled={isSubmitting} 
             className="w-full h-12 rounded-2xl mt-4 font-bold text-base shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5"
           >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Attivazione in corso...
                </>
              ) : (
                "Attiva Piattaforma"
              )}
           </Button>
        </form>
      </CardContent>

      <div className="p-4 bg-muted/20 border-t border-border/50 text-center">
          <p className="text-[10px] text-muted-foreground">
             © 2026 FruttaGest Global SaaS Infrastructure. Secure Provisioning.
          </p>
      </div>
    </Card>
  )
}
