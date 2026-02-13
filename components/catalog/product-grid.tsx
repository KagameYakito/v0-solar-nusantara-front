'use client'

import { useState, useMemo } from 'react'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { ProductCard } from './product-card'
import { ProductDetailModal } from './product-detail-modal'
import { Button } from '@/components/ui/button'
import type { Product } from '@/data/categories'

interface ProductGridProps {
  products: Product[]
  searchTerm: string
  onSearchChange: (term: string) => void
}

const ITEMS_PER_PAGE = 28 // 4 columns × 7 rows

export function ProductGrid({ products, searchTerm, onSearchChange }: ProductGridProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  // Filter products based on search term (multi-keyword, case-insensitive, order-insensitive)
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products

    // Split search term into keywords and filter out empty strings
    const keywords = searchTerm
      .toLowerCase()
      .split(/\s+/)
      .filter((k) => k)

    // Only show products that contain ALL keywords (anywhere in the product name)
    return products.filter((product) =>
      keywords.every((keyword) => product.name.toLowerCase().includes(keyword))
    )
  }, [products, searchTerm])

  // Calculate pagination
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedProducts = filteredProducts.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  )

  // Reset to page 1 when search term changes
  const handleSearchChange = (query: string) => {
    onSearchChange(query)
    setCurrentPage(1)
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
              placeholder="Search products by name..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="flex-1 bg-transparent text-foreground placeholder-foreground/50 focus:outline-none text-base"
            />
          </div>
        </div>
      </div>

      {/* Product Grid */}
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-foreground/60 text-lg">
            No products available
          </p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-foreground/60 text-lg">
            No products found matching "{searchTerm}"
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {paginatedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelectProduct={setSelectedProduct}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 py-8">
              {/* Previous Button */}
              <Button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
                className="border-foreground/30 hover:bg-foreground/5 bg-transparent text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {/* Page Numbers */}
              <div className="hidden sm:flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => {
                    // Show first 2, last 2, current page, and surrounding pages
                    const isFirst = page <= 2
                    const isLast = page > totalPages - 2
                    const isNear = Math.abs(page - currentPage) <= 1
                    const shouldShow =
                      isFirst || isLast || isNear || page === totalPages

                    if (!shouldShow && page !== (page === 3 ? 3 : totalPages - 2)) {
                      return null
                    }

                    if (
                      page > 2 &&
                      page < totalPages - 1 &&
                      Math.abs(page - currentPage) > 1 &&
                      page !== 3 &&
                      page !== totalPages - 2
                    ) {
                      return (
                        <span
                          key={`ellipsis-${page}`}
                          className="px-2 text-foreground/60"
                        >
                          ...
                        </span>
                      )
                    }

                    return (
                      <Button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="sm"
                        className={`min-w-10 ${
                          currentPage === page
                            ? 'bg-primary text-white hover:bg-primary/90'
                            : 'border-foreground/30 hover:bg-foreground/5 bg-transparent text-foreground'
                        }`}
                      >
                        {page}
                      </Button>
                    )
                  }
                )}
              </div>

              {/* Next Button */}
              <Button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
                className="border-foreground/30 hover:bg-foreground/5 bg-transparent text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  )
}
