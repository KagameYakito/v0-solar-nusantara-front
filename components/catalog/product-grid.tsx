// components/catalog/product-grid.tsx
'use client'

import { useState } from 'react'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { ProductCard } from './product-card'
import { ProductDetailModal } from './product-detail-modal'
import { Button } from '@/components/ui/button'
import { useProducts } from '@/hooks/useProducts' 

interface ProductGridProps {
  searchTerm: string
  onSearchChange: (term: string) => void
  selectedCategory?: string | null
}

const ITEMS_PER_PAGE = 28

export function ProductGrid({ searchTerm, onSearchChange, selectedCategory }: ProductGridProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)

  // ✅ PERUBAHAN PENTING: Kirim selectedCategory ke hook (Parameter ke-4)
  const { products, loading, error, totalCount } = useProducts(currentPage, ITEMS_PER_PAGE, searchTerm, selectedCategory || null)

  const totalPages = Math.ceil((totalCount || 0) / ITEMS_PER_PAGE)

  const handleSearchChange = (query: string) => {
    onSearchChange(query)
    setCurrentPage(1) // Reset ke halaman 1 saat search berubah
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <div className="bg-card/70 backdrop-blur-md border border-primary/20 rounded-2xl p-2">
          <div className="flex items-center space-x-3 px-4">
            <Search className="h-5 w-5 text-foreground/60" />
            <input
              type="text"
              placeholder={selectedCategory ? `Cari di "${selectedCategory}"...` : "Cari produk (misal: battery, inverter)..."}
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="flex-1 bg-transparent text-foreground placeholder-foreground/50 focus:outline-none text-base"
            />
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="text-red-500 text-center py-8">Error loading products: {error}</div>
      )}

      {/* Product Grid */}
      {!loading && !error && (
        <>
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-foreground/60 text-lg">
                {searchTerm 
                  ? `Tidak ditemukan produk dengan kata kunci "${searchTerm}" ${selectedCategory ? `di kategori ${selectedCategory}` : ''}` 
                  : selectedCategory 
                    ? `Tidak ada produk di kategori "${selectedCategory}".` 
                    : "Tidak ada produk ditemukan."}
              </p>
              <p className="text-sm mt-2 text-gray-400">
                 Total hasil: {totalCount}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 min-h-[calc(7*10rem)]">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} onSelectProduct={setSelectedProduct} />
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 py-8">
                  <Button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    variant="outline" size="sm"
                    className="border-foreground/30 hover:bg-foreground/5 bg-transparent text-foreground disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <div className="hidden sm:flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      const isFirst = page <= 2
                      const isLast = page > totalPages - 2
                      const isNear = Math.abs(page - currentPage) <= 1
                      const shouldShow = isFirst || isLast || isNear || page === totalPages

                      if (!shouldShow && page !== (page === 3 ? 3 : totalPages - 2)) return null
                      if (page > 2 && page < totalPages - 1 && Math.abs(page - currentPage) > 1 && page !== 3 && page !== totalPages - 2) {
                        return <span key={`ellipsis-${page}`} className="px-2 text-foreground/60">...</span>
                      }

                      return (
                        <Button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          variant={currentPage === page ? 'default' : 'outline'}
                          size="sm"
                          className={`min-w-10 ${
                            currentPage === page ? 'bg-primary text-white hover:bg-primary/90' : 'border-foreground/30 hover:bg-foreground/5 bg-transparent text-foreground'
                          }`}
                        >
                          {page}
                        </Button>
                      )
                    })}
                  </div>

                  <Button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    variant="outline" size="sm"
                    className="border-foreground/30 hover:bg-foreground/5 bg-transparent text-foreground disabled:opacity-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </>
      )}

      <ProductDetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
    </div>
  )
}