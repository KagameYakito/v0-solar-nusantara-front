'use client'

import { ProductCard } from './product-card'
import type { Product } from '@/data/categories'

interface ProductGridProps {
  products: Product[]
  selectedSubcategory: string | null
}

export function ProductGrid({ products, selectedSubcategory }: ProductGridProps) {
  if (!selectedSubcategory) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-foreground/60 text-lg">
          Select a subcategory from the left to view products
        </p>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-foreground/60 text-lg">
          No products available for this category
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
