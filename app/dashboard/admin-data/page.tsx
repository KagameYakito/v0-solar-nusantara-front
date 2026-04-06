'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Package, ArrowLeft, AlertCircle, Loader2, Edit2, Upload, 
  Image as ImageIcon, Search, X, Save, Trash2, Eye
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'

interface Product {
  id: string
  nama_produk: string | null
  sku: string | null
  gambar_url: string | null
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
  
  // Modal states
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm)
      setCurrentPage(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Fetch products
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .order('sku', { ascending: true })
      
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
  }, [currentPage, debouncedTerm])

  // Check authorization
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
        
        // ✅ Allow admin_data and super_admin
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

  // Handle file select
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (!file.type.startsWith('image/')) {
      alert('❌ Hanya file gambar yang diperbolehkan!')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('❌ Ukuran file maksimal 10MB!')
      return
    }
    
    setSelectedFile(file)
    
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Upload image to Supabase Storage
  const uploadImage = async (productId: string): Promise<string | null> => {
    if (!selectedFile) return null
    
    try {
      setUploadingImage(true)
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `${productId}-${Date.now()}.${fileExt}`
      const filePath = `product-images/${fileName}`
      
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: true
        })
      
      if (error) throw error
      
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)
      
      return urlData.publicUrl
    } catch (err: any) {
      console.error("Upload error:", err)
      alert('❌ Gagal upload gambar: ' + err.message)
      return null
    } finally {
      setUploadingImage(false)
    }
  }

  // Open edit modal
  const openEditModal = (product: Product) => {
    setEditingProductId(product.id)
    setEditingName(product.nama_produk || '')
    setImagePreview(product.gambar_url)
    setSelectedFile(null)
    setShowEditModal(true)
  }

  // Save product changes
  const handleSaveProduct = async () => {
    if (!editingProductId) return
    
    try {
      setSaving(true)
      
      let imageUrl = imagePreview
      let currentProduct = products.find(p => p.id === editingProductId)
      
      // Upload new image if selected
      if (selectedFile) {
        const uploadedUrl = await uploadImage(editingProductId)
        if (uploadedUrl) {
          imageUrl = uploadedUrl
          
          // Delete old image if exists
          if (currentProduct?.gambar_url) {
            const oldPath = currentProduct.gambar_url.split('/').pop()
            if (oldPath) {
              await supabase.storage
                .from('product-images')
                .remove([`product-images/${oldPath}`])
            }
          }
        }
      }
      
      const updateData: any = {
        nama_produk: editingName,
        updated_at: new Date().toISOString()
      }
      
      if (imageUrl && imageUrl !== currentProduct?.gambar_url) {
        updateData.gambar_url = imageUrl
      }
      
      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', editingProductId)
      
      if (error) throw error
      
      await fetchProducts()
      setShowEditModal(false)
      setEditingProductId(null)
      setEditingName('')
      setImagePreview(null)
      setSelectedFile(null)
      
      alert("✅ Data produk berhasil diupdate!")
    } catch (err: any) {
      alert("❌ Gagal update produk: " + err.message)
    } finally {
      setSaving(false)
    }
  }

  // Format date
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

  // Pagination
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

      {/* SEARCH BAR */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="pt-6">
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
          
          {/* Pagination */}
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
      {showEditModal && (
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-blue-400">
                <Edit2 className="h-5 w-5" />
                Edit Data Produk
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Update informasi produk dan upload gambar.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              {/* Image Upload */}
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Gambar Produk</label>
                <div className="border-2 border-dashed border-slate-600 rounded-lg p-4">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg border border-slate-700"
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setImagePreview(null)
                          setSelectedFile(null)
                        }}
                        className="absolute top-2 right-2 h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center space-y-2">
                      <ImageIcon className="h-12 w-12 text-slate-600 mx-auto" />
                      <p className="text-sm text-slate-400">Belum ada gambar</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="product-image-upload"
                      />
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById('product-image-upload')?.click()}
                        disabled={uploadingImage}
                        className="border-slate-600"
                      >
                        {uploadingImage ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Pilih Gambar
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-slate-500">Max 10MB (JPG, PNG, WebP)</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Product Name */}
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Nama Produk</label>
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  placeholder="Masukkan nama produk"
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditModal(false)
                  setEditingProductId(null)
                  setEditingName('')
                  setImagePreview(null)
                  setSelectedFile(null)
                }}
                className="border-slate-600"
                disabled={saving || uploadingImage}
              >
                Batal
              </Button>
              <Button
                onClick={handleSaveProduct}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={saving || uploadingImage}
              >
                {saving || uploadingImage ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Simpan Perubahan
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}