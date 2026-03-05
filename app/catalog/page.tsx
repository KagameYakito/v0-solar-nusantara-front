// app/catalog/page.tsx
'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CategorySidebar } from '@/components/catalog/category-sidebar'
import { ProductGrid } from '@/components/catalog/product-grid'
import { useProducts } from '@/hooks/useProducts'
import { supabase } from '@/utils/supabaseClient' 

export default function CatalogPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  
  const [loadingAuth, setLoadingAuth] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)

  // STATE KHUSUS UNTUK SIDEBAR (Agar tidak terpengaruh filter grid)
  const [globalTotalCount, setGlobalTotalCount] = useState<number>(0)
  const [globalCategories, setGlobalCategories] = useState<any[]>([])
  
  const router = useRouter()

  // --- FITUR BARU: DEBOUNCE REF ---
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fungsi handler khusus untuk kategori yang aman dari spam klik
  const handleCategorySelect = (category: string | null) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setSelectedCategory(category);
    }, 300); 
  };

  // 1. AMBIL DATA GLOBAL SEKALI SAJA SAAT HALAMAN DIBUKA
  useEffect(() => {
    const fetchGlobalStats = async () => {
      console.log(" Mengambil statistik global (hanya sekali)...")
      
      try {
        const { count } = await supabase.from('products').select('*', { count: 'exact', head: true })
        if (count) setGlobalTotalCount(count)

        const { data } = await supabase.from('products').select('kategori')
        if (data) {
          const map: Record<string, number> = {}
          data.forEach(item => {
            if (!item.kategori) return
            item.kategori.replace(/""/g, "").split(',').forEach((c: string) => {
              const clean = c.trim()
              if (clean) map[clean] = (map[clean] || 0) + 1
            })
          })
          const result = Object.entries(map)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => a.name.localeCompare(b.name))
          setGlobalCategories(result)
        }
      } catch (error) {
        console.error("Gagal ambil data global:", error)
      }
    }

    fetchGlobalStats()
  }, []) 

  // 2. HOOK UNTUK GRID PRODUK
  const { loading, error } = useProducts(1, 28, searchTerm, selectedCategory)

  // --- SATPAM LOKAL (Auth Check) ---
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // ✅ PERBAIKAN DI SINI: Sintaks destructuring yang benar
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
          <div className="lg:col-span-1">
            <CategorySidebar
              categories={globalCategories}
              totalCount={globalTotalCount} 
              selectedCategory={selectedCategory}
              onSelectCategory={handleCategorySelect} 
            />
          </div>
          
          <div className="lg:col-span-3">
            <ProductGrid
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              selectedCategory={selectedCategory}
            />
          </div>
        </div>
      </main>
    </div>
  )
}