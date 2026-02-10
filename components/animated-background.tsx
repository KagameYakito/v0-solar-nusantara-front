'use client'

import { useEffect, useState } from 'react'

export function AnimatedBackground() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    // Check if user prefers reduced motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  if (prefersReducedMotion) {
    return (
      <div className="absolute inset-0 bg-background overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" viewBox="0 0 1000 1000">
            <defs>
              <pattern
                id="dots"
                patternUnits="userSpaceOnUse"
                width="50"
                height="50"
              >
                <circle cx="25" cy="25" r="1" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="1000" height="1000" fill="url(#dots)" />
          </svg>
        </div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 bg-background overflow-hidden">
      {/* Static gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-background" />

      {/* Floating orb 1 - Electric Blue */}
      <div
        className="absolute w-96 h-96 rounded-full bg-primary/20 blur-3xl"
        style={{
          top: '10%',
          left: '5%',
          animation: 'float-orb 25s ease-in-out infinite',
        }}
      />

      {/* Floating orb 2 - Solar Orange */}
      <div
        className="absolute w-80 h-80 rounded-full bg-secondary/20 blur-3xl"
        style={{
          top: '40%',
          right: '10%',
          animation: 'float-orb-slow 35s ease-in-out infinite',
          animationDelay: '5s',
        }}
      />

      {/* Floating orb 3 - Electric Blue */}
      <div
        className="absolute w-72 h-72 rounded-full bg-primary/15 blur-3xl"
        style={{
          bottom: '10%',
          left: '20%',
          animation: 'float-orb-slower 40s ease-in-out infinite',
          animationDelay: '10s',
        }}
      />

      {/* Floating orb 4 - Solar Orange */}
      <div
        className="absolute w-96 h-96 rounded-full bg-secondary/15 blur-3xl"
        style={{
          top: '50%',
          right: '30%',
          animation: 'float-orb 30s ease-in-out infinite',
          animationDelay: '15s',
        }}
      />

      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-10 dark:opacity-5">
        <svg className="w-full h-full" viewBox="0 0 1000 1000">
          <defs>
            <pattern
              id="grid"
              patternUnits="userSpaceOnUse"
              width="100"
              height="100"
            >
              <path
                d="M 100 0 L 0 0 0 100"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="1000" height="1000" fill="url(#grid)" />
        </svg>
      </div>
    </div>
  )
}
