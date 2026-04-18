'use client'

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 z-0">
      {/* Dark mode: ocean blue to deep teal gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a2540] via-[#0d3454] to-[#0f4c5c] dark:opacity-100 opacity-0 transition-opacity duration-300" />

      {/* Light mode: soft white with subtle blue-green tint */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-50/30 to-teal-50/30 dark:opacity-0 opacity-100 transition-opacity duration-300" />
      
      {/* Overlay subtle pattern */}
      <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]" 
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} 
      />
    </div>
  )
}
