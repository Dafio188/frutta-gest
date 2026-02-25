
"use client"

import { useState, useRef } from "react"
import { Sparkles, Upload, FileText, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ParsedOrderData } from "@/types"

interface SmartOrderImportProps {
  onImport: (data: ParsedOrderData) => void
}

export function SmartOrderImport({ onImport }: SmartOrderImportProps) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState("")
  const [image, setImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError("L'immagine è troppo grande (max 5MB)")
        return
      }
      
      const reader = new FileReader()
      reader.onloadend = () => {
        setImage(reader.result as string)
        setError("")
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAnalyze = async () => {
    if (!text.trim() && !image) {
      setError("Inserisci del testo o carica un'immagine")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/ai/parse-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, image }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Errore durante l'analisi")
      }

      if (data.data && data.data.items) {
        onImport(data.data)
        setOpen(false)
        setText("")
        setImage(null)
      } else {
        throw new Error("Nessun articolo trovato")
      }
    } catch (err: any) {
      setError(err.message || "Si è verificato un errore")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-300">
          <Sparkles className="h-4 w-4" />
          Importa con AI
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-500" />
            Importa Ordine con AI
          </DialogTitle>
          <DialogDescription>
            Incolla un messaggio (WhatsApp, Email) o carica una foto della lista della spesa.
            L'AI analizzerà il contenuto e riempirà il carrello.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Textarea
              placeholder="Esempio: Vorrei ordinare 5kg di mele, 2 casse di banane e un mazzo di prezzemolo..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[100px] resize-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            
            {!image ? (
              <Button
                variant="outline"
                type="button"
                className="w-full border-dashed border-2 h-20 flex flex-col gap-1"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Carica immagine lista (opzionale)</span>
              </Button>
            ) : (
              <div className="relative rounded-md overflow-hidden border bg-muted/50 p-2 flex items-center gap-3">
                <div className="h-12 w-12 rounded bg-background border flex items-center justify-center shrink-0 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image} alt="Preview" className="h-full w-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">Immagine caricata</p>
                  <button 
                    onClick={() => setImage(null)}
                    className="text-xs text-destructive hover:underline"
                  >
                    Rimuovi
                  </button>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-2 rounded-md">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Annulla
          </Button>
          <Button onClick={handleAnalyze} disabled={loading || (!text && !image)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analisi in corso...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Analizza e Importa
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
