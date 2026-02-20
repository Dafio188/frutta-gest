/**
 * Easing Curves Standard — Stile macOS
 *
 * Da usare in tutte le animazioni Framer Motion.
 * MAI usare linear o ease generici.
 */

export const easings = {
  // macOS standard — per la maggior parte delle animazioni
  apple: [0.23, 1, 0.32, 1] as const,

  // Per entrate enfatiche (modali, pagine)
  entrance: [0.0, 0.0, 0.2, 1] as const,

  // Per uscite rapide
  exit: [0.4, 0.0, 1, 1] as const,

  // Per bounce leggero (toggle, switch)
  spring: { type: "spring" as const, stiffness: 400, damping: 25 },

  // Per movimenti elastici (drag, resize)
  elastic: { type: "spring" as const, stiffness: 300, damping: 20, mass: 0.8 },
}

export const durations = {
  micro: 0.15,     // hover, focus, click
  fast: 0.2,       // toggle, switch
  normal: 0.3,     // transizioni standard
  medium: 0.4,     // page transitions
  slow: 0.5,       // modali, animazioni complesse
}
