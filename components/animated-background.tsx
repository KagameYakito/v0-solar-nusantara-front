'use client'

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 z-0">
      {/* Dark mode: solid gradient from #0f172a to #1e293b */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] to-[#1e293b] dark:opacity-100 opacity-0 transition-opacity duration-300" />

      {/* Light mode: solid gradient from white to #f8fafc */}
      <div className="absolute inset-0 bg-gradient-to-br from-white to-slate-50 dark:opacity-0 opacity-100 transition-opacity duration-300" />
    </div>
  )
}
