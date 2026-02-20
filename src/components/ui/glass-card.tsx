"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
}

export function GlassCard({ children, className, hover = true }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] as const }}
      whileHover={hover ? {
        y: -4,
        boxShadow: "var(--shadow-float)",
        transition: { duration: 0.3 }
      } : undefined}
      className={cn(
        "rounded-2xl border border-white/20",
        "bg-white/70 dark:bg-white/5",
        "backdrop-blur-xl backdrop-saturate-150",
        "shadow-[var(--shadow-md)]",
        "transition-colors duration-300",
        className
      )}
    >
      {children}
    </motion.div>
  )
}
