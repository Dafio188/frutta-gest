/**
 * IsolationAuditPanel — Pannello Diagnostica Isolamento Multi-Tenant
 *
 * Componente client per il SuperAdmin che esegue e visualizza
 * il report di verifica dell'isolamento dati tra i tenant.
 */

"use client"

import { useState } from "react"
import { Shield, Play, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Users, Database, ChevronDown, ChevronRight, Clock, Zap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { runIsolationAudit } from "@/lib/actions-master"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

type CheckResult = { name: string; passed: boolean; detail: string }
type TenantReport = {
  orgId: string; orgName: string; slug: string
  status: "PASS" | "FAIL" | "PARTIAL"
  userCount: number
  users: { email: string; role: string; isActive: boolean }[]
  errors: string[]; checks: CheckResult[]
}
type AuditResult = {
  status: "PASS" | "FAIL" | "PARTIAL" | "SKIP"
  summary: { total_tenants: number; passed: number; partial: number; failed: number; cross_contamination: any }
  report: TenantReport[]
  duration_ms: number
  timestamp: string
  message?: string
}

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  PASS: {
    label: "Isolamento Verificato",
    icon: CheckCircle2,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  },
  FAIL: {
    label: "Problemi Rilevati",
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-500/10 border-red-500/20",
    badge: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  },
  PARTIAL: {
    label: "Warning",
    icon: AlertTriangle,
    color: "text-amber-500",
    bg: "bg-amber-500/10 border-amber-500/20",
    badge: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  },
  SKIP: {
    label: "Nessun Tenant",
    icon: Database,
    color: "text-muted-foreground",
    bg: "bg-muted/30 border-border/30",
    badge: "bg-muted text-muted-foreground",
  },
}

// ─── Componente Principale ────────────────────────────────────────────────────

export function IsolationAuditPanel() {
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<AuditResult | null>(null)
  const [expandedTenants, setExpandedTenants] = useState<Set<string>>(new Set())

  const handleRun = async () => {
    setRunning(true)
    setResult(null)
    try {
      const data = await runIsolationAudit()
      setResult(data as AuditResult)

      if (data.status === "PASS") {
        toast.success("Audit completato — Isolamento verificato!", {
          description: `${data.summary.total_tenants} tenant analizzati in ${data.duration_ms}ms`,
        })
      } else if (data.status === "FAIL") {
        toast.error("Audit completato — Problemi rilevati", {
          description: "Verifica i dettagli nel report qui sotto.",
        })
      } else if (data.status === "PARTIAL") {
        toast.warning("Audit completato — Warning presenti", {
          description: "Alcuni tenant hanno configurazioni incomplete.",
        })
      } else {
        toast.info("Nessun tenant attivo da verificare.")
      }
    } catch (e: any) {
      toast.error("Errore durante l'audit: " + e.message)
    } finally {
      setRunning(false)
    }
  }

  const toggleExpand = (slug: string) => {
    setExpandedTenants((prev) => {
      const next = new Set(prev)
      next.has(slug) ? next.delete(slug) : next.add(slug)
      return next
    })
  }

  return (
    <Card className="border-none shadow-2xl bg-card overflow-hidden">
      <CardHeader className="border-b bg-muted/20 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 font-bold">
            <Shield className="h-5 w-5 text-primary" />
            Audit Isolamento Multi-Tenant
          </CardTitle>
          <Button
            size="sm"
            onClick={handleRun}
            disabled={running}
            className="rounded-full gap-2 shadow-lg shadow-primary/20"
          >
            {running ? (
              <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Analisi in corso...</>
            ) : (
              <><Play className="h-3.5 w-3.5" /> Avvia Verifica</>
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Verifica che ogni tenant acceda solo ai propri dati, che lo schema DB sia corretto e che non ci sia cross-contamination.
        </p>
      </CardHeader>

      <CardContent className="p-0">
        {!result && !running && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-primary/5 flex items-center justify-center mb-4 border border-primary/10">
              <Zap className="h-8 w-8 text-primary/40" />
            </div>
            <p className="font-semibold text-muted-foreground text-sm">Verifica non ancora eseguita</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[260px]">
              Clicca "Avvia Verifica" per eseguire la diagnostica completa sull'isolamento dei dati tra i tenant.
            </p>
          </div>
        )}

        {running && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <RefreshCw className="h-8 w-8 text-primary animate-spin" />
            <p className="font-semibold text-sm">Connessione ai database tenant...</p>
            <p className="text-xs text-muted-foreground">Verifica schema, utenti e isolamento in corso</p>
          </div>
        )}

        {result && (
          <div className="space-y-0">
            {/* Banner risultato globale */}
            {(() => {
              const cfg = STATUS_CONFIG[result.status]
              const Icon = cfg.icon
              return (
                <div className={cn("flex items-center gap-4 p-5 border-b", cfg.bg)}>
                  <Icon className={cn("h-8 w-8 shrink-0", cfg.color)} />
                  <div className="flex-1 min-w-0">
                    <p className={cn("font-black text-base", cfg.color)}>{cfg.label}</p>
                    {result.status !== "SKIP" && (
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        <span className="text-xs text-muted-foreground">
                          <strong>{result.summary.total_tenants}</strong> tenant analizzati
                        </span>
                        <span className="text-xs text-emerald-600 font-semibold">✓ {result.summary.passed} pass</span>
                        {result.summary.partial > 0 && (
                          <span className="text-xs text-amber-600 font-semibold">⚠ {result.summary.partial} warning</span>
                        )}
                        {result.summary.failed > 0 && (
                          <span className="text-xs text-red-600 font-semibold">✗ {result.summary.failed} fail</span>
                        )}
                      </div>
                    )}
                    {result.message && <p className="text-xs text-muted-foreground mt-1">{result.message}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {result.duration_ms}ms
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(result.timestamp).toLocaleTimeString("it-IT")}
                    </p>
                  </div>
                </div>
              )
            })()}

            {/* Cross-contamination warning */}
            {result.summary?.cross_contamination && (
              <div className="p-4 bg-red-500/5 border-b border-red-500/20">
                <p className="text-xs font-bold text-red-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <XCircle className="h-3.5 w-3.5" /> Cross-Contamination Rilevata
                </p>
                {result.summary.cross_contamination.map((item: { email: string; tenants: string[] }) => (
                  <div key={item.email} className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2 mb-1.5">
                    <strong>{item.email}</strong> appare in: {item.tenants.join(", ")}
                  </div>
                ))}
              </div>
            )}

            {/* Report per tenant */}
            {result.report.map((tenant) => {
              const cfg = STATUS_CONFIG[tenant.status]
              const Icon = cfg.icon
              const isExpanded = expandedTenants.has(tenant.slug)
              return (
                <div key={tenant.orgId} className="border-b last:border-0">
                  <button
                    className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/20 transition-colors text-left"
                    onClick={() => toggleExpand(tenant.slug)}
                  >
                    <Icon className={cn("h-5 w-5 shrink-0", cfg.color)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-sm">{tenant.orgName}</p>
                        <Badge className={cn("text-[9px] h-4 rounded-full uppercase px-2", cfg.badge)}>
                          {tenant.status}
                        </Badge>
                        <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded uppercase font-bold text-muted-foreground">
                          {tenant.slug}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Users className="h-3 w-3" /> {tenant.userCount} utenti
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {tenant.checks.filter((c) => c.passed).length}/{tenant.checks.length} check superati
                        </span>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-4 space-y-3 bg-muted/10">
                      {/* Checks */}
                      <div className="space-y-1.5 pt-1">
                        {tenant.checks.map((check) => (
                          <div key={check.name} className="flex items-start gap-2.5 text-xs">
                            {check.passed ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
                            )}
                            <div>
                              <span className="font-semibold">{check.name}:</span>{" "}
                              <span className="text-muted-foreground">{check.detail}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Errori */}
                      {tenant.errors.length > 0 && (
                        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 px-3 py-2 space-y-1">
                          {tenant.errors.map((err, i) => (
                            <p key={i} className="text-xs text-red-600">{err}</p>
                          ))}
                        </div>
                      )}

                      {/* Utenti del tenant */}
                      {tenant.users.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                            Utenti nel tenant
                          </p>
                          <div className="space-y-1">
                            {tenant.users.map((user) => (
                              <div
                                key={user.email}
                                className="flex items-center justify-between text-xs bg-muted/40 rounded-lg px-3 py-1.5"
                              >
                                <span className="font-mono text-[11px]">{user.email}</span>
                                <div className="flex items-center gap-1.5">
                                  <span className={cn(
                                    "text-[9px] px-2 py-0.5 rounded-full font-bold uppercase",
                                    user.role === "ADMIN"
                                      ? "bg-primary/10 text-primary"
                                      : "bg-muted text-muted-foreground"
                                  )}>
                                    {user.role}
                                  </span>
                                  <span className={cn(
                                    "text-[9px] w-2 h-2 rounded-full",
                                    user.isActive ? "bg-emerald-500" : "bg-red-400"
                                  )} title={user.isActive ? "Attivo" : "Disattivo"} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
