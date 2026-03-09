'use client'

import type { CategoryCount } from '@/hooks/useProducts'

interface CategorySidebarProps {
  categories: CategoryCount[] 
  selectedCategory: number | null // GANTI: Pakai number (ID), bukan string
  onSelectCategory: (categoryId: number | null) => void
  totalCount?: number 
}

export function CategorySidebar({
  categories,
  selectedCategory,
  onSelectCategory,
  totalCount,
}: CategorySidebarProps) {

  return (
    <div className="bg-card/50 border border-foreground/15 rounded-lg p-4 sticky top-4">
      <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <span>⚡</span> Kategori Produk
      </h2>

      {/* Tombol SEMUA (Hardcoded Position & Logic) */}
      <button
        onClick={() => onSelectCategory(null)}
        className={`w-full flex items-center justify-between px-3 py-2.5 text-left rounded-lg transition-all duration-200 text-sm font-medium mb-4 group ${
          selectedCategory === null
            ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
            : 'hover:bg-foreground/5 text-foreground/70 hover:text-foreground border border-transparent'
        }`}
      >
        <span className="flex items-center gap-2">
          <span className={selectedCategory === null ? 'text-primary' : 'text-foreground/40'}>●</span>
          Semua Produk
        </span>
        <span className="text-xs bg-foreground/10 text-foreground/60 px-2 py-0.5 rounded-full group-hover:bg-primary/10 group-hover:text-primary transition-colors">
          {totalCount ?? 0}
        </span>
      </button>

      {/* List Kategori Dinamis dari Database */}
      <div className="space-y-1.5">
        {categories.length === 0 ? (
          <p className="text-xs text-foreground/40 italic text-center py-4">Memuat kategori...</p>
        ) : (
          categories.map((category) => (
            <button
              key={category.id} // Gunakan ID sebagai key unik
              onClick={() => onSelectCategory(category.id)} // Kirim ID kategori
              className={`w-full flex items-center justify-between px-3 py-2 text-left rounded-lg transition-all duration-200 text-sm group ${
                selectedCategory === category.id
                  ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm font-medium'
                  : 'text-foreground/70 hover:bg-foreground/5 hover:text-foreground border border-transparent'
              }`}
            >
              <span className="truncate pr-2">{category.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                category.count > 0 
                  ? 'bg-foreground/10 text-foreground/60 group-hover:bg-primary/10 group-hover:text-primary' 
                  : 'bg-foreground/5 text-foreground/30'
              }`}>
                {category.count}
              </span>
            </button>
          ))
        )}
      </div>

      {/* Footer Info Kecil */}
      <div className="mt-6 pt-4 border-t border-foreground/10">
        <p className="text-[10px] text-foreground/40 leading-relaxed">
          💡 <strong>Catatan:</strong> Kategori akan terisi otomatis setelah tim sales mengklasifikasikan produk.
        </p>
      </div>
    </div>
  )
}