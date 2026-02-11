'use client'

import Image from 'next/image'
import type { Product } from '@/data/categories'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="bg-card/50 border border-foreground/15 rounded-lg overflow-hidden">
      {/* Product Image */}
      <div className="aspect-square bg-background/50 border-b border-foreground/15 flex items-center justify-center relative overflow-hidden">
        <Image
          src={product.image || "/placeholder.svg"}
          alt={product.name}
          fill
          className="object-cover"
          unoptimized
        />
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="text-sm font-medium text-foreground line-clamp-2">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-xs text-foreground/60 mt-2 line-clamp-2">
            {product.description}
          </p>
        )}
      </div>
    </div>
  )
}
