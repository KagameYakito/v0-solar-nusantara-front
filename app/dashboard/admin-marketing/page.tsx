'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Package, ArrowLeft, AlertCircle, Loader2, Edit2, X, Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

// Interface disesuaikan dengan nama kolom database
interface Product {
  id: string
  nama_produk: string | null
  harga: number | null
  created_at: string
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const ITEMS_PER_PAGE = 100

export default function AdminMarketingDashboard() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthorized, setIsAuthorized] = useState(false)
  
  const [currentPage, setCurrentPage] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editPrice, setEditPrice] = useState<string>('')
  
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedTerm, setDebouncedTerm] = useState('')

  const debouncedSearch = useCallback((term: string) => {
    setSearchTerm(term)
    setCurrentPage(1)
  }, [])

  // Fetch Products
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
      
      if (searchTerm) {
        query = query.ilike('nama_produk', `%${searchTerm}%`)
      }
      
      const start = (currentPage - 1) * ITEMS_PER_PAGE
      const end = start + ITEMS_PER_PAGE - 1
      query = query.range(start, end)
      
      const { data, error, count } = await query
      
      if (error) throw error
      
      setProducts(data || [])
      setTotalProducts(count || 0)
      
    } catch (err: any) {
      console.error("Failed to fetch products:", err)
      setError("Gagal memuat data produk: " + err.message)
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchTerm])

  // Check Auth
  useEffect(() => {
    let isMounted = true
    let timeoutId: NodeJS.Timeout | null = null

    const checkAuthAndLoad = async () => {
      try {
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Session check timeout')), 5000)
        })

        const sessionResponse: any = await Promise.race([
          supabase.auth.getSession(),
          timeoutPromise
        ])

        if (timeoutId) clearTimeout(timeoutId)
        if (!isMounted) return
        
        if (sessionResponse.error || !sessionResponse.data.session) {
          window.location.href = '/auth/signin'
          return
        }

        const session = sessionResponse.data.session

        const profileResponse = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()

        if (!isMounted) return

        if (profileResponse.error) {
          window.location.href = '/'
          return
        }

        const profile = profileResponse.data

        if (!profile || (profile.role !== 'admin_marketing' && profile.role !== 'super_admin')) {
          window.location.href = '/'
          return
        }

        if (isMounted) {
          setIsAuthorized(true)
        }

      } catch (err: any) {
        console.error("Critical Auth Error:", err.message)
        if (isMounted) {
          setLoading(false)
          window.location.href = '/auth/signin'
        }
      }
    }

    checkAuthAndLoad()

    return () => {
      isMounted = false
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [])

  // Fetch products when authorized
  useEffect(() => {
    if (isAuthorized) {
      fetchProducts()
    }
  }, [currentPage, searchTerm, isAuthorized, fetchProducts])

  useEffect(() => {
    const timer = setTimeout(() => {
      // Hanya update searchTerm jika debouncedTerm berubah
      // Ini akan memicu fetchProducts lewat useEffect di atas
      setSearchTerm(debouncedTerm)
      setCurrentPage(1)
    }, 300) // Tunggu 300ms setelah user berhenti mengetik
    
    // Cleanup: batalkan timer jika user mengetik lagi sebelum 300ms
    return () => clearTimeout(timer)
  }, [debouncedTerm])

  // Handle Price Update - UPDATE KOLOM 'harga'
  const handlePriceUpdate = async (productId: string, newPrice: number) => {
    if (isNaN(newPrice) || newPrice < 0) {
      alert("Harga tidak valid!")
      return
    }

    try {
      const { error } = await supabase
        .from('products')
        .update({ harga: newPrice })  // <-- Update kolom 'harga'
        .eq('id', productId)

      if (error) throw error

      // Update local state
      setProducts(products.map(p => 
        p.id === productId ? { ...p, harga: newPrice } : p
      ))
      
      setEditingId(null)
      alert("✅ Harga berhasil diubah!")
      
    } catch (err: any) {
      alert("❌ Gagal mengubah harga: " + err.message)
    }
  }

  const handleSetToAuction = () => {
    alert("⚠️ Fitur Auction belum tersedia.")
  }

  const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE + 1
  const endIndex = Math.min(currentPage * ITEMS_PER_PAGE, totalProducts)

  if (loading && !error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
        <span className="ml-2">Memuat Data Produk...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-4">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Terjadi Kesalahan</h2>
        <p className="text-slate-400 mb-4 max-w-md text-center">{error}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition">
          Coba Lagi
        </button>
      </div>
    )
  }

  if (!isAuthorized) return null

  return (
    <div className="p-8 space-y-6 bg-slate-950 min-h-screen text-slate-100">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group">
            <div className="bg-slate-800 p-2 rounded-lg group-hover:bg-slate-700 border border-slate-700">
              <ArrowLeft className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium hidden sm:inline">Back to Home</span>
          </Link>

          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-green-500">
              <Package className="h-8 w-8" />
              Admin Marketing Dashboard
            </h1>
            <p className="text-slate-400 mt-1">Kelola harga produk.</p>
          </div>
        </div>

        <Badge variant="outline" className="text-green-400 border-green-400 px-4 py-2 bg-green-900/20 hidden md:flex">
          ADMIN_MARKETING
        </Badge>
      </div>

      {/* SEARCH BAR */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="pt-6">
            <div className="flex gap-4">
            {/* GUNAKAN debouncedTerm, BUKAN searchTerm */}
            <input
                type="text"
                placeholder="Cari produk..."
                value={debouncedTerm} 
                onChange={(e) => setDebouncedTerm(e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-700 rounded px-4 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-green-500"
            />
            
            {/* Clear button mereset debouncedTerm */}
            {debouncedTerm && (
                <Button 
                variant="outline" 
                onClick={() => {
                    setDebouncedTerm('')
                    setSearchTerm('')
                    setCurrentPage(1)
                }} 
                className="border-slate-700"
                >
                Clear
                </Button>
            )}
            </div>
        </CardContent>
        </Card>

      {/* PRODUCTS TABLE */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-green-400" />
              Daftar Produk
            </div>
            <span className="text-sm text-slate-400">
              {startIndex}-{endIndex} dari {totalProducts}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              {searchTerm ? "Tidak ada produk yang sesuai." : "Belum ada produk."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800 uppercase font-medium">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">No</th>
                    <th className="px-4 py-3">Nama Produk</th>
                    <th className="px-4 py-3">Harga</th>
                    <th className="px-4 py-3 rounded-tr-lg text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {products.map((product, index) => {
                    const globalIndex = startIndex + index
                    const isEditing = editingId === product.id
                    
                    return (
                      <tr key={product.id} className="hover:bg-slate-800/50">
                        <td className="px-4 py-3 text-slate-400">{globalIndex}</td>
                        {/* Gunakan nama_produk */}
                        <td className="px-4 py-3 font-medium text-white">
                          {product.nama_produk || 'Produk Tanpa Nama'}
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={editPrice}
                                onChange={(e) => setEditPrice(e.target.value)}
                                className="w-32 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white"
                                autoFocus
                              />
                              <Button
                                size="sm"
                                onClick={() => handlePriceUpdate(product.id, parseInt(editPrice) || 0)}
                                className="h-8 bg-green-600 hover:bg-green-700"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingId(null)}
                                className="h-8 border-slate-600"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            // Gunakan harga dengan fallback 0
                            <span className="text-white font-mono">
                              Rp {(product.harga || 0).toLocaleString('id-ID')}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            {!isEditing && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setEditingId(product.id)
                                  setEditPrice((product.harga || 0).toString())
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-xs"
                              >
                                <Edit2 className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                            )}
                            <Button
                              size="sm"
                              onClick={handleSetToAuction}
                              disabled
                              className="bg-slate-700 text-slate-400 cursor-not-allowed text-xs"
                            >
                              Auction
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-800">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="border-slate-700 disabled:opacity-50"
              >
                ← Prev
              </Button>
              <span className="text-slate-400 text-sm">Page {currentPage} / {totalPages}</span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="border-slate-700 disabled:opacity-50"
              >
                Next →
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}