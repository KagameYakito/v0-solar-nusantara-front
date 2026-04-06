'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Package, ArrowLeft, AlertCircle, Loader2, Edit2, 
  Image as ImageIcon, Search, Eye
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ProductEditModal } from '@/components/admin/product-edit-modal'

interface Product {
  id: string
  nama_produk: string | null
  sku: string | null
  gambar_url: string | null
  stok: number | null
  spesifikasi: any
  created_at: string
  updated_at: string | null
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const ITEMS_PER_PAGE = 100

export default function AdminDataDashboard() {
  const router = useRouter()
  
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedTerm, setDebouncedTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'latest'>('all')
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm)
      setCurrentPage(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })

      if (filterType === 'latest') {
        const { data: latestData } = await supabase
          .from('latest_updates')
          .select('product_id')
          .gte('updated_at', new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString())
          .order('updated_at', { ascending: false })
        
        // ✅ FIX: Langsung map ke string, tidak perlu .toString() lagi
        const productIds = latestData?.map(d => d.product_id) || []
        
        if (productIds.length === 0) {
          setProducts([])
          setTotalProducts(0)
          return
        }
        
        query = query.in('id', productIds)
        query = query.order('updated_at', { ascending: false, nullsFirst: false })
      } else {
        query = query.order('sku', { ascending: true })
      }
      
      if (debouncedTerm) {
        query = query.or(`nama_produk.ilike.%${debouncedTerm}%,sku.ilike.%${debouncedTerm}%`)
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
  }, [currentPage, debouncedTerm, filterType])

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
        
        if (!profile || (profile.role !== 'admin_data' && profile.role !== 'super_admin')) {
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

  useEffect(() => {
    if (isAuthorized) {
      fetchProducts()
    }
  }, [isAuthorized, fetchProducts])

  const openEditModal = (product: Product) => {
    setSelectedProduct(product)
    setShowEditModal(true)
  }

  const handleSaveSuccess = () => {
    setShowEditModal(false)
    setSelectedProduct(null)
    fetchProducts()
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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
              Admin Data Dashboard
            </h1>
            <p className="text-slate-400 mt-1">Kelola data produk, gambar, dan informasi.</p>
          </div>
        </div>
        <Badge variant="outline" className="text-green-400 border-green-400 px-4 py-2 bg-green-900/20 hidden md:flex">
          ADMIN_DATA
        </Badge>
      </div>

      {/* SEARCH & FILTER */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="pt-6 space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Cari produk berdasarkan nama atau SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded pl-10 pr-4 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-green-500"
              />
            </div>
            {searchTerm && (
              <Button 
                variant="outline" 
                onClick={() => setSearchTerm('')} 
                className="border-slate-700"
              >
                Clear
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={filterType === 'all' ? 'default' : 'outline'}
              onClick={() => {
                setFilterType('all')
                setCurrentPage(1)
              }}
              className={filterType === 'all' ? 'bg-blue-600 hover:bg-blue-700' : 'border-slate-700'}
            >
              Semua Produk
            </Button>
            <Button
              variant={filterType === 'latest' ? 'default' : 'outline'}
              onClick={() => {
                setFilterType('latest')
                setCurrentPage(1)
              }}
              className={filterType === 'latest' ? 'bg-orange-600 hover:bg-orange-700' : 'border-slate-700'}
            >
              Latest Update (4 Hari)
            </Button>
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
              {totalProducts === 0 ? '0' : `${startIndex}-${endIndex}`} dari {totalProducts}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-12 text-slate-500 flex flex-col items-center">
              <Package className="h-12 w-12 mb-3 opacity-50" />
              <p className="text-lg font-medium">
                {searchTerm ? "Tidak ada produk yang sesuai dengan pencarian." : "Belum ada produk."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800 uppercase font-medium">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">No</th>
                    <th className="px-4 py-3">Kode Produk (SKU)</th>
                    <th className="px-4 py-3">Gambar</th>
                    <th className="px-4 py-3">Nama Produk</th>
                    <th className="px-4 py-3">Tanggal Terakhir Diubah</th>
                    <th className="px-4 py-3 rounded-tr-lg text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {products.map((product, index) => {
                    const globalIndex = startIndex + index
                    return (
                      <tr key={product.id} className="hover:bg-slate-800/50">
                        <td className="px-4 py-3 text-slate-400">{globalIndex}</td>
                        <td className="px-4 py-3 font-mono text-orange-400 font-medium">
                          {product.sku || `SKU-${product.id}`}
                        </td>
                        <td className="px-4 py-3">
                          {product.gambar_url ? (
                            <div className="relative group">
                              <img
                                src={product.gambar_url}
                                alt={product.nama_produk || 'Product'}
                                className="w-16 h-16 object-cover rounded-lg border border-slate-700"
                              />
                              <button
                                onClick={() => window.open(product.gambar_url, '_blank')}
                                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg"
                              >
                                <Eye className="h-5 w-5 text-white" />
                              </button>
                            </div>
                          ) : (
                            <div className="w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700">
                              <ImageIcon className="h-6 w-6 text-slate-600" />
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium text-white">
                          {product.nama_produk || 'Produk Tanpa Nama'}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-sm">
                          {formatDate(product.updated_at || product.created_at)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            size="sm"
                            onClick={() => openEditModal(product)}
                            className="bg-blue-600 hover:bg-blue-700 text-xs"
                          >
                            <Edit2 className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          
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

      {/* EDIT MODAL */}
      {selectedProduct && (
        <ProductEditModal
          product={selectedProduct}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setSelectedProduct(null)
          }}
          onSave={handleSaveSuccess}
        />
      )}
    </div>
  )
}