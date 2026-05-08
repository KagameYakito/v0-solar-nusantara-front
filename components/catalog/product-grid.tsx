// components/catalog/product-grid.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ProductCard } from './product-card'
import { ProductDetailModal } from './product-detail-modal'
import { Button } from '@/components/ui/button'

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category_id: number | null;
  sub_category_id: number | null;
  specifications: Record<string, any>;
  image_url: string | null;
}

interface ProductGridProps {
  products: Product[];
  loading?: boolean;
  error?: string | null;
  totalCount?: number;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onSearchChange?: (term: string) => void;
  searchTerm?: string;
}

export function ProductGrid({ 
  products, 
  loading = false, 
  error = null, 
  totalCount = 0,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  onSearchChange,
  searchTerm = ''
}: ProductGridProps) {
  
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  
  // ✅ STATE LOKAL UNTUK INPUT (Inisialisasi dengan currentPage)
  const [localPageInput, setLocalPageInput] = useState(currentPage.toString());
  
  // ✅ REF UNTUK TRACKING STATUS MENGETIK & ELEMEN INPUT
  const isTypingRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // ✅ SINKRONISASI PINTAR: Hanya update jika user TIDAK sedang mengetik
  useEffect(() => {
    if (!isTypingRef.current) {
      setLocalPageInput(currentPage.toString());
    }
  }, [currentPage]);

  return (
    <div className="space-y-6">
      
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
                  ? `Tidak ditemukan produk dengan kata kunci "${searchTerm}".` 
                  : "Tidak ada produk ditemukan di kategori ini."}
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
                <div className="flex items-center justify-center gap-2 py-8 flex-wrap relative z-0">
                  
                  {/* Tombol Previous */}
                  <Button
                    onClick={() => onPageChange && onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    variant="outline" size="sm"
                    className="border-foreground/30 hover:bg-foreground/5 bg-transparent text-foreground disabled:opacity-50 min-w-[40px] relative z-10"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  {/* INPUT MANUAL HALAMAN - FINAL FIX WITH INLINE STYLES */}
                  <div className="flex items-center gap-2 bg-card/50 px-3 py-1.5 rounded-lg border border-foreground/10 relative z-20">
                    <span className="text-xs text-foreground/60 font-medium select-none">Page</span>
                    
                    <input
                      ref={inputRef}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={localPageInput}
                      
                      // ✅ STYLE INLINE PAKSA UNTUK MENGATASI MASALAH CSS/Z-INDEX
                      style={{
                        pointerEvents: 'auto', // Paksa terima klik
                        cursor: 'text',        // Paksa cursor jadi teks
                        zIndex: 9999,          // Pastikan di atas segalanya
                        position: 'relative',  // Pastikan posisinya relatif
                        textAlign: 'center',
                        fontWeight: 'bold',
                        fontSize: '0.875rem',
                        color: 'inherit',
                        background: 'transparent',
                        outline: 'none',
                        width: `${Math.max(2.5, totalPages.toString().length)}ch`
                      }}
                      
                      onFocus={() => {
                        isTypingRef.current = true;
                      }}
                      
                      onBlur={(e) => {
                        isTypingRef.current = false;
                        const val = parseInt(e.target.value);
                        let newPage = isNaN(val) || val < 1 ? 1 : (val > totalPages ? totalPages : val);
                        
                        if (onPageChange && newPage !== currentPage) {
                          onPageChange(newPage);
                        }
                        setLocalPageInput(newPage.toString());
                      }}
                      
                      onKeyDown={(e) => {
                        // Izinkan tombol navigasi & kontrol
                        if (['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight'].includes(e.key) || 
                           (e.ctrlKey && ['a', 'c', 'v'].includes(e.key))) {
                          return;
                        }

                        // Blokir huruf & simbol (Hanya izinkan 0-9)
                        if (!/^[0-9]$/.test(e.key)) {
                          e.preventDefault();
                          return;
                        }

                        // Enter = konfirmasi
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = parseInt(localPageInput);
                          let newPage = isNaN(val) || val < 1 ? 1 : (val > totalPages ? totalPages : val);
                          
                          if (onPageChange && newPage !== currentPage) {
                            onPageChange(newPage);
                          }
                          setLocalPageInput(newPage.toString());
                          isTypingRef.current = false;
                          inputRef.current?.blur();
                        }
                      }}
                      
                      onChange={(e) => {
                        // Bersihkan non-angka real-time
                        const numericValue = e.target.value.replace(/[^0-9]/g, '');
                        setLocalPageInput(numericValue);
                      }}
                      
                      // Classname tambahan dengan !important untuk keamanan ekstra
                      className="bg-transparent text-center text-sm font-bold text-foreground focus:outline-none focus:text-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none !pointer-events-auto !cursor-text"
                    />
                    
                    <span className="text-xs text-foreground/60 font-medium select-none">of {totalPages}</span>
                  </div>

                  {/* Tombol Next */}
                  <Button
                    onClick={() => onPageChange && onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    variant="outline" size="sm"
                    className="border-foreground/30 hover:bg-foreground/5 bg-transparent text-foreground disabled:opacity-50 min-w-[40px] relative z-10"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>

                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Modal Detail Produk */}
      <ProductDetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
    </div>
  )
}