// components/catalog/category-sidebar.tsx
'use client'

import type { CategoryCount } from '@/hooks/useProducts'

interface CategorySidebarProps {
  categories: CategoryCount[] 
  selectedCategory: string | null
  onSelectCategory: (category: string | null) => void
  totalCount?: number // <--- TAMBAHKAN PROP INI (untuk menerima angka total dari database)
}

export function CategorySidebar({
  categories,
  selectedCategory,
  onSelectCategory,
  totalCount, // <--- TERIMA PROP INI
}: CategorySidebarProps) {

  return (
    <div className="bg-card/50 border border-foreground/15 rounded-lg p-4">
      <h2 className="text-lg font-semibold text-foreground mb-4">Kategori</h2>

      {/* Tombol Semua */}
      <button
        onClick={() => onSelectCategory(null)}
        className={`w-full flex items-center justify-between px-3 py-2 text-left rounded-lg transition-colors text-sm font-medium mb-4 ${
          selectedCategory === null
            ? 'border border-primary/30 bg-primary/5 text-foreground'
            : 'hover:bg-foreground/10 text-foreground/70'
        }`}
      >
        <span>Semua</span>
        <span className="text-xs bg-foreground/10 px-2 py-0.5 rounded">
          {/* ✅ LOGIKA BARU: Pakai totalCount jika ada, jika tidak fallback ke 0 */}
          {totalCount ?? 0}
        </span>
      </button>

      <div className="space-y-2">
        {categories.map((category) => (
          <button
            key={category.name}
            onClick={() => onSelectCategory(category.name)}
            className={`w-full flex items-center justify-between px-3 py-2 text-left rounded-lg transition-colors text-sm ${
              selectedCategory === category.name
                ? 'bg-primary/20 text-primary border border-primary/30 font-medium'
                : 'text-foreground/70 hover:bg-foreground/10 hover:text-foreground'
            }`}
          >
            <span>{category.name}</span>
            <span className="text-xs bg-foreground/10 px-2 py-0.5 rounded">
              {category.count}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}