'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { CategoryCount } from '@/hooks/useProducts'
import { createClient } from '@supabase/supabase-js'

interface SubCategoryCount extends CategoryCount {
  category_id: number
}

interface CategorySidebarProps {
  categories: CategoryCount[] 
  selectedCategory: number | null
  selectedSubCategory?: number | null
  onSelectCategory: (categoryId: number | null) => void
  onSelectSubCategory?: (subCategoryId: number | null) => void
  totalCount?: number 
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export function CategorySidebar({
  categories,
  selectedCategory,
  selectedSubCategory = null,
  onSelectCategory,
  onSelectSubCategory,
  totalCount,
}: CategorySidebarProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set())
  const [subCategories, setSubCategories] = useState<Record<number, SubCategoryCount[]>>({})

  // ✅ Fetch sub-categories when categories change
  useEffect(() => {
    const fetchSubCategories = async () => {
      const subCatsMap: Record<number, SubCategoryCount[]> = {}
      
      for (const category of categories) {
        try {
          const { data } = await supabase
            .from('sub_categories')
            .select('id, name, slug, category_id')
            .eq('category_id', category.id)
            .order('name', { ascending: true })
          
          if (data) {
            // Count products for each sub-category
            const subCatsWithCount = await Promise.all(
              data.map(async (sub) => {
                const { count } = await supabase
                  .from('products')
                  .select('*', { count: 'exact', head: true })
                  .eq('sub_category_id', sub.id)
                
                return {
                  ...sub,
                  count: count || 0
                } as SubCategoryCount
              })
            )
            
            subCatsMap[category.id] = subCatsWithCount
          }
        } catch (err) {
          console.error(`Failed to fetch sub-categories for category ${category.id}:`, err)
        }
      }
      
      setSubCategories(subCatsMap)
    }
    
    if (categories.length > 0) {
      fetchSubCategories()
    }
  }, [categories])

  // ✅ Toggle category expansion
  const toggleCategory = (categoryId: number) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }

  // ✅ Handle sub-category selection
  const handleSubCategoryClick = (categoryId: number, subCategoryId: number) => {
    onSelectCategory(categoryId)
    if (onSelectSubCategory) {
      onSelectSubCategory(subCategoryId)
    }
  }

  return (
    <div className="bg-card/50 border border-foreground/15 rounded-lg p-4 sticky top-4">
      <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <span>⚡</span> Kategori Produk
      </h2>

      {/* Tombol SEMUA Produk */}
      <button
        onClick={() => {
          onSelectCategory(null)
          if (onSelectSubCategory) onSelectSubCategory(null)
        }}
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

      {/* List Kategori Dinamis dengan Sub-Kategori */}
      <div className="space-y-1">
        {categories.length === 0 ? (
          <p className="text-xs text-foreground/40 italic text-center py-4">Memuat kategori...</p>
        ) : (
          categories.map((category) => {
            const isExpanded = expandedCategories.has(category.id)
            const categorySubCats = subCategories[category.id] || []
            const hasSubCategories = categorySubCats.length > 0
            
            return (
              <div key={category.id} className="space-y-1">
                {/* Category Button */}
                <button
                  onClick={() => {
                    toggleCategory(category.id)
                    onSelectCategory(category.id)
                    if (onSelectSubCategory) onSelectSubCategory(null)
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left rounded-lg transition-all duration-200 text-sm group ${
                    selectedCategory === category.id && !selectedSubCategory
                      ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm font-medium'
                      : 'text-foreground/70 hover:bg-foreground/5 hover:text-foreground border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {/* Expand/Collapse Icon */}
                    {hasSubCategories ? (
                      isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-foreground/40 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-foreground/40 flex-shrink-0" />
                      )
                    ) : (
                      <span className="w-4 flex-shrink-0" />
                    )}
                    
                    {/* Category Name */}
                    <span className="truncate">{category.name}</span>
                  </div>
                  
                  {/* Category Count */}
                  <span className={`text-xs px-2 py-0.5 rounded-full transition-colors flex-shrink-0 ${
                    category.count > 0 
                      ? 'bg-foreground/10 text-foreground/60 group-hover:bg-primary/10 group-hover:text-primary' 
                      : 'bg-foreground/5 text-foreground/30'
                  }`}>
                    {category.count}
                  </span>
                </button>

                {/* Sub-Categories (Expandable) */}
                {isExpanded && hasSubCategories && (
                  <div className="ml-6 space-y-1 border-l-2 border-foreground/10 pl-2">
                    {categorySubCats.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => handleSubCategoryClick(category.id, sub.id)}
                        className={`w-full flex items-center justify-between px-3 py-1.5 text-left rounded-lg transition-all duration-200 text-xs group ${
                          selectedSubCategory === sub.id
                            ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm font-medium'
                            : 'text-foreground/60 hover:bg-foreground/5 hover:text-foreground border border-transparent'
                        }`}
                      >
                        <span className="truncate flex-1">{sub.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full transition-colors flex-shrink-0 ${
                          sub.count > 0 
                            ? 'bg-foreground/10 text-foreground/60 group-hover:bg-primary/10 group-hover:text-primary' 
                            : 'bg-foreground/5 text-foreground/30'
                        }`}>
                          {sub.count}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })
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