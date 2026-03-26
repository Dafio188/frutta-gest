"use client"

import React from "react"
import { motion } from "framer-motion"

interface LogoBrandProps {
  className?: string
  variant?: "default" | "light" | "colored"
  size?: number | string
}

export function LogoBrand({ className = "", variant = "colored", size = "100%" }: LogoBrandProps) {
  const isLight = variant === "light"
  
  // Colori base
  const greenPrimary = "#22c55e"    // Emerald 500
  const orangePrimary = "#f97316"   // Orange 500
  const darkPrimary = "#0f172a"     // Slate 900
  const whitePrimary = "#ffffff"

  return (
    <div className={`relative ${className}`} style={{ width: size, aspectRatio: "31/10" }}>
      <svg
        viewBox="0 0 310 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* --- ICONA FRUTTA TECH --- */}
        <g id="FruitIcon">
          {/* Corpo Arancia/Mela */}
          <path
            d="M55 85C80 85 95 70 95 45C95 20 80 5 55 5C30 5 15 20 15 45C15 70 30 85 55 85Z"
            fill={isLight ? "rgba(255,255,255,0.15)" : orangePrimary}
            fillOpacity={isLight ? 0.2 : 0.1}
          />
          <path
            d="M55 85C80 85 95 70 95 45C95 20 80 5 55 5"
            stroke={isLight ? whitePrimary : orangePrimary}
            strokeWidth="4"
            strokeLinecap="round"
          />
          
          {/* Parte Tech (Sinistra) - Linee e Cerchi */}
          <line x1="15" y1="45" x2="40" y2="45" stroke={isLight ? whitePrimary : greenPrimary} strokeWidth="3" />
          <circle cx="15" cy="45" r="4" fill={isLight ? whitePrimary : greenPrimary} />
          
          <line x1="20" y1="60" x2="45" y2="60" stroke={isLight ? whitePrimary : darkPrimary} strokeWidth="3" />
          <circle cx="20" cy="60" r="4" fill={isLight ? whitePrimary : darkPrimary} />
          
          <line x1="25" y1="75" x2="50" y2="75" stroke={isLight ? whitePrimary : orangePrimary} strokeWidth="3" />
          <circle cx="25" cy="75" r="4" fill={isLight ? whitePrimary : orangePrimary} />

          {/* Foglie */}
          <path
            d="M55 5C55 5 45 -10 30 -5C30 -5 35 15 55 5Z"
            fill={isLight ? whitePrimary : greenPrimary}
          />
          <path
            d="M55 5C55 5 65 -15 80 -10C80 -10 75 10 55 5Z"
            fill={isLight ? whitePrimary : greenPrimary}
            opacity="0.8"
          />
        </g>

        {/* --- TESTO FRUTTAGEST --- */}
        <g id="TextBrand">
          <text
            x="110"
            y="65"
            fontFamily="Inter, sans-serif"
            fontWeight="800"
            fontSize="48"
            fill={isLight ? whitePrimary : darkPrimary}
            letterSpacing="-1.5"
          >
            Frutta
            <tspan fill={isLight ? whitePrimary : greenPrimary}>Gest</tspan>
          </text>
        </g>
      </svg>
    </div>
  )
}
