'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CategorySidebar } from '@/components/catalog/category-sidebar'
import { ProductGrid } from '@/components/catalog/product-grid'
import { categoriesData } from '@/data/categories'

export default function CatalogPage() {
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Get products for selected subcategory or all products
  const getSelectedProducts = () => {
    // Return ALL products when no subcategory selected
    if (!selectedSubcategory) {
      const allProducts: any[] = []
      categoriesData.forEach((category) => {
        category.subcategories.forEach((sub) => {
          allProducts.push(...sub.products)
        })
      })
      return allProducts
    }

    // Existing subcategory logic
    for (const category of categoriesData) {
      for (const subcategory of category.subcategories) {
        if (subcategory.name === selectedSubcategory) {
          return subcategory.products
        }
      }
    }
    return []
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] to-[#1e293b] animate-fade-in">
      {/* Header */}
      <header className="border-b border-foreground/15 bg-card/50 backdrop-blur p-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Product Catalog</h1>
          <Link href="/">
            <Button
              variant="outline"
              className="border-foreground/30 hover:bg-foreground/5 rounded-lg text-foreground flex items-center gap-2 bg-transparent"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - 25% width on desktop */}
          <div className="lg:col-span-1">
            <CategorySidebar
              categories={categoriesData}
              selectedSubcategory={selectedSubcategory}
              onSelectSubcategory={setSelectedSubcategory}
            />
          </div>

          {/* Product Grid - 75% width on desktop */}
          <div className="lg:col-span-3">
            <ProductGrid
              products={getSelectedProducts()}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
