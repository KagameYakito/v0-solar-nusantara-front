'use client'

import Image from 'next/image'
import type { Product } from '@/data/categories'

interface ProductCardProps {
  product: Product
  onSelectProduct: (product: Product) => void
}

export function ProductCard({ product, onSelectProduct }: ProductCardProps) {
  const formatPrice = (price: number | undefined | null) => {
    if (price == null || typeof price !== 'number') {
      return 'Rp. —'
    }
    return price.toLocaleString('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).replace('IDR', 'Rp.')
  }

  return (
    <div
      className="bg-card/50 border border-foreground/15 rounded-lg overflow-hidden transition-all duration-200 hover:-translate-y-1 cursor-pointer"
      onClick={() => onSelectProduct(product)}
    >
      {/* Product Image */}
      <div className="aspect-square bg-background/50 border-b border-foreground/15 flex items-center justify-center relative overflow-hidden">
        <Image
          src={product.image || '/placeholder.svg'}
          alt={`${product.name} - Solar Nusantara`}
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

        {/* Price Display */}
        {product.discountedPrice != null ? (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-foreground/50 line-through">
              {formatPrice(product.price)}
            </span>
            <span className="text-sm font-semibold text-primary">
              {formatPrice(product.discountedPrice)}
            </span>
          </div>
        ) : (
          <div className="text-sm font-semibold text-primary mt-2">
            {formatPrice(product.price)}
          </div>
        )}

        {/* Description */}
        {product.description && (
          <p className="text-xs text-foreground/60 mt-2 line-clamp-2">
            {product.description}
          </p>
        )}
      </div>
    </div>
  )
}