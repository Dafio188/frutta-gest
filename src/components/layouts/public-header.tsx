"use client"

import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"

import { useSession } from "next-auth/react"

export function PublicHeader() {
  const { data: session, status } = useSession()
  const isLoading = status === "loading"

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-white/60 backdrop-blur-2xl dark:bg-background/60">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <Link href="/" className="flex items-center gap-3 group">
            <Image
              src="/LOGO.png"
              alt="FruttaGest"
              width={260}
              height={80}
              priority
              className="h-10 w-auto transition-transform duration-300 group-hover:scale-105 mix-blend-multiply"
            />
          </Link>
        </motion.div>

        <div className="hidden items-center gap-8 md:flex">
          {[
            { name: "Suite", href: "/#suite" },
            { name: "Confronto", href: "/#confronto" },
            { name: "Contatti", href: "/contact" },
          ].map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index, type: "spring" }}
            >
              <Link
                href={item.href}
                className="text-sm font-medium text-muted-foreground transition-all hover:text-brand-green hover:tracking-wide"
              >
                {item.name}
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div 
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {isLoading ? (
            <div className="h-10 w-24 animate-pulse rounded-full bg-muted/20" />
          ) : session ? (
            <Link
              href="/dashboard"
              className="group relative flex items-center gap-2 overflow-hidden rounded-full bg-brand-green px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-green/20 transition-all hover:bg-brand-green/90 hover:shadow-xl hover:shadow-brand-green/30 active:scale-95"
            >
              <span className="relative z-10">Dashboard</span>
              <ArrowRight className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={2} />
              <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
            </Link>
          ) : (
            <>
              <Link
                href="/register"
                className="group relative flex items-center gap-2 overflow-hidden rounded-full bg-brand-green px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-green/20 transition-all hover:bg-brand-green/90 hover:shadow-xl hover:shadow-brand-green/30 active:scale-95"
              >
                <span className="relative z-10">Inizia Ora</span>
                <ArrowRight className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={2} />
                <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
              </Link>
            </>
          )}
        </motion.div>
      </div>
    </nav>
  )
}
