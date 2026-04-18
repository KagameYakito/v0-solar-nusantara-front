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

  const [selectedSubCategory, setSelectedSubCategory] = useState<number | null>(null)

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

  // --- DEBUG LOG ---
  useEffect(() => {
    console.log('🔍 State changed:', {
      selectedCategory,
      selectedSubCategory,
      searchTerm,
      currentPage
    });
  }, [selectedCategory, selectedSubCategory, searchTerm, currentPage]);

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
    selectedCategory,
    selectedSubCategory 
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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 animate-fade-in">
      {/* Header */}
      <header className="border-b-2 border-border bg-card/80 backdrop-blur-xl shadow-sm p-5 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/solar-nusantara-logo.svg" 
              alt="Solar Nusantara" 
              className="h-10 w-auto"
            />
            <div className="h-8 w-px bg-border" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              Product Catalog
            </h1>
          </div>
          <Link href="/">
            <Button variant="outline" className="border-2 border-primary/40 hover:bg-primary/10 hover:border-primary rounded-xl text-foreground font-semibold flex items-center gap-2 bg-transparent transition-all duration-200">
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* SIDEBAR KIRI */}
          <div className="lg:col-span-1">
            <CategorySidebar
              categories={categories}
              selectedCategory={selectedCategory}
              selectedSubCategory={selectedSubCategory}  // ✅ TAMBAHKAN
              onSelectCategory={setSelectedCategory}
              onSelectSubCategory={setSelectedSubCategory}  // ✅ TAMBAHKAN
              totalCount={totalCount}
            />
          </div>
          
          {/* KONTEN KANAN (Grid + Pagination) */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Search Bar (Tetap Ada) */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search products (e.g., battery, inverter)..."
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full bg-card/60 border-2 border-border rounded-xl py-4 px-4 pl-12 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 font-medium placeholder-foreground/50"
              />
              <svg className="w-5 h-5 text-primary/70 absolute left-4 top-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>

            {/* Grid Produk */}
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="text-red-500 text-center p-8 bg-red-500/10 rounded-xl border-2 border-red-500/20">Error: {error}</div>
            ) : products.length === 0 ? (
              <div className="text-center p-16 bg-card/60 rounded-2xl border-2 border-border">
                <p className="text-xl text-foreground/70 font-semibold">No products found.</p>
                <p className="text-sm text-foreground/50 mt-2">Try changing the category or search keywords.</p>
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