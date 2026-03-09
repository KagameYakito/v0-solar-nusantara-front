// app/catalog/page.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CategorySidebar } from '@/components/catalog/category-sidebar'
import { ProductGrid } from '@/components/catalog/product-grid'
import { useProducts } from '@/hooks/useProducts'
import { supabase } from '@/utils/supabaseClient' 

// Komponen Pagination Sederhana (Pastikan lo punya ini atau import dari UI library lo)
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"

export default function CatalogPage() {
  // GANTI STATE MENJADI NUMBER (ID)
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 28
  
  const [loadingAuth, setLoadingAuth] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  
  const router = useRouter()
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // --- AUTH CHECK ---
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          alert("Access Denied: Please log in.")
          router.push('/')
        } else {
          setIsAuthorized(true)
          setLoadingAuth(false)
        }
      } catch (err) {
        router.push('/')
      }
    }
    checkAuth()
  }, [router])

  // --- DEBOUNCE SEARCH ---
  const handleSearchChange = (value: string) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setSearchTerm(value);
      setCurrentPage(1); // Reset ke halaman 1 saat search berubah
    }, 300);
  };

  // --- HANDLE CATEGORY CHANGE ---
  const handleCategorySelect = (categoryId: number | null) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1); // Reset ke halaman 1 saat ganti kategori
  };

  // --- HOOK UTAMA ---
  const { products, categories, loading, error, totalCount, globalTotalCount } = useProducts(
    currentPage,
    ITEMS_PER_PAGE,
    searchTerm,
    selectedCategory
  );

  // Hitung total halaman berdasarkan TOTAL HASIL FILTER (bukan global)
  // Jika kategori cuma punya 1 produk, totalPages = 1.
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a] text-white">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
        <p>Verifying Access...</p>
      </div>
    )
  }

  if (!isAuthorized) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] to-[#1e293b] animate-fade-in">
      {/* Header */}
      <header className="border-b border-foreground/15 bg-card/50 backdrop-blur p-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Exclusive Product Catalog
          </h1>
          <Link href="/">
            <Button variant="outline" className="border-foreground/30 hover:bg-foreground/5 rounded-lg text-foreground flex items-center gap-2 bg-transparent">
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* SIDEBAR KIRI */}
          <div className="lg:col-span-1">
            <CategorySidebar
              categories={categories}
              totalCount={globalTotalCount} // Tampilkan total absolut (10444) di sidebar
              selectedCategory={selectedCategory}
              onSelectCategory={handleCategorySelect} 
            />
          </div>
          
          {/* KONTEN KANAN (Grid + Pagination) */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Search Bar (Tetap Ada) */}
            <div className="relative">
              <input
                type="text"
                placeholder="Cari produk (misal: battery, inverter)..."
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full bg-card/50 border border-foreground/15 rounded-lg py-3 px-4 pl-10 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <svg className="w-5 h-5 text-foreground/50 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>

            {/* Grid Produk */}
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="text-red-500 text-center p-4">Error: {error}</div>
            ) : products.length === 0 ? (
              <div className="text-center p-12 bg-card/30 rounded-lg border border-foreground/10">
                <p className="text-xl text-foreground/70">Tidak ada produk ditemukan.</p>
                <p className="text-sm text-foreground/50 mt-2">Coba ubah kategori atau kata kunci pencarian.</p>
              </div>
            ) : (
              <>
                <ProductGrid products={products} />
                
                {/* PAGINATION (Dinamis sesuai hasil filter) */}
                {totalPages > 1 && (
                  <Pagination className="justify-end">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage > 1) setCurrentPage(currentPage - 1);
                          }}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                      
                      {/* Simple Page Indicator */}
                      <PaginationItem>
                        <span className="px-4 py-2 text-sm text-foreground">
                          Page {currentPage} of {totalPages}
                        </span>
                      </PaginationItem>

                      <PaginationItem>
                        <PaginationNext 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                          }}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}