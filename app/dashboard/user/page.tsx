'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { 
  User, Building2, Phone, MapPin, Mail, Calendar, CheckCircle, AlertCircle, Loader2, 
  Edit2, Save, X, Package, Gavel, History, FileText, ArrowLeft, ShoppingCart, Plus, 
  Trash2, Minus, ExternalLink, CheckSquare, Square, Image as ImageIcon, Eye, Clock, 
  MessageSquare, Bookmark, CheckCircle2, XCircle 
} from 'lucide-react'

interface Profile {
  id: string
  email: string | null
  full_name: string | null
  role: string | null
  company_name: string | null
  company_type: string | null
  tax_id: string | null
  company_address: string | null
  phone_number: string | null
  profile_completed: boolean | null
  created_at: string
  updated_at: string
}

interface WishlistItem {
  product_id: string
  product_name: string
  product_image_url?: string | null
  price: number
  quantity: number
  added_date: string
}

interface RequestItem {
  id?: string
  product_id: string
  product_name: string
  product_image_url?: string | null
  unit_price: number
  quantity: number
  subtotal: number
  status: 'wishlist' | 'pending' | 'approved' | 'rejected' | 'fulfilled'
  admin_notes?: string | null
  created_at?: string
  updated_at?: string
}

interface ProductRequest {
  id: string
  request_number: string
  user_id: string
  status: 'pending' | 'reviewed' | 'approved' | 'rejected' | 'fulfilled'
  notes?: string | null
  admin_notes?: string | null
  total_items: number
  estimated_total: number
  created_at: string
  updated_at: string
  reviewed_at?: string | null
  items?: RequestItem[]
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function UserDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [activeTab, setActiveTab] = useState('profile')
  const [productRequests, setProductRequests] = useState<ProductRequest[]>([])
  
  // Wishlist & Modal State
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [wishlist, setWishlist] = useState<WishlistItem[]>([])
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [submittingRequest, setSubmittingRequest] = useState(false)
  const [fetchingRequests, setFetchingRequests] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [selectedStatusItem, setSelectedStatusItem] = useState<RequestItem | null>(null)
  const [showProfileAlert, setShowProfileAlert] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    company_name: '',
    company_type: '',
    tax_id: '',
    company_address: '',
    phone_number: ''
  })

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const fetchProfile = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        window.location.href = '/auth/signin'
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error) throw error

      setProfile(data)
      setFormData({
        full_name: data.full_name || '',
        company_name: data.company_name || '',
        company_type: data.company_type || '',
        tax_id: data.tax_id || '',
        company_address: data.company_address || '',
        phone_number: data.phone_number || ''
      })
      setIsAuthorized(true)
      
    } catch (err: any) {
      console.error("Failed to fetch profile:", err)
      setError("Gagal memuat data profil: " + err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const handleSaveProfile = async () => {
    if (!profile?.id) return

    try {
      setSaving(true)

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          company_name: formData.company_name,
          company_type: formData.company_type,
          tax_id: formData.tax_id,
          company_address: formData.company_address,
          phone_number: formData.phone_number,
          profile_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)

      if (error) throw error

      setProfile(prev => prev ? { 
        ...prev, 
        ...formData, 
        profile_completed: true,
        updated_at: new Date().toISOString()
      } : null)
      setIsEditing(false)
      alert("✅ Profil berhasil diperbarui!")

    } catch (err: any) {
      alert("❌ Gagal menyimpan profil: " + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        company_name: profile.company_name || '',
        company_type: profile.company_type || '',
        tax_id: profile.tax_id || '',
        company_address: profile.company_address || '',
        phone_number: profile.phone_number || ''
      })
    }
    setIsEditing(false)
  }
  
  const checkProfileCompletion = () => {
    if (!profile?.profile_completed) {
      setShowProfileAlert(true)
      return false
    }
    return true
  }

  // ✅ GANTI FUNGSI removeItem DENGAN INI
  const removeItem = async (productId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        alert("❌ Session expired. Silakan login ulang.")
        return
      }

    // DELETE DARI DATABASE
    const { error } = await supabase
      .from('wishlists')
      .delete()
      .eq('user_id', session.user.id)
      .eq('product_id', productId)

    if (error) throw error

    // UPDATE LOCAL STATE
    setWishlist(prev => prev.filter(item => item.product_id !== productId))
    setSelectedItems(prev => {
      const next = new Set(prev)
      next.delete(productId)
      return next
    })

  } catch (err: any) {
    console.error("Failed to remove item:", err)
    alert("❌ Gagal menghapus item: " + err.message)
  }
}

// ✅ TAMBAHKAN FUNGSI INI
const handleStatusClick = (item: RequestItem) => {
  setSelectedStatusItem(item)
  setShowStatusModal(true)
}

// ✅ GANTI FUNGSI getStatusMessage (Hapus Emoji, Pakai Icon)
const getStatusMessage = (status: string, adminNotes?: string | null) => {
  switch (status) {
    case 'wishlist':
      return {
        title: 'Wishlist',
        message: 'Barang ini telah menjadi wishlistmu! Segera ajukan permintaan untuk mendapatkan penawaran.',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/20',
        icon: Bookmark // Icon Jarum Modern
      }
    case 'pending':
      return {
        title: 'Menunggu Review',
        message: 'Barang sedang diajukan ke admin, mohon ditunggu ya! Tim kami akan segera memverifikasi ketersediaan.',
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-500/20',
        icon: Clock // Icon Jam
      }
    case 'approved':
    case 'accepted':
      return {
        title: 'Disetujui',
        message: adminNotes || 'Barang tersedia ya kak dengan budget yang telah disepakati.',
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/20',
        icon: CheckCircle2 // Icon Centang Modern
      }
    case 'rejected':
    case 'declined':
      return {
        title: 'Ditolak',
        message: adminNotes || 'Mohon maaf ya, untuk produk ini sedang tidak tersedia.',
        color: 'text-red-400',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/20',
        icon: XCircle // Icon Silang Modern
      }
    default:
      return {
        title: 'Status',
        message: 'Status tidak dikenali.',
        color: 'text-slate-400',
        bgColor: 'bg-slate-500/10',
        borderColor: 'border-slate-500/20',
        icon: Clock
      }
  }
}

// ✅ UPDATE getStatusBadgeColor (Lebih Halus & Modern)
const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case 'wishlist':
      return 'bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20'
    case 'pending':
      return 'bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20'
    case 'approved':
      return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
    case 'rejected':
      return 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
    case 'fulfilled':
      return 'bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20'
    default:
      return 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
  }
}

// ✅ UPDATE QUANTITY JUGA HARUS SYNC KE DATABASE
const updateQuantity = async (productId: string, delta: number) => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    // Find current item
    const currentItem = wishlist.find(item => item.product_id === productId)
    if (!currentItem) return

    const newQty = Math.max(1, currentItem.quantity + delta)

    // UPDATE DATABASE
    const { error } = await supabase
      .from('wishlists')
      .update({ 
        quantity: newQty,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', session.user.id)
      .eq('product_id', productId)

    if (error) throw error

    // UPDATE LOCAL STATE
    setWishlist(prev => prev.map(item => {
      if (item.product_id === productId) {
        return { ...item, quantity: newQty }
      }
      return item
    }))

  } catch (err: any) {
    console.error("Failed to update quantity:", err)
    alert("❌ Gagal update quantity: " + err.message)
  }
}

  // Toggle item selection
  const toggleItemSelection = (productId: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev)
      if (next.has(productId)) {
        next.delete(productId)
      } else {
        next.add(productId)
      }
      return next
    })
  }

  // Select all items
  const selectAllItems = () => {
    if (selectedItems.size === wishlist.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(wishlist.map(item => item.product_id)))
    }
  }

  // Calculate selected items total
  const getSelectedItemsTotal = () => {
    return wishlist
      .filter(item => selectedItems.has(item.product_id))
      .reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }

  const getSelectedItemsCount = () => {
    return wishlist.filter(item => selectedItems.has(item.product_id)).length
  }

  const getTotalQuantity = () => {
    return wishlist
      .filter(item => selectedItems.has(item.product_id))
      .reduce((sum, item) => sum + item.quantity, 0)
  }

  const getStatusBadgeText = (status: string) => {
    switch (status) {
      case 'wishlist':
        return 'Wishlist'
      case 'pending':
        return 'Menunggu Review'
      case 'approved':
        return 'Disetujui'
      case 'rejected':
        return 'Ditolak'
      case 'fulfilled':
        return 'Terpenuhi'
      default:
        return status
    }
  }

  const submitRequest = async () => {
    if (selectedItems.size === 0) {
      alert("❌ Pilih item yang mau di-request!")
      return
    }

    // Show confirmation modal first
    setShowConfirmModal(true)
  }

// HAPUS useEffect localStorage yang lama
// GANTI dengan fetch dari database + realtime subscription

const fetchWishlist = useCallback(async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    // 1. Fetch wishlist dulu
    const { data: wishlistData, error } = await supabase
      .from('wishlists')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    if (!wishlistData || wishlistData.length === 0) {
      setWishlist([])
      return
    }

    // 2. Fetch products untuk dapat harga terbaru
    const productIds = [...new Set(wishlistData.map(w => w.product_id))]
    const { data: productsData } = await supabase
      .from('products')
      .select('id, harga')
      .in('id', productIds)

    // 3. Gabungkan data dengan harga terbaru dari products
    const enrichedWishlist = wishlistData.map(item => ({
      ...item,
      // ✅ PRIORITASKAN HARGA DARI PRODUCTS TABLE
      price: productsData?.find(p => p.id.toString() === item.product_id.toString())?.harga || item.price || 0
    }))

    setWishlist(enrichedWishlist)
  } catch (err: any) {
    console.error("Failed to fetch wishlist:", err)
  }
}, [])

// Load wishlist saat component mount
useEffect(() => {
  fetchWishlist()
}, [fetchWishlist])

// ✅ REALTIME SUBSCRIPTION - Auto refresh saat ada perubahan
// ✅ GANTI BAGIAN INI (line 437-450)
// ✅ GANTI useEffect INI (line 428-450)
useEffect(() => {
  const fetchSessionAndSubscribe = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const channel = supabase
      .channel('wishlist-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wishlists',
          filter: `user_id=eq.${session.user.id}`
        },
        () => {
          fetchWishlist()
        }
      )
      .subscribe()

    // ✅ TAMBAHKAN TYPE ANNOTATION DI CLEANUP
    return () => {
      supabase.removeChannel(channel)
    }
  }

  fetchSessionAndSubscribe()
}, [])

// ✅ LISTEN untuk event dari ProductDetailModal (jika masih pakai localStorage fallback)
useEffect(() => {
  const handleWishlistUpdated = () => {
    fetchWishlist()
  }

  window.addEventListener('wishlist-updated', handleWishlistUpdated)
  return () => window.removeEventListener('wishlist-updated', handleWishlistUpdated)
}, [])

  const confirmSubmitRequest = async () => {
    if (selectedItems.size === 0) {
      alert("❌ Pilih item yang mau di-request!")
      return
    }

    try {
      setSubmittingRequest(true)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        alert("❌ Session expired. Silakan login ulang.")
        return
      }

      // Get selected items from wishlist
      const selectedWishlistItems = wishlist.filter(item => selectedItems.has(item.product_id))
      
      // Calculate totals
      const productIds = selectedWishlistItems.map(item => item.product_id)
      const { data: latestProducts } = await supabase
        .from('products')
        .select('id, harga')
        .in('id', productIds)
    
      // Calculate totals dengan harga terbaru
      const totalItems = selectedWishlistItems.length
      const estimatedTotal = selectedWishlistItems.reduce((sum, item) => {
        const latestPrice = latestProducts?.find(p => p.id.toString() === item.product_id.toString())?.harga || item.price
        return sum + (latestPrice * item.quantity)
      }, 0)

      // Insert request to product_requests table
      const { data: requestData, error: requestError } = await supabase
        .from('product_requests')
        .insert({
          user_id: session.user.id,
          status: 'pending',
          total_items: totalItems,
          estimated_total: estimatedTotal,
          notes: 'Request dari User Dashboard',
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (requestError) throw requestError

      // Insert each item to request_items table
      const requestItems = selectedWishlistItems.map(item => {
        // ✅ DEFISINIKAN ULANG latestPrice DI SINI (di dalam scope map)
        const latestPrice = latestProducts?.find(p => p.id.toString() === item.product_id.toString())?.harga || item.price

        return {
          request_id: requestData.id,
          product_id: item.product_id,
          product_name: item.product_name,
          product_image_url: item.product_image_url || null,
          unit_price: latestPrice,       // ✅ Sekarang aman
          quantity: item.quantity,
          subtotal: latestPrice * item.quantity, // ✅ Sekarang aman
          status: 'pending' as const,    // Atau 'requested'
          created_at: new Date().toISOString()
        }
      })

      const { error: itemsError } = await supabase
        .from('request_items')
        .insert(requestItems)

      if (itemsError) throw itemsError

      const { error: updateError } = await supabase
        .from('wishlists')
        .update({ 
          status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', session.user.id)
        .in('product_id', Array.from(selectedItems))

      if (updateError) console.warn('Gagal update status wishlist:', updateError)

      // Refresh wishlist untuk menampilkan status baru
      fetchWishlist()
      
      // Clear selection
      setSelectedItems(new Set())
      setShowConfirmModal(false)
      setShowRequestModal(false)
      
      alert("✅ Permintaan produk berhasil dikirim! Tim kami akan segera memverifikasi.")

      // Refresh requests list
      fetchProductRequests(session.user.id)

    } catch (err: any) {
      console.error("Failed to submit request:", err)
      alert("❌ Gagal mengirim permintaan: " + err.message)
    } finally {
      setSubmittingRequest(false)
    }
  }

  const fetchProductRequests = async (userId: string) => {
    try {
      setFetchingRequests(true)
      
      // Fetch requests with items
      const { data: requests, error } = await supabase
        .from('product_requests')
        .select(`
          *,
          items:request_items (
            id,
            product_id,
            product_name,
            product_image_url,
            unit_price,
            quantity,
            subtotal,
            status,
            admin_notes,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProductRequests(requests || [])
    } catch (err: any) {
      console.error("Failed to fetch requests:", err)
    } finally {
      setFetchingRequests(false)
    }
  }

  const getCompletionPercentage = () => {
    if (!profile) return 0
    const fields = [
      profile.full_name,
      profile.company_name,
      profile.company_type,
      profile.tax_id,
      profile.company_address,
      profile.phone_number
    ]
    const filled = fields.filter(f => f && f.trim() !== '').length
    return Math.round((filled / fields.length) * 100)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
        <span className="ml-2">Memuat Dashboard...</span>
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

  const completionPercentage = getCompletionPercentage()
  const selectedTotal = getSelectedItemsTotal()
  const selectedCount = getSelectedItemsCount()
  const totalQuantity = getTotalQuantity()

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
          {/* ... header content ... */}
        </div>
        {/* ✅ TAMBAHKAN TOMBOL KE KATALOG */}
        <div className="flex items-center gap-2">
          <Link href="/catalog">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <ExternalLink className="h-4 w-4 mr-2" />
              Ke Katalog
            </Button>
          </Link>
          <Badge variant="outline" className={`px-4 py-2 ${
            completionPercentage === 100 
              ? 'text-green-400 border-green-400 bg-green-900/20' 
              : 'text-orange-400 border-orange-400 bg-orange-900/20'
          }`}>
            {completionPercentage === 100 ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Profil Lengkap
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 mr-2" />
                Profil {completionPercentage}% Lengkap
              </>
            )}
          </Badge>
        </div>
      </div>
      {/* PROFILE COMPLETION ALERT */}
      {completionPercentage < 100 && (
        <Card className="bg-orange-900/20 border-orange-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-orange-400" />
              <div>
                <p className="text-orange-400 font-medium">
                  Lengkapi profil perusahaan Anda untuk mengikuti lelang
                </p>
                <p className="text-orange-300/70 text-sm">
                  Profil yang lengkap meningkatkan kepercayaan seller dan akses ke lelang eksklusif.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TABS */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-900 border border-slate-800">
          <TabsTrigger value="profile" className="data-[state=active]:bg-green-600">
            <Building2 className="h-4 w-4 mr-2" />
            Profil Perusahaan
          </TabsTrigger>
          <TabsTrigger 
            value="auctions" 
            className="data-[state=active]:bg-green-600"
            onClick={(e) => {
              if (!checkProfileCompletion()) {
                e.preventDefault()
              }
            }}
          >
            <Gavel className="h-4 w-4 mr-2" />
            Riwayat Lelang
          </TabsTrigger>
          <TabsTrigger 
            value="bids" 
            className="data-[state=active]:bg-green-600"
            onClick={(e) => {
              if (!checkProfileCompletion()) {
                e.preventDefault()
              }
            }}
          >
            <History className="h-4 w-4 mr-2" />
            Riwayat Bid
          </TabsTrigger>
          <TabsTrigger 
            value="requests" 
            className="data-[state=active]:bg-green-600"
            onClick={(e) => {
              if (!checkProfileCompletion()) {
                e.preventDefault()
              }
            }}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Permintaan Produk
          </TabsTrigger>
        </TabsList>

        {/* ✅ TAMBAHKAN DIALOG ALERT INI (sebelum closing </div> terakhir) */}
        <Dialog open={showProfileAlert} onOpenChange={setShowProfileAlert}>
          <DialogContent className="bg-slate-900 border-red-700 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-400">
                <AlertCircle className="h-5 w-5" />
                Profil Belum Lengkap
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Lengkapilah profil terlebih dahulu sebelum mengakses fitur!
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                onClick={() => {
                  setShowProfileAlert(false)
                  setActiveTab('profile')
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Isi Profil Sekarang
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* TAB 1: PROFIL PERUSAHAAN */}
        <TabsContent value="profile" className="space-y-4 mt-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-green-400" />
                  Informasi Perusahaan
                </div>
                {!isEditing ? (
                  <Button
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit Profil
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleCancelEdit}
                      variant="outline"
                      className="border-slate-600"
                      disabled={saving}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Batal
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveProfile}
                      className="bg-green-600 hover:bg-green-700"
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Menyimpan...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Simpan
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardTitle>
              <CardDescription className="text-slate-400">
                Lengkapi informasi perusahaan untuk verifikasi dan partisipasi lelang B2B.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nama Lengkap */}
                <div>
                  <label className="text-sm text-slate-400 mb-1 block flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Nama Lengkap
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                      className="w-full bg-slate-800 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-green-500"
                      placeholder="John Doe"
                    />
                  ) : (
                    <p className="text-white bg-slate-800/50 rounded px-4 py-2">
                      {profile?.full_name || '-'}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="text-sm text-slate-400 mb-1 block flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </label>
                  <p className="text-white bg-slate-800/50 rounded px-4 py-2">
                    {profile?.email || '-'}
                  </p>
                </div>

                {/* Nama Perusahaan */}
                <div>
                  <label className="text-sm text-slate-400 mb-1 block flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Nama Perusahaan
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.company_name}
                      onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                      className="w-full bg-slate-800 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-green-500"
                      placeholder="PT. Sonus Nusantara"
                    />
                  ) : (
                    <p className="text-white bg-slate-800/50 rounded px-4 py-2">
                      {profile?.company_name || '-'}
                    </p>
                  )}
                </div>

                {/* Tipe Perusahaan */}
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Tipe Perusahaan</label>
                  {isEditing ? (
                    <select
                      value={formData.company_type}
                      onChange={(e) => setFormData({...formData, company_type: e.target.value})}
                      className="w-full bg-slate-800 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-green-500"
                    >
                      <option value="">Pilih Tipe</option>
                      <option value="pt">PT (Perseroan Terbatas)</option>
                      <option value="cv">CV (Commanditaire Vennootschap)</option>
                      <option value="ud">UD (Usaha Dagang)</option>
                      <option value="koperasi">Koperasi</option>
                      <option value="perseorangan">Perseorangan</option>
                      <option value="lainnya">Lainnya</option>
                    </select>
                  ) : (
                    <p className="text-white bg-slate-800/50 rounded px-4 py-2">
                      {profile?.company_type || '-'}
                    </p>
                  )}
                </div>

                {/* NPWP / Tax ID */}
                <div>
                  <label className="text-sm text-slate-400 mb-1 block flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    NPWP / Tax ID
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.tax_id}
                      onChange={(e) => setFormData({...formData, tax_id: e.target.value})}
                      className="w-full bg-slate-800 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-green-500"
                      placeholder="00.000.000.0-000.000"
                    />
                  ) : (
                    <p className="text-white bg-slate-800/50 rounded px-4 py-2">
                      {profile?.tax_id || '-'}
                    </p>
                  )}
                </div>

                {/* Nomor Telepon */}
                <div>
                  <label className="text-sm text-slate-400 mb-1 block flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Nomor Telepon
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={formData.phone_number}
                      onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                      className="w-full bg-slate-800 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-green-500"
                      placeholder="+62 812 3456 7890"
                    />
                  ) : (
                    <p className="text-white bg-slate-800/50 rounded px-4 py-2">
                      {profile?.phone_number || '-'}
                    </p>
                  )}
                </div>
              </div>

              {/* Alamat Perusahaan */}
              <div>
                <label className="text-sm text-slate-400 mb-1 block flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Alamat Perusahaan
                </label>
                {isEditing ? (
                  <textarea
                    value={formData.company_address}
                    onChange={(e) => setFormData({...formData, company_address: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-green-500 min-h-[100px]"
                    placeholder="Jl. Contoh No. 123, Jakarta, Indonesia"
                  />
                ) : (
                  <p className="text-white bg-slate-800/50 rounded px-4 py-2">
                    {profile?.company_address || '-'}
                  </p>
                )}
              </div>

              {/* Member Since */}
              <div className="pt-4 border-t border-slate-700">
                <label className="text-sm text-slate-400 mb-1 block flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Bergabung Sejak
                </label>
                <p className="text-white bg-slate-800/50 rounded px-4 py-2">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : '-'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: RIWAYAT LELANG */}
        <TabsContent value="auctions" className="space-y-4 mt-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Gavel className="h-5 w-5 text-purple-400" />
                Partisipasi Lelang
              </CardTitle>
              <CardDescription className="text-slate-400">
                Daftar lelang yang Anda ikuti atau menangkan.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-slate-500">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium">Belum ada partisipasi lelang.</p>
                <p className="text-sm mt-2">
                  Ikuti lelang yang tersedia untuk melihat riwayat partisipasi Anda di sini.
                </p>
                <Link href="/auction">
                  <Button className="mt-4 bg-green-600 hover:bg-green-700">
                    <Gavel className="h-4 w-4 mr-2" />
                    Lihat Lelang Tersedia
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: RIWAYAT BID */}
        <TabsContent value="bids" className="space-y-4 mt-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <History className="h-5 w-5 text-blue-400" />
                Riwayat Penawaran
              </CardTitle>
              <CardDescription className="text-slate-400">
                Semua penawaran yang pernah Anda ajukan.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-slate-500">
                <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium">Belum ada riwayat penawaran.</p>
                <p className="text-sm mt-2">
                  Ajukan penawaran pada lelang yang tersedia untuk melihat riwayat bid Anda di sini.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: PERMINTAAN PRODUK (RFQ) - FIXED TO SHOW WISHLIST */}
        <TabsContent value="requests" className="space-y-4 mt-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-orange-400" />
                  Permintaan Produk (RFQ)
                </div>
                <Button 
                  size="sm" 
                  onClick={submitRequest}
                  className="bg-orange-600 hover:bg-orange-700"
                  disabled={wishlist.length === 0 || submittingRequest}
                >
                  {submittingRequest ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Kirim Permintaan ({wishlist.length} Item)
                    </>
                  )}
                </Button>
              </CardTitle>
              <CardDescription className="text-slate-400">
                Review produk di wishlist Anda sebelum mengajukan permintaan ke tim kami.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {wishlist.length === 0 ? (
                // EMPTY STATE - WISHLIST KOSONG
                <div className="text-center py-12 text-slate-500">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium">Belum ada produk di wishlist.</p>
                  <p className="text-sm mt-2">
                    Tambahkan produk dari katalog untuk membuat permintaan.
                  </p>
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                    <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                      <FileText className="h-6 w-6 text-orange-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-300">1. Pilih Produk</p>
                      <p className="text-xs text-slate-500 mt-1">Dari katalog kami</p>
                    </div>
                    <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                      <ShoppingCart className="h-6 w-6 text-green-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-300">2. Masukkan Wishlist</p>
                      <p className="text-xs text-slate-500 mt-1">Klik "Request Item"</p>
                    </div>
                    <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                      <CheckCircle className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-300">3. Kirim Permintaan</p>
                      <p className="text-xs text-slate-500 mt-1">Tim kami akan verifikasi</p>
                    </div>
                  </div>
                  <Link href="/catalog" className="mt-6 inline-block">
                    <Button className="bg-green-600 hover:bg-green-700">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Buka Katalog Produk
                    </Button>
                  </Link>
                </div>
              ) : (
                // WISHLIST ITEMS TABLE
                <div className="space-y-4">
                  {/* Table Header with Select All */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-800 text-slate-300">
                        <tr>
                          <th className="px-4 py-3 w-12">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={selectAllItems}
                              className="h-8 w-8 p-0 hover:bg-slate-700"
                            >
                              {selectedItems.size === wishlist.length ? (
                                <CheckCircle className="h-4 w-4 text-green-400" />
                              ) : (
                                <div className="h-4 w-4 border-2 border-slate-500 rounded" />
                              )}
                            </Button>
                          </th>
                          <th className="px-4 py-3 w-16">Gambar</th>
                          <th className="px-4 py-3">Nama Produk</th>
                          <th className="px-4 py-3 text-right">Harga Satuan</th>
                          <th className="px-4 py-3 text-center">Jumlah</th>
                          <th className="px-4 py-3 text-right">Subtotal</th>
                          <th className="px-4 py-3 text-center">Status</th>
                          <th className="px-4 py-3 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {wishlist.map((item) => (
                          <tr key={item.product_id} className="hover:bg-slate-800/30">
                            {/* 1. Checkbox */}
                            <td className="px-4 py-3">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleItemSelection(item.product_id)}
                                className="h-8 w-8 p-0 hover:bg-slate-700"
                              >
                                {selectedItems.has(item.product_id) ? (
                                  <CheckCircle className="h-4 w-4 text-green-400" />
                                ) : (
                                  <div className="h-4 w-4 border-2 border-slate-500 rounded" />
                                )}
                              </Button>
                            </td>

                            {/* 2. Gambar */}
                            <td className="px-4 py-3">
                              {item.product_image_url ? (
                                <img 
                                  src={item.product_image_url} 
                                  alt={item.product_name}
                                  className="w-12 h-12 object-cover rounded-lg border border-slate-600"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center border border-slate-600">
                                  <ImageIcon className="h-5 w-5 text-slate-500" />
                                </div>
                              )}
                            </td>

                            {/* 3. Nama Produk */}
                            <td className="px-4 py-3 text-white font-medium">
                              {item.product_name}
                            </td>

                            {/* 4. Harga Satuan */}
                            <td className="px-4 py-3 text-right text-slate-300 font-mono">
                              {formatPrice(item.price)}
                            </td>

                            {/* 5. Jumlah */}
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-2">
                                {/* ✅ DISABLE BUTTON JIKA STATUS BUKAN WISHLIST */}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateQuantity(item.product_id, -1)}
                                  disabled={(item as any).status !== 'wishlist'}
                                  className={`h-8 w-8 p-0 border-slate-600 ${
                                    (item as any).status !== 'wishlist' 
                                      ? 'opacity-50 cursor-not-allowed' 
                                      : 'hover:bg-slate-700'
                                  }`}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="text-white font-mono w-12 text-center">
                                  {item.quantity}
                                </span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateQuantity(item.product_id, 1)}
                                  disabled={(item as any).status !== 'wishlist'}
                                  className={`h-8 w-8 p-0 border-slate-600 ${
                                    (item as any).status !== 'wishlist' 
                                      ? 'opacity-50 cursor-not-allowed' 
                                      : 'hover:bg-slate-700'
                                  }`}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              {/* ✅ TAMPILKAN PESAN JIKA STATUS BUKAN WISHLIST */}
                              {(item as any).status !== 'wishlist' && (
                                <p className="text-xs text-amber-400 text-center mt-1">
                                  ⚠️ Menunggu review admin
                                </p>
                              )}
                            </td>

                            {/* 6. Subtotal */}
                            <td className="px-4 py-3 text-right text-orange-400 font-bold font-mono">
                              {formatPrice(item.price * item.quantity)}
                            </td>

                            {/* 7. STATUS BADGE (INI YANG KURANG!) */}
                            <td className="px-4 py-3 text-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusClick(item as any)}
                                className={`h-8 px-3 border-slate-600 ${getStatusBadgeColor((item as any).status || 'wishlist')}`}
                              >
                                {getStatusBadgeText((item as any).status || 'wishlist')}
                              </Button>
                            </td>

                            {/* 8. Aksi (Delete Button) */}
                            <td className="px-4 py-3 text-center">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => removeItem(item.product_id)}
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary Footer */}
                  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                    <div className="flex justify-between items-center flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                        <div>
                          <span className="text-slate-400 text-sm">Item Dipilih:</span>
                          <p className="text-white font-bold text-lg">{selectedCount} dari {wishlist.length} produk</p>
                        </div>
                        <div>
                          <span className="text-slate-400 text-sm">Total Quantity:</span>
                          <p className="text-white font-bold text-lg">{totalQuantity} unit</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 text-sm">Estimasi Harga Total:</span>
                        <p className="text-orange-400 font-bold text-2xl">{formatPrice(selectedTotal)}</p>
                      </div>
                    </div>
                    {selectedCount === 0 && wishlist.length > 0 && (
                      <p className="text-orange-400 text-sm mt-2 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Pilih minimal 1 item untuk mengirim permintaan
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* RIWAYAT PERMINTAAN YANG SUDAH DISUBMIT */}
          {productRequests.length > 0 && (
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <History className="h-5 w-5 text-blue-400" />
                  Riwayat Permintaan
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Daftar permintaan yang sudah dikirim ke tim kami.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {productRequests.map((request) => (
                    <div key={request.id} className="border border-slate-700 rounded-lg overflow-hidden">
                      <div className="bg-slate-800/50 p-4 flex items-center justify-between border-b border-slate-700">
                        <div>
                          <p className="text-white font-bold">{request.request_number || `RFQ-${request.id.slice(0, 8)}`}</p>
                          <p className="text-slate-400 text-sm">
                            {new Date(request.created_at).toLocaleDateString('id-ID', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-slate-400 text-xs">Total Item</p>
                            <p className="text-white font-mono">{request.total_items} produk</p>
                          </div>
                          <div className="text-right">
                            <p className="text-slate-400 text-xs">Estimasi Total</p>
                            <p className="text-orange-400 font-bold">{formatPrice(request.estimated_total)}</p>
                          </div>
                          <Badge className={`${getStatusBadgeColor(request.status)} text-white px-4 py-2`}>
                            {getStatusBadgeText(request.status)}
                          </Badge>
                        </div>
                      </div>
                      {request.items && request.items.length > 0 && (
                        <div className="p-4 space-y-2">
                          {request.items.slice(0, 3).map((item) => (
                            <div key={item.id} className="flex items-center justify-between text-sm">
                              <span className="text-white">{item.product_name}</span>
                              <span className="text-slate-400">×{item.quantity}</span>
                              <Badge className={`${getStatusBadgeColor(item.status)} text-xs`}>
                                {getStatusBadgeText(item.status)}
                              </Badge>
                            </div>
                          ))}
                          {request.items.length > 3 && (
                            <p className="text-slate-500 text-xs text-center">
                              +{request.items.length - 3} produk lainnya
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* MODAL WISHLIST & REQUEST - UPDATED WITH CHECKBOX TABLE */}
      <Dialog open={showRequestModal} onOpenChange={setShowRequestModal}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-orange-400" />
              Buat Permintaan Produk
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Pilih produk dari wishlist Anda dan ajukan permintaan.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 flex-1 overflow-y-auto">
            {wishlist.length === 0 ? (
              // EMPTY STATE - WISHLIST KOSONG
              <div className="text-center py-12">
                <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-slate-600" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  Belum ada wishlist?
                </h3>
                <p className="text-slate-400 mb-6">
                  Yuk pilih produk dari katalog kami dan tambahkan ke wishlist!
                </p>
                <div className="flex gap-3 justify-center">
                  <Link href="/catalog">
                    <Button className="bg-green-600 hover:bg-green-700">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Buka Katalog Produk
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              // WISHLIST ITEMS TABLE WITH CHECKBOXES
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-800 text-slate-300 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 w-12">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={selectAllItems}
                          className="h-8 w-8 p-0 hover:bg-slate-700"
                        >
                          {selectedItems.size === wishlist.length ? (
                            <CheckCircle className="h-4 w-4 text-green-400" />
                          ) : (
                            <div className="h-4 w-4 border-2 border-slate-500 rounded" />
                          )}
                        </Button>
                      </th>
                      <th className="px-4 py-3 w-16">Gambar</th>
                      <th className="px-4 py-3">Nama Produk</th>
                      <th className="px-4 py-3 text-right">Harga Satuan</th>
                      <th className="px-4 py-3 text-center">Jumlah</th>
                      <th className="px-4 py-3 text-right">Subtotal</th>
                      <th className="px-4 py-3 text-center">Status</th> 
                      <th className="px-4 py-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  {/* GANTI SELURUH <tbody> DI DALAM DIALOG showRequestModal DENGAN INI */}
                  <tbody className="divide-y divide-slate-800">
                    {wishlist.map((item) => (
                      <tr key={item.product_id} className="hover:bg-slate-800/30">
                        {/* 1. Checkbox */}
                        <td className="px-4 py-3">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleItemSelection(item.product_id)}
                            className="h-8 w-8 p-0 hover:bg-slate-700"
                          >
                            {selectedItems.has(item.product_id) ? (
                              <CheckCircle className="h-4 w-4 text-green-400" />
                            ) : (
                              <div className="h-4 w-4 border-2 border-slate-500 rounded" />
                            )}
                          </Button>
                        </td>

                        {/* 2. Gambar */}
                        <td className="px-4 py-3">
                          {item.product_image_url ? (
                            <img 
                              src={item.product_image_url} 
                              alt={item.product_name}
                              className="w-12 h-12 object-cover rounded-lg border border-slate-600"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center border border-slate-600">
                              <ImageIcon className="h-5 w-5 text-slate-500" />
                            </div>
                          )}
                        </td>

                        {/* 3. Nama Produk */}
                        <td className="px-4 py-3 text-white font-medium">
                          {item.product_name}
                        </td>

                        {/* 4. Harga Satuan */}
                        <td className="px-4 py-3 text-right text-slate-300 font-mono">
                          {formatPrice(item.price)}
                        </td>

                        {/* 5. Jumlah */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.product_id, -1)}
                              className="h-8 w-8 p-0 border-slate-600"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-white font-mono w-12 text-center">
                              {item.quantity}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.product_id, 1)}
                              className="h-8 w-8 p-0 border-slate-600"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>

                        {/* 6. Subtotal */}
                        <td className="px-4 py-3 text-right text-orange-400 font-bold font-mono">
                          {formatPrice(item.price * item.quantity)}
                        </td>

                        {/* 7. Status Badge (PINDAHKAN KE SINI) */}
                        {/* 7. STATUS BADGE (MODERN STYLE) */}
                        <td className="px-4 py-3 text-center">
                          <Button
                            size="sm"
                            variant="ghost" // Ganti variant jadi ghost agar lebih clean
                            onClick={() => handleStatusClick(item as any)}
                            className={`h-8 px-3 gap-2 font-medium ${getStatusBadgeColor((item as any).status || 'wishlist')}`}
                          >
                            {/* Render Icon Dinamis */}
                            {(() => {
                              const statusInfo = getStatusMessage((item as any).status || 'wishlist');
                              const IconComponent = statusInfo.icon;
                              return <IconComponent className="h-4 w-4" />;
                            })()}
                            
                            {getStatusBadgeText((item as any).status || 'wishlist')}
                          </Button>
                        </td>

                        {/* 8. Aksi (Delete Button) */}
                        <td className="px-4 py-3 text-center">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removeItem(item.product_id)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {wishlist.length > 0 && (
            <div className="border-t border-slate-700 pt-4 flex-shrink-0">
              {/* SELECTED ITEMS INFO & TOTAL ESTIMATE */}
              <div className="mb-4 bg-slate-800/50 rounded-lg p-4">
                <div className="flex justify-between items-center flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-slate-400 text-sm">Item Dipilih:</span>
                      <p className="text-white font-bold text-lg">{selectedCount} dari {wishlist.length} produk</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-sm">Total Quantity:</span>
                      <p className="text-white font-bold text-lg">{totalQuantity} unit</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-sm">Estimasi Harga Total:</span>
                    <p className="text-orange-400 font-bold text-2xl">{formatPrice(selectedTotal)}</p>
                  </div>
                </div>
                {selectedCount === 0 && (
                  <p className="text-orange-400 text-sm mt-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Pilih minimal 1 item untuk melanjutkan
                  </p>
                )}
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowRequestModal(false)}
                  className="border-slate-600"
                  disabled={submittingRequest}
                >
                  Batal
                </Button>
                <div className="flex gap-2">
                  <Link href="/catalog">
                    <Button
                      variant="outline"
                      className="border-green-600 text-green-400"
                      disabled={submittingRequest}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Tambah Produk
                    </Button>
                  </Link>
                  <Button
                    onClick={submitRequest}
                    className="bg-orange-600 hover:bg-orange-700"
                    disabled={submittingRequest || selectedCount === 0}
                  >
                    {submittingRequest ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Lanjut ke Konfirmasi ({selectedCount} Item)
                      </>
                    )}
                  </Button>
                </div>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL KONFIRMASI SEBELUM KIRIM */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-400">
              <CheckCircle className="h-6 w-6" />
              Konfirmasi Permintaan
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Review kembali permintaan Anda sebelum dikirim ke tim kami.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <p className="text-slate-400 text-sm">Total Produk</p>
                <p className="text-white font-bold text-2xl">{selectedCount}</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <p className="text-slate-400 text-sm">Total Quantity</p>
                <p className="text-white font-bold text-2xl">{totalQuantity}</p>
              </div>
            </div>

            {/* Selected Items List */}
            <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700 max-h-60 overflow-y-auto">
              <p className="text-slate-400 text-sm mb-3 font-medium">Produk yang Dipilih:</p>
              <div className="space-y-2">
                {wishlist
                  .filter(item => selectedItems.has(item.product_id))
                  .map((item) => (
                    <div key={item.product_id} className="flex justify-between items-center text-sm">
                      <span className="text-white truncate flex-1">{item.product_name}</span>
                      <span className="text-slate-400 mx-2">×{item.quantity}</span>
                      <span className="text-orange-400 font-mono">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Total Estimate */}
            <div className="bg-orange-900/20 rounded-lg p-4 border border-orange-700">
              <div className="flex justify-between items-center">
                <span className="text-orange-300 font-medium">Estimasi Total Harga:</span>
                <span className="text-orange-400 font-bold text-2xl">{formatPrice(selectedTotal)}</span>
              </div>
              <p className="text-orange-300/60 text-xs mt-2">
                *Harga dapat berubah sesuai penawaran dari supplier
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowConfirmModal(false)}
              className="border-slate-600"
              disabled={submittingRequest}
            >
              Batal
            </Button>
            <Button
              onClick={confirmSubmitRequest}
              className="bg-orange-600 hover:bg-orange-700"
              disabled={submittingRequest}
            >
              {submittingRequest ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Kirim Permintaan
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-3 text-lg ${
              selectedStatusItem ? getStatusMessage((selectedStatusItem as any).status || 'wishlist').color : 'text-slate-400'
            }`}>
              {/* Icon Besar di Header */}
              {selectedStatusItem && (() => {
                const IconComp = getStatusMessage((selectedStatusItem as any).status || 'wishlist').icon;
                return <IconComp className="h-6 w-6" />;
              })()}
              
              {selectedStatusItem && getStatusMessage((selectedStatusItem as any).status || 'wishlist').title}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            {selectedStatusItem && (
              <>
                {/* Info Produk */}
                <div className="bg-slate-800/50 rounded-lg p-4 mb-4 border border-slate-700 flex gap-4">
                  {/* ... (kode gambar produk tetap sama) ... */}
                  <div className="flex-1">
                      <p className="text-white font-medium">{selectedStatusItem.product_name}</p>
                      <p className="text-slate-400 text-sm">Qty: {selectedStatusItem.quantity}</p>
                      <p className="text-orange-400 font-bold">{formatPrice((selectedStatusItem as any).price)}</p>
                  </div>
                </div>

                {/* Pesan Status dengan Background Baru */}
                <div className={`rounded-lg p-4 border ${
                  getStatusMessage((selectedStatusItem as any).status || 'wishlist').bgColor
                } ${
                  getStatusMessage((selectedStatusItem as any).status || 'wishlist').borderColor
                }`}>
                  <p className={`text-sm leading-relaxed ${
                    getStatusMessage((selectedStatusItem as any).status || 'wishlist').color
                  }`}>
                    {getStatusMessage((selectedStatusItem as any).status || 'wishlist', (selectedStatusItem as any).admin_notes).message}
                  </p>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setShowStatusModal(false)} className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-600">
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}