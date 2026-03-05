// components/catalog/product-card.tsx
'use client'

import Image from 'next/image'
import type { Product } from '@/hooks/useProducts'

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
      onClick={() => onSelectProduct(product)}
      className="bg-card/50 border border-foreground/15 rounded-lg overflow-hidden transition-all duration-200 hover:-translate-y-1 cursor-pointer flex flex-col h-full"
    >
      {/* Gambar dengan rasio tetap */}
      <div className="aspect-square bg-background/50 border-b border-foreground/15 relative overflow-hidden">
        <Image
          src={product.image_url || '/placeholder.svg'}
          alt={`${product.name} - Solar Nusantara`}
          fill
          className="object-cover"
          unoptimized
        />
      </div>

      {/* Konten Produk */}
      <div className="p-3 flex flex-col flex-1">
        <h3 className="text-sm font-medium text-foreground line-clamp-2 mb-1">
          {product.name}
        </h3>

        <div className="text-sm font-semibold text-primary mt-auto">
          {formatPrice(product.price)}
        </div>

        <p className="text-xs text-foreground/60 mt-1 line-clamp-1">
          {product.stock} Unit Stok
        </p>
      </div>
    </div>
  )
}