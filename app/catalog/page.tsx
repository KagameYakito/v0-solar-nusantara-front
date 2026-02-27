'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CategorySidebar } from '@/components/catalog/category-sidebar'
import { ProductGrid } from '@/components/catalog/product-grid'
import { categoriesData } from '@/data/categories'
import { supabase } from '@/utils/supabaseClient'

export default function CatalogPage() {
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  
  // State untuk keamanan
  const [loading, setLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const router = useRouter()

  // --- SATPAM LOKAL (CLIENT-SIDE GUARD) ---
  useEffect(() => {
    const checkAuth = async () => {
      // Cek sesi langsung ke Supabase
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        // TIDAK ADA SESI? USIR PAKSA!
        console.warn("⛔ UNAUTHORIZED ACCESS ATTEMPT BLOCKED.")
        alert("Access Denied: Please log in to view the catalog.")
        router.push('/')
      } else {
        // ADA SESI? SILAKAN MASUK.
        console.log("✅ ACCESS GRANTED.")
        setIsAuthorized(true)
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  // TAMPILAN SAAT CEK SESI (LOADING)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a] text-white">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg font-medium">Verifying Access...</p>
        </div>
      </div>
    )
  }

  // JIKA TIDAK AUTHORIZED (JAGA-JAGA), JANGAN RENDER APA-APA
  if (!isAuthorized) {
    return null
  }

  // --- KONTEN HALAMAN (HANYA MUNCUL JIKA LOGIN) ---
  const getSelectedProducts = () => {
    if (!selectedSubcategory) {
      const allProducts: any[] = []
      categoriesData.forEach((category) => {
        category.subcategories.forEach((sub) => {
          allProducts.push(...sub.products)
        })
      })
      return allProducts
    }
    for (const category of categoriesData) {
      for (const subcategory of category.subcategories) {
        if (subcategory.name === selectedSubcategory) {
          return subcategory.products
        }
      }
    }
    return []
  }

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
            <Button
              variant="outline"
              className="border-foreground/30 hover:bg-foreground/5 rounded-lg text-foreground flex items-center gap-2 bg-transparent"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <CategorySidebar
              categories={categoriesData}
              selectedSubcategory={selectedSubcategory}
              onSelectSubcategory={setSelectedSubcategory}
            />
          </div>
          <div className="lg:col-span-3">
            <ProductGrid
              products={getSelectedProducts()}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
            />
          </div>
        </div>
      </main>
    </div>
  )
}