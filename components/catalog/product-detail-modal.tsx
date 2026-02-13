'use client'

import Image from 'next/image'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Product } from '@/data/categories'

interface ProductDetailModalProps {
  product: Product | null
  onClose: () => void
}

export function ProductDetailModal({ product, onClose }: ProductDetailModalProps) {
  if (!product) return null

  const formatPrice = (price: number) => {
    return price.toLocaleString('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).replace('IDR', 'Rp.')
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      {/* Backdrop - close on click */}
      <div
        className="absolute inset-0"
        onClick={onClose}
        role="presentation"
      />

      {/* Modal */}
      <div className="bg-card rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative z-10">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-foreground/10 rounded-lg transition-colors z-10"
          aria-label="Close modal"
        >
          <X className="h-5 w-5 text-foreground/60" />
        </button>

        {/* Product Image */}
        <div className="aspect-video bg-background/50 border-b border-foreground/15 relative overflow-hidden">
          <Image
            src={product.image || '/placeholder.svg'}
            alt={`${product.name} - Solar Nusantara`}
            fill
            className="object-cover"
            unoptimized
          />
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4">
          {/* Product Name */}
          <h2 className="text-2xl font-bold text-foreground">{product.name}</h2>

          {/* Price Section */}
          <div>
            {product.discountedPrice ? (
              <div className="flex items-center gap-3">
                <span className="text-lg text-foreground/50 line-through">
                  {formatPrice(product.price)}
                </span>
                <span className="text-2xl font-bold text-primary">
                  {formatPrice(product.discountedPrice)}
                </span>
              </div>
            ) : (
              <div className="text-2xl font-bold text-primary">
                {formatPrice(product.price)}
              </div>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-foreground/80 text-base leading-relaxed">
              {product.description}
            </p>
          )}

          {/* Specifications */}
          {product.specifications && (
            <div className="mt-6 pt-6 border-t border-foreground/15">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Spesifikasi:
              </h3>
              <ul className="space-y-2 text-xs text-foreground/70">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <li
                    key={key}
                    className="flex justify-between py-2 border-b border-foreground/10 last:border-0"
                  >
                    <span className="font-medium">{key}</span>
                    <span className="text-foreground/60">{value}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-lg font-semibold"
              onClick={onClose}
            >
              Request Item
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-foreground/30 hover:bg-foreground/5 rounded-lg text-foreground"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
