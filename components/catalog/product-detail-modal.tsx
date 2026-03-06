'use client'

import Image from 'next/image'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Product } from '@/hooks/useProducts'

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
      <div
        className="absolute inset-0"
        onClick={onClose}
        role="presentation"
      />

      <div className="bg-card rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative z-10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-foreground/10 rounded-lg transition-colors z-10"
          aria-label="Tutup"
        >
          <X className="h-5 w-5 text-foreground/60" />
        </button>

        <div className="aspect-video bg-background/50 border-b border-foreground/15 relative overflow-hidden">
          <Image
            src={product.image_url || '/placeholder.svg'}
            alt={`${product.name}`}
            fill
            className="object-cover"
            unoptimized
          />
        </div>

        <div className="p-6 space-y-4">
          <h2 className="text-2xl font-bold text-foreground">{product.name}</h2>

          <div className="flex flex-col gap-1">
            {/* Label Baru */}
            <span className="text-sm text-foreground/60 font-medium">
              Harga dimulai dari:
            </span>
            
            {/* Harga Tetap Format Rupiah */}
            <span className="text-2xl font-bold text-primary">
              {formatPrice(product.price)}
            </span>

            {/* Disclaimer Penting (Perlindungan Bisnis) */}
            <span className="text-[10px] text-foreground/40 italic leading-tight">
              *Harga dapat berubah sesuai ketersediaan pasar. Hubungi kami untuk penawaran final.
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm text-foreground/60">Stok Tersedia:</span>
            <span className="text-lg font-semibold text-foreground">
              {product.stock} Unit
            </span>
          </div>

          {Object.keys(product.specifications).length > 0 && (
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
                    <span className="text-foreground/60 text-right">{value}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

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