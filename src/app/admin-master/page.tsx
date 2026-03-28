"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Building2, 
  ShieldCheck, 
  ShieldAlert, 
  Search, 
  Plus, 
  Globe, 
  Calendar,
  Lock,
  Unlock,
  Settings,
  Database,
  ArrowRight
} from "lucide-react"
import { 
  getMasterOrganizations, 
  toggleOrganizationStatus,
  createMasterOrganization,
  initializeTenantDatabase
} from "@/lib/actions-master"
import { toast, Toaster } from "sonner"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { UploadButton } from "@/utils/uploadthing"
import "@uploadthing/react/styles.css"
import { updateOrganization } from "@/lib/actions-master"

export default function SuperAdminPage() {
  const [orgs, setOrgs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newOrg, setNewOrg] = useState({ name: "", slug: "", dbUrl: "" })
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [editingOrg, setEditingOrg] = useState<any>(null)

  useEffect(() => {
    loadOrgs()
  }, [])

  async function loadOrgs() {
    try {
      setLoading(true)
      const data = await getMasterOrganizations()
      setOrgs(data)
    } catch (err) {
      toast.error("Errore nel carimento organizzazioni")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleToggle(id: string, currentStatus: boolean) {
    try {
      await toggleOrganizationStatus(id, !currentStatus)
      toast.success(currentStatus ? "Organizzazione sospesa" : "Organizzazione riattivata")
      loadOrgs()
    } catch (err) {
      toast.error("Impossibile aggiornare lo stato")
    }
  }

  async function handleCreate() {
    try {
      if (!newOrg.name || !newOrg.slug || !newOrg.dbUrl) {
        toast.warning("Tutti i campi sono obbligatori")
        return
      }
      await createMasterOrganization(newOrg)
      toast.success("Organizzazione creata con successo")
      setIsModalOpen(false)
      setNewOrg({ name: "", slug: "", dbUrl: "" })
      loadOrgs()
    } catch (err) {
      toast.error("Errore durante la creazione")
    }
  }

  const filteredOrgs = orgs.filter(o => 
    o.name.toLowerCase().includes(search.toLowerCase()) || 
    o.slug.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <Toaster richColors position="top-right" />
      {/* Header */}
      <div className="max-w-7xl mx-auto flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            Controllo Globale SaaS
          </h1>
          <p className="text-zinc-500 mt-2">Gestione Tenancy e Infrastruttura FruttaGest</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-white text-black px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-zinc-200 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
        >
          <Plus size={20} />
          Nuovo Tenant
        </button>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Barra di Ricerca */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
          <input 
            type="text"
            placeholder="Cerca cliente o slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-medium backdrop-blur-xl"
          />
        </div>

        {/* Griglia Tenant */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-64 bg-zinc-900/50 rounded-3xl animate-pulse border border-zinc-800" />
            ))
          ) : filteredOrgs.length > 0 ? (
            filteredOrgs.map((org) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={org.id}
                className={`group relative p-6 rounded-3xl border transition-all duration-500 ${
                  org.isActive 
                    ? 'bg-zinc-900/40 border-zinc-800 hover:border-blue-500/50 shadow-[0_4px_20px_rgba(0,0,0,0.5)]' 
                    : 'bg-red-500/5 border-red-500/20 hover:border-red-500/40 grayscale'
                }`}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className={`p-3 rounded-2xl ${org.isActive ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400'}`}>
                    <Building2 size={24} />
                  </div>
                  <div className="flex gap-2 relative z-10">
                    <button 
                      onClick={() => handleToggle(org.id, org.isActive)}
                      className={`p-2 rounded-xl transition-all ${
                        org.isActive 
                          ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' 
                          : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                      }`}
                      title={org.isActive ? "Sospendi" : "Riattiva"}
                    >
                      {org.isActive ? <Lock size={18} /> : <Unlock size={18} />}
                    </button>
                    <button 
                      onClick={async () => {
                        const t = toast.loading(`Inizializzazione database per ${org.name}...`)
                        try {
                          await initializeTenantDatabase(org.id)
                          toast.success("Database inizializzato con successo!", { id: t })
                        } catch (err: any) {
                          toast.error(err.message, { id: t })
                        }
                      }}
                      className="p-2 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all"
                      title="Inizializza DB (Push Schema)"
                    >
                      <Database size={18} />
                    </button>
                    <button 
                      onClick={() => {
                        console.log("Apertura per", org.name)
                        setEditingOrg(org)
                        setIsSettingsOpen(true)
                      }}
                      className="p-2 rounded-xl bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-all cursor-pointer relative z-20"
                      title="Impostazioni Branding"
                    >
                      <Settings size={18} />
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-xl font-bold truncate">{org.name}</h3>
                  <div className="flex items-center gap-2 text-zinc-500 text-sm mt-1">
                    <Globe size={14} />
                    <span>{org.slug}.fruttagest.it</span>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-zinc-800/50">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-500 flex items-center gap-2">
                      <Database size={14} />
                      Database
                    </span>
                    <span className="text-zinc-400 font-mono text-xs truncate max-w-[150px]">
                      {org.dbUrl.split('@')[1] || 'Internal'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-500 flex items-center gap-2">
                      <Calendar size={14} />
                      Data Setup
                    </span>
                    <span className="text-zinc-400">
                      {new Date(org.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {org.isActive && (
                  <div className="absolute top-4 right-4 animate-pulse pointer-events-none z-0">
                    <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]" />
                  </div>
                )}
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center">
              <div className="bg-zinc-900/50 inline-block p-6 rounded-full mb-6 text-zinc-600">
                <ShieldAlert size={48} />
              </div>
              <h2 className="text-2xl font-bold text-zinc-400">Nessun tenant trovato</h2>
              <p className="text-zinc-600">Prova a cambiare i parametri di ricerca o crea un nuovo cliente.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Nuovo Tenant */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-zinc-900 rounded-[32px] border border-zinc-800 p-8 w-full max-w-xl shadow-2xl"
            >
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <Plus className="text-blue-400" />
                Configurazione Nuovo Tenant
              </h2>
              
              <div className="space-y-5">
                <div>
                  <label className="text-xs uppercase font-bold text-zinc-500 mb-2 block">Nome Azienda</label>
                  <input 
                    type="text"
                    value={newOrg.name}
                    onChange={e => setNewOrg({...newOrg, name: e.target.value})}
                    placeholder="Mario Rossi S.r.l."
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase font-bold text-zinc-500 mb-2 block">Slug Identificativo (Sottodominio)</label>
                  <input 
                    type="text"
                    value={newOrg.slug}
                    onChange={e => setNewOrg({...newOrg, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '')})}
                    placeholder="rossi"
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-all font-mono"
                  />
                </div>
                <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground ml-1">
                Stringa Connessione Database Tenant
              </Label>
              <Input
                placeholder="postgresql://user:pass@host/dbname"
                className="bg-background/50 border-white/5 h-12 rounded-xl focus-visible:ring-primary/30"
                value={newOrg.dbUrl}
                onChange={(e) => setNewOrg({ ...newOrg, dbUrl: e.target.value })}
              />
              <p className="text-[9px] text-muted-foreground/60 italic ml-1">
                Tip: Per Vercel, usa la stringa Neon con "-pooler" per performance ottimali.
              </p>
            </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-6 py-4 rounded-2xl bg-zinc-800 font-bold hover:bg-zinc-700 transition-all text-zinc-300"
                  >
                    Annulla
                  </button>
                  <button 
                    onClick={handleCreate}
                    className="flex-3 px-10 py-4 rounded-2xl bg-blue-600 font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                  >
                    Crea Tenant <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Impostazioni Branding */}
      <AnimatePresence>
        {isSettingsOpen && editingOrg && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-zinc-900 rounded-[32px] border border-zinc-800 p-8 w-full max-w-xl shadow-2xl"
            >
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <Settings className="text-white" />
                Branding Tenant: {editingOrg.name}
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="text-xs uppercase font-bold text-zinc-500 mb-2 block">Logo Aziendale</label>
                  {editingOrg.logoUrl ? (
                    <div className="mb-4">
                      <img src={editingOrg.logoUrl} alt="Logo" className="h-16 object-contain rounded-lg bg-white/5 p-2" />
                      <button 
                         onClick={() => setEditingOrg({...editingOrg, logoUrl: null})}
                         className="text-red-400 text-sm mt-2 font-bold"
                      >
                         Rimuovi Logo
                      </button>
                    </div>
                  ) : (
                    <div className="bg-black border border-zinc-800 rounded-xl p-4 flex justify-center border-dashed">
                      <UploadButton
                        endpoint="tenantLogoUploader"
                        onClientUploadComplete={(res) => {
                          if (res?.[0]) {
                            setEditingOrg({...editingOrg, logoUrl: res[0].url})
                            toast.success("Logo caricato!")
                          }
                        }}
                        onUploadError={(error: Error) => {
                          toast.error(`Errore caricamento: ${error.message}`)
                        }}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs uppercase font-bold text-zinc-500 mb-2 block">Colore Principale (Hex)</label>
                  <div className="flex gap-4 items-center">
                    <input 
                      type="color"
                      value={editingOrg.primaryColor || "#3b82f6"}
                      onChange={e => setEditingOrg({...editingOrg, primaryColor: e.target.value})}
                      className="w-12 h-12 rounded cursor-pointer bg-black border border-zinc-800 p-1"
                    />
                    <input 
                      type="text"
                      value={editingOrg.primaryColor || "#3b82f6"}
                      onChange={e => setEditingOrg({...editingOrg, primaryColor: e.target.value})}
                      className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-3 focus:border-blue-500 outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    onClick={() => setIsSettingsOpen(false)}
                    className="flex-1 px-6 py-4 rounded-2xl bg-zinc-800 font-bold hover:bg-zinc-700 transition-all text-zinc-300"
                  >
                    Annulla
                  </button>
                  <button 
                    onClick={async () => {
                      const t = toast.loading("Salvataggio...")
                      try {
                        await updateOrganization(editingOrg.id, { 
                          logoUrl: editingOrg.logoUrl,
                          primaryColor: editingOrg.primaryColor
                        })
                        toast.success("Impostazioni salvate!", { id: t })
                        setIsSettingsOpen(false)
                        loadOrgs()
                      } catch (err) {
                        toast.error("Errore salvataggio", { id: t })
                      }
                    }}
                    className="flex-3 px-10 py-4 rounded-2xl bg-white text-black font-bold hover:bg-zinc-200 transition-all"
                  >
                    Salva Modifiche
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
