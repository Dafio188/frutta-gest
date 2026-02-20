/**
 * Layout Autenticazione
 *
 * Sfondo con gradiente animato, card centrata con glassmorphism.
 */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-background to-green-50 dark:from-emerald-950/20 dark:via-background dark:to-green-950/20 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-green-500/10 blur-3xl" />
      </div>
      {children}
    </div>
  )
}
