'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { Category } from '@/data/categories'

interface CategorySidebarProps {
  categories: Category[]
  selectedSubcategory: string | null
  onSelectSubcategory: (subcategory: string) => void
}

export function CategorySidebar({
  categories,
  selectedSubcategory,
  onSelectSubcategory,
}: CategorySidebarProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  const toggleCategory = (categoryName: string) => {
    setExpandedCategory(expandedCategory === categoryName ? null : categoryName)
  }

  return (
    <div className="bg-card/50 border border-foreground/15 rounded-lg p-4">
      <h2 className="text-lg font-semibold text-foreground mb-4">Categories</h2>

      <div className="space-y-2">
        {categories.map((category) => (
          <div key={category.name}>
            {/* Main Category Button */}
            <button
              onClick={() => toggleCategory(category.name)}
              className="w-full flex items-center justify-between px-3 py-2 text-left rounded-lg hover:bg-foreground/10 transition-colors text-foreground text-sm font-medium"
            >
              <span>{category.name}</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${
                  expandedCategory === category.name ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Subcategories */}
            {expandedCategory === category.name && (
              <div className="mt-2 ml-4 space-y-1 border-l border-foreground/10 pl-3">
                {category.subcategories.map((subcategory) => (
                  <button
                    key={subcategory.name}
                    onClick={() => onSelectSubcategory(subcategory.name)}
                    className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors ${
                      selectedSubcategory === subcategory.name
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'text-foreground/70 hover:bg-foreground/10 hover:text-foreground'
                    }`}
                  >
                    {subcategory.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
