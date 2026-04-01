'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Package, ArrowLeft, AlertCircle, Loader2, Edit2, X, Check, Gavel, 
  MessageSquare, Clock, DollarSign, TrendingUp, FileText, Timer, Eye, 
  EyeOff, Image as ImageIcon, Upload, Trash2, Save, Search, Bookmark, 
  CheckCircle2, XCircle, Hourglass, CreditCard, FileCheck
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'

interface Product {
  id: string
  nama_produk: string | null
  harga: number | null
  sku: string | null
  created_at: string
  is_auction: boolean
  is_request: boolean
  auction_start_price: number | null
  auction_increment: number | null
  auction_end_time: string | null
  auction_duration_days: number | null
  bid_deadline_duration: number | null
  bid_deadline_time: string | null
  auction_active: boolean
  auction_description: string | null
  auction_gallery_urls: string[] | null
  current_bid_price: number | null
  current_bidder_id: string | null
}

interface GroupedWishlistItem {
  wishlist_id: number
  user_id: string
  user_name: string
  company_name: string
  product_sku: string
  total_quantity: number
  total_price: number
  status: string
  created_at: string
  items: any[] // Array of individual items
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
  
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedTerm, setDebouncedTerm] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  // ✅ UPDATED: Include 'wishlist' in filterView
  const [filterView, setFilterView] = useState<'all' | 'auction' | 'request' | 'wishlist'>('all')
  
  const [showEditPriceModal, setShowEditPriceModal] = useState(false)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [editingPrice, setEditingPrice] = useState('')
  const [priceSaving, setPriceSaving] = useState(false)
  
  const [showAuctionModal, setShowAuctionModal] = useState(false)
  const [isEditingAuction, setIsEditingAuction] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [auctionConfig, setAuctionConfig] = useState({
    startPrice: '',
    increment: '',
    durationDays: '14',
    bidDeadlineDays: '3',
    description: ''
  })
  const [auctionLoading, setAuctionLoading] = useState(false)
  
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [existingGalleryUrls, setExistingGalleryUrls] = useState<string[]>([])
  
  const [showBidDeadline, setShowBidDeadline] = useState<Record<string, boolean>>({})
  
  // ✅ WISHLIST ANALYTICS STATE
  const [wishlistItems, setWishlistItems] = useState<GroupedWishlistItem[]>([])
  const [wishlistTotal, setWishlistTotal] = useState(0)
  const [wishlistLoading, setWishlistLoading] = useState(false)
  const [wishlistFilter, setWishlistFilter] = useState<'all' | 'deal' | 'pending' | 'requested' | 'wishlist' | 'decline'>('all')
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [selectedWishlistItem, setSelectedWishlistItem] = useState<any>(null)
  const [adminNote, setAdminNote] = useState('')
  const [noteSaving, setNoteSaving] = useState(false)

  const STATUS_PRIORITY: Record<string, number> = {
    'deal': 1,
    'pending': 2,
    'requested': 3,
    'wishlist': 4,
    'decline': 5
  }

  const fetchWishlistItems = useCallback(async () => {
    try {
      setWishlistLoading(true)
      
      // 1. Fetch wishlist dengan wishlist_id
      let query = supabase
        .from('wishlists')
        .select('*', { count: 'exact' })
        .order('wishlist_id', { ascending: false })
      
      if (wishlistFilter !== 'all') {
        query = query.eq('status', wishlistFilter)
      }
      
      const { data: wishlistData, error: wishlistError, count } = await query
      
      if (wishlistError) throw wishlistError
      if (!wishlistData || wishlistData.length === 0) {
        setWishlistItems([])
        setWishlistTotal(count || 0)
        return
      }
      
      // 2. Fetch profiles user
      const userIds = [...new Set(wishlistData.map(w => w.user_id))]
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, company_name, email')
        .in('id', userIds)
      
      // 3. Fetch products (include SKU!)
      const productIds = [...new Set(wishlistData.map(w => w.product_id))]
      const { data: productsData } = await supabase
        .from('products')
        .select('id, nama_produk, harga, gambar_url, sku')
        .in('id', productIds)
      
      // 4. GROUP BY USER + PRODUCT
      const groupedMap = new Map<string, GroupedWishlistItem>()
      
      wishlistData.forEach(item => {
        const profile = profilesData?.find(p => p.id === item.user_id)
        const product = productsData?.find(p => p.id.toString() === item.product_id.toString())
        
        // Create unique key: user_id + product_id
        const groupKey = `${item.user_id}-${item.product_id}`
        
        if (!groupedMap.has(groupKey)) {
          groupedMap.set(groupKey, {
            wishlist_id: item.wishlist_id || 0,
            user_id: item.user_id,
            user_name: profile?.full_name || 'Anonymous',
            company_name: profile?.company_name || '-',
            product_sku: product?.sku || `SKU-${item.product_id}`,
            total_quantity: item.quantity,
            total_price: (product?.harga || item.price || 0) * item.quantity,
            status: item.status,
            created_at: item.created_at,
            items: [item]
          })
        } else {
          // Update existing group
          const group = groupedMap.get(groupKey)!
          group.total_quantity += item.quantity
          group.total_price += (product?.harga || item.price || 0) * item.quantity
          group.items.push(item)
          
          // Use earliest wishlist_id
          if (item.wishlist_id && item.wishlist_id < group.wishlist_id) {
            group.wishlist_id = item.wishlist_id
          }
        }
      })
      
      // 5. Convert to array & sort
      const groupedData = Array.from(groupedMap.values())
      const sortedData = groupedData.sort((a, b) => {
        return (STATUS_PRIORITY[a.status] || 99) - (STATUS_PRIORITY[b.status] || 99)
      })
      
      setWishlistItems(sortedData)
      setWishlistTotal(count || 0)
    } catch (err: any) {
      console.error("Failed to fetch wishlist:", err)
    } finally {
      setWishlistLoading(false)
    }
  }, [wishlistFilter])

  useEffect(() => {
    if (isAuthorized) {
      fetchWishlistItems()
    }
  }, [isAuthorized, wishlistFilter])

  const openNoteModal = (item: any) => {
    setSelectedWishlistItem(item)
    setAdminNote(item.admin_notes || '')
    setShowNoteModal(true)
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'deal':
        return { label: 'Deal', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CreditCard }
      case 'pending':
        return { label: 'Pending Payment', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: Hourglass }
      case 'requested':
        return { label: 'Requested', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: FileCheck }
      case 'wishlist':
        return { label: 'Wishlist', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20', icon: Bookmark }
      case 'decline':
        return { label: 'Declined', color: 'bg-red-500/10 text-red-400 border-red-500/20', icon: XCircle }
      default:
        return { label: status, color: 'bg-slate-500/10 text-slate-400 border-slate-500/20', icon: Clock }
    }
  }

  const handleSaveNote = async () => {
    if (!selectedWishlistItem) return
    
    try {
      setNoteSaving(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      const { error } = await supabase
        .from('wishlists')
        .update({
          admin_notes: adminNote,
          admin_id: session?.user.id,
          status_updated_at: new Date().toISOString()
        })
        .eq('id', selectedWishlistItem.id)
      
      if (error) throw error
      
      await fetchWishlistItems()
      setShowNoteModal(false)
      setSelectedWishlistItem(null)
      setAdminNote('')
      alert("✅ Note berhasil disimpan!")
    } catch (err: any) {
      alert("❌ Gagal menyimpan note: " + err.message)
    } finally {
      setNoteSaving(false)
    }
  }

  const updateWishlistStatus = async (itemId: string, action: 'accept' | 'decline' | 'mark_deal') => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      let finalStatus = ''
      let message = ''
  
      if (action === 'accept') {
        finalStatus = 'accepted' // User lihat "Accepted", Admin lihat "Menunggu Bayar"
        message = 'Accept'
      } else if (action === 'decline') {
        finalStatus = 'declined'
        message = 'Decline'
      } else if (action === 'mark_deal') {
        finalStatus = 'deal'
        message = 'Deal Closed'
      }
  
      if (!finalStatus) return
  
      const { error } = await supabase
        .from('wishlists')
        .update({
          status: finalStatus,
          admin_id: session?.user.id,
          status_updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
      
      if (error) throw error
      
      await fetchWishlistItems()
      alert(`✅ Item berhasil di-${message}!`)
    } catch (err: any) {
      alert("❌ Gagal update status: " + err.message)
    }
  }

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
        .order('created_at', { ascending: false })
      
      if (debouncedTerm) {
        query = query.ilike('nama_produk', `%${debouncedTerm}%`)
      }
      
      if (filterView === 'auction') {
        query = query.eq('is_auction', true)
      } else if (filterView === 'request') {
        query = query.eq('is_request', true)
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
  }, [currentPage, debouncedTerm, filterView])

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

  useEffect(() => {
    if (isAuthorized) {
      fetchProducts()
    }
  }, [isAuthorized, fetchProducts])

  const openEditPriceModal = (productId: string, currentPrice: number | null) => {
    setEditingProductId(productId)
    setEditingPrice((currentPrice || 0).toString())
    setShowEditPriceModal(true)
  }

  const handleSavePrice = async () => {
    if (!editingProductId) return
    
    const newPrice = parseInt(editingPrice)
    
    if (isNaN(newPrice) || newPrice <= 0) {
      alert("❌ Harga harus valid dan lebih dari 0!")
      return
    }
    
    try {
      setPriceSaving(true)
      
      const { error } = await supabase
        .from('products')
        .update({ harga: newPrice })
        .eq('id', editingProductId)
      
      if (error) throw error
      
      await fetchProducts()
      
      setShowEditPriceModal(false)
      setEditingProductId(null)
      setEditingPrice('')
      
      alert("✅ Harga produk berhasil diupdate di database!")
    } catch (err: any) {
      console.error("Failed to update price:", err)
      alert("❌ Gagal update harga: " + err.message)
    } finally {
      setPriceSaving(false)
    }
  }

  const [timeRemaining, setTimeRemaining] = useState<Record<string, { auction: string; bidDeadline: string }>>({})
  
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime()
      const newTimeRemaining: Record<string, { auction: string; bidDeadline: string }> = {}
      
      products.forEach(product => {
        const auctionEnd = product.auction_end_time ? new Date(product.auction_end_time).getTime() : 0
        const bidDeadline = product.bid_deadline_time ? new Date(product.bid_deadline_time).getTime() : 0
        
        const auctionDistance = auctionEnd - now
        if (auctionDistance > 0 && product.auction_active) {
          const days = Math.floor(auctionDistance / (1000 * 60 * 60 * 24))
          const hours = Math.floor((auctionDistance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
          const minutes = Math.floor((auctionDistance % (1000 * 60 * 60)) / (1000 * 60))
          const seconds = Math.floor((auctionDistance % (1000 * 60)) / 1000)
          newTimeRemaining[product.id] = {
            auction: `${days}h ${hours}j ${minutes}m ${seconds}d`,
            bidDeadline: ''
          }
        } else {
          newTimeRemaining[product.id] = { auction: 'SELESAI', bidDeadline: '' }
        }
        
        if (bidDeadline > 0 && product.auction_active && product.current_bid_price && product.current_bid_price > 0) {
          const bidDistance = bidDeadline - now
          if (bidDistance > 0) {
            const days = Math.floor(bidDistance / (1000 * 60 * 60 * 24))
            const hours = Math.floor((bidDistance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
            const minutes = Math.floor((bidDistance % (1000 * 60 * 60)) / (1000 * 60))
            const seconds = Math.floor((bidDistance % (1000 * 60)) / 1000)
            newTimeRemaining[product.id].bidDeadline = `${days}h ${hours}j ${minutes}m ${seconds}d`
          } else {
            newTimeRemaining[product.id].bidDeadline = 'DEADLINE'
          }
        }
      })
      
      setTimeRemaining(newTimeRemaining)
    }
    
    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [products])

  const toggleBidDeadlineVisibility = (productId: string) => {
    setShowBidDeadline(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }))
  }

  const openAuctionModal = (productId: string, isEdit = false) => {
    setSelectedProductId(productId)
    setIsEditingAuction(isEdit)
    const product = products.find(p => p.id === productId)
    if (product) {
      let remainingDays = 14
      if (product.auction_end_time && product.auction_active) {
        const now = new Date().getTime()
        const endTime = new Date(product.auction_end_time).getTime()
        const distance = endTime - now
        if (distance > 0) {
          remainingDays = Math.ceil(distance / (1000 * 60 * 60 * 24))
        }
      }
      setAuctionConfig({
        startPrice: (product.auction_start_price || product.harga || 0).toString(),
        increment: (product.auction_increment || 50000).toString(),
        durationDays: isEdit ? remainingDays.toString() : (product.auction_duration_days || 14).toString(),
        bidDeadlineDays: (product.bid_deadline_duration || 3).toString(),
        description: product.auction_description || ''
      })
      setExistingGalleryUrls(product.auction_gallery_urls || [])
      setImagePreviews([])
      setSelectedFiles([])
    }
    setShowAuctionModal(true)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    
    const totalImages = existingGalleryUrls.length + imagePreviews.length + files.length
    if (totalImages > 5) {
      alert(`❌ Maksimal 5 gambar! Kamu sudah punya ${existingGalleryUrls.length + imagePreviews.length} gambar, bisa tambah ${5 - (existingGalleryUrls.length + imagePreviews.length)} lagi.`)
      return
    }
    
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        alert('❌ Hanya file gambar yang diperbolehkan!')
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        alert('❌ Ukuran file maksimal 10MB per gambar!')
        return
      }
    }
    
    setSelectedFiles(prev => [...prev, ...files])
    
    files.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const uploadImages = async (): Promise<string[]> => {
    if (!selectedFiles.length || !selectedProductId) return existingGalleryUrls
    
    try {
      setUploadingImage(true)
      const uploadedUrls: string[] = [...existingGalleryUrls]
      
      for (const file of selectedFiles) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${selectedProductId}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${fileName}`
        
        const { data, error } = await supabase.storage
          .from('auction-images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
          })
        
        if (error) throw error
        
        const { data: urlData } = supabase.storage
          .from('auction-images')
          .getPublicUrl(filePath)
        
        uploadedUrls.push(urlData.publicUrl)
      }
      
      return uploadedUrls
    } catch (err: any) {
      console.error("Upload error:", err)
      alert('❌ Gagal upload gambar: ' + err.message)
      return existingGalleryUrls
    } finally {
      setUploadingImage(false)
    }
  }

  const removePreviewImage = (index: number) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const removeExistingImage = (index: number) => {
    setExistingGalleryUrls(prev => prev.filter((_, i) => i !== index))
  }

  const submitAuctionConfig = async () => {
    if (!selectedProductId) return
    
    const startPrice = parseInt(auctionConfig.startPrice)
    const increment = parseInt(auctionConfig.increment)
    const durationDays = parseInt(auctionConfig.durationDays)
    const bidDeadlineDays = parseInt(auctionConfig.bidDeadlineDays)
    
    if (isNaN(startPrice) || startPrice <= 0) {
      alert("❌ Harga awal lelang harus valid!")
      return
    }
    if (isNaN(increment) || increment <= 0) {
      alert("❌ Kelipatan bid harus valid!")
      return
    }
    if (isNaN(durationDays) || durationDays <= 0) {
      alert("❌ Durasi lelang harus valid!")
      return
    }
    if (isNaN(bidDeadlineDays) || bidDeadlineDays <= 0) {
      alert("❌ Durasi bid deadline harus valid!")
      return
    }
    if (bidDeadlineDays > durationDays) {
      alert("❌ Bid deadline tidak boleh lebih lama dari durasi lelang!")
      return
    }
    
    try {
      setAuctionLoading(true)
      
      const finalGalleryUrls = await uploadImages()
      
      const product = products.find(p => p.id === selectedProductId)
      const now = new Date()
      let newEndTime = product?.auction_end_time ? new Date(product.auction_end_time) : null
      let shouldUpdateEndTime = false
      
      if (isEditingAuction && product?.auction_end_time) {
        const remainingTime = new Date(product.auction_end_time).getTime() - now.getTime()
        const remainingDays = Math.floor(remainingTime / (1000 * 60 * 60 * 24))
        if (durationDays < remainingDays) {
          newEndTime = new Date()
          newEndTime.setDate(newEndTime.getDate() + durationDays)
          shouldUpdateEndTime = true
        } else {
          shouldUpdateEndTime = false
        }
      } else {
        newEndTime = new Date()
        newEndTime.setDate(newEndTime.getDate() + durationDays)
        shouldUpdateEndTime = true
      }
      
      const initialBidDeadline = new Date()
      initialBidDeadline.setDate(initialBidDeadline.getDate() + bidDeadlineDays)
      
      const updateData: any = {
        auction_start_price: startPrice,
        auction_increment: increment,
        auction_duration_days: durationDays,
        bid_deadline_duration: bidDeadlineDays,
        auction_description: auctionConfig.description,
        auction_gallery_urls: finalGalleryUrls
      }
      
      if (shouldUpdateEndTime && newEndTime) {
        updateData.auction_end_time = newEndTime.toISOString()
      }
      if (!isEditingAuction || shouldUpdateEndTime) {
        updateData.bid_deadline_time = initialBidDeadline.toISOString()
      }
      
      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', selectedProductId)
      
      if (error) throw error
      
      setProducts(products.map(p =>
        p.id === selectedProductId ? {
          ...p,
          auction_start_price: startPrice,
          auction_increment: increment,
          auction_duration_days: durationDays,
          bid_deadline_duration: bidDeadlineDays,
          auction_description: auctionConfig.description,
          auction_gallery_urls: finalGalleryUrls,
          auction_end_time: shouldUpdateEndTime && newEndTime ? newEndTime.toISOString() : p.auction_end_time,
          bid_deadline_time: (!isEditingAuction || shouldUpdateEndTime) && initialBidDeadline ? initialBidDeadline.toISOString() : p.bid_deadline_time
        } : p
      ))
      
      setShowAuctionModal(false)
      setSelectedProductId(null)
      setIsEditingAuction(false)
      setSelectedFiles([])
      setImagePreviews([])
      setExistingGalleryUrls([])
      
      alert("✅ Lelang berhasil dijadwalkan!")
    } catch (err: any) {
      alert("❌ Gagal mengupdate lelang: " + err.message)
    } finally {
      setAuctionLoading(false)
    }
  }

  const toggleAuctionStatus = async (productId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus
    try {
      const { error } = await supabase
        .from('products')
        .update({
          is_auction: newStatus,
          auction_active: newStatus ? true : false
        })
        .eq('id', productId)
      
      if (error) throw error
      
      setProducts(products.map(p =>
        p.id === productId ? { ...p, is_auction: newStatus, auction_active: newStatus } : p
      ))
      
      if (newStatus) {
        alert(`⚡ Produk sekarang dalam mode LELANG!`)
      } else {
        alert(`✅ Produk sudah kembali ke status normal`)
      }
    } catch (err: any) {
      alert("❌ Gagal update status lelang: " + err.message)
    }
  }

  const simulateNewBid = async (productId: string, newBidPrice: number) => {
    const product = products.find(p => p.id === productId)
    if (!product) return
    
    try {
      const now = new Date()
      const auctionEnd = product.auction_end_time ? new Date(product.auction_end_time) : null
      const newBidDeadline = new Date()
      newBidDeadline.setDate(newBidDeadline.getDate() + (product.bid_deadline_duration || 3))
      
      let finalBidDeadline = newBidDeadline
      if (auctionEnd && newBidDeadline > auctionEnd) {
        finalBidDeadline = auctionEnd
      }
      
      const { error } = await supabase
        .from('products')
        .update({
          current_bid_price: newBidPrice,
          bid_deadline_time: finalBidDeadline.toISOString()
        })
        .eq('id', productId)
      
      if (error) throw error
      
      setProducts(products.map(p =>
        p.id === productId ? {
          ...p,
          current_bid_price: newBidPrice,
          bid_deadline_time: finalBidDeadline.toISOString()
        } : p
      ))
      
      alert(`✅ Bid baru diterima! Deadline direset ke ${product.bid_deadline_duration} hari`)
    } catch (err: any) {
      alert("❌ Gagal memproses bid: " + err.message)
    }
  }

  const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE + 1
  const endIndex = Math.min(currentPage * ITEMS_PER_PAGE, totalProducts)

  const getEmptyMessage = () => {
    if (debouncedTerm) return "Tidak ada produk yang sesuai dengan pencarian."
    if (filterView === 'auction') return "Belum ada produk yang sedang dilelang."
    if (filterView === 'wishlist') return "Belum ada data."
    if (filterView === 'request') return "Belum ada permintaan dari client."
    return "Belum ada produk."
  }

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

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
            <p className="text-slate-400 mt-1">Kelola harga, lelang, dan permintaan.</p>
          </div>
        </div>
        <Badge variant="outline" className="text-green-400 border-green-400 px-4 py-2 bg-green-900/20 hidden md:flex">
          ADMIN_MARKETING
        </Badge>
      </div>

      {/* SEARCH BAR & FILTERS */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="pt-6">
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Cari produk..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded pl-10 pr-4 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-green-500"
              />
            </div>
            {searchTerm && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('')
                  setDebouncedTerm('')
                  setCurrentPage(1)
                  searchInputRef.current?.focus()
                }} 
                className="border-slate-700"
              >
                Clear
              </Button>
            )}
          </div>
          
          {/* ✅ UPDATED FILTER BUTTONS - Include Wishlist Analytics */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <Button
              variant={filterView === 'all' ? 'default' : 'outline'}
              onClick={() => {
                setFilterView('all')
                setCurrentPage(1)
              }}
              className={filterView === 'all' ? 'bg-blue-600 hover:bg-blue-700' : 'border-slate-700'}
            >
              Semua Produk ({totalProducts})
            </Button>
            <Button
              variant={filterView === 'auction' ? 'default' : 'outline'}
              onClick={() => {
                setFilterView('auction')
                setCurrentPage(1)
              }}
              className={filterView === 'auction' ? 'bg-purple-600 hover:bg-purple-700' : 'border-slate-700'}
            >
              <Gavel className="h-4 w-4 mr-2" />
              Sedang Lelang
            </Button>
            <Button
              variant={filterView === 'wishlist' ? 'default' : 'outline'}
              onClick={() => {
                setFilterView('wishlist')
                setCurrentPage(1)
              }}
              className={filterView === 'wishlist' ? 'bg-blue-600 hover:bg-blue-700' : 'border-slate-700'}
            >
              <Bookmark className="h-4 w-4 mr-2" />
              Wishlist Analytics ({wishlistTotal})
            </Button>
            <Button
              variant={filterView === 'request' ? 'default' : 'outline'}
              onClick={() => {
                setFilterView('request')
                setCurrentPage(1)
              }}
              className={filterView === 'request' ? 'bg-orange-600 hover:bg-orange-700' : 'border-slate-700'}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Permintaan Client
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ✅ WISHLIST ANALYTICS TABLE - Shows when filterView === 'wishlist' */}
      {filterView === 'wishlist' && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Bookmark className="h-5 w-5 text-blue-400" />
                Wishlist Analytics
              </div>
              <div className="flex gap-2">
                <select
                  value={wishlistFilter}
                  onChange={(e) => setWishlistFilter(e.target.value as any)}
                  className="bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="all">Semua Status</option>
                  <option value="deal">Deal</option>
                  <option value="pending">Pending</option>
                  <option value="requested">Requested</option>
                  <option value="wishlist">Wishlist</option>
                  <option value="decline">Decline</option>
                </select>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {wishlistLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : wishlistItems.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Bookmark className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Belum ada data.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800 uppercase font-medium">
                  <tr>
                    <th className="px-4 py-3 text-center">ID</th>
                    <th className="px-4 py-3">Kode Produk</th>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3 text-center">Jumlah</th>
                    <th className="px-4 py-3 text-right">Harga Total</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {wishlistItems.map((item) => {
                    const statusConfig = getStatusConfig(item.status)
                    const StatusIcon = statusConfig.icon
                    
                    return (
                      <tr key={item.wishlist_id} className="hover:bg-slate-800/50">
                        {/* ID */}
                        <td className="px-4 py-3 text-center">
                          <Badge variant="outline" className="bg-slate-800 text-slate-300 font-mono">
                            #{item.wishlist_id}
                          </Badge>
                        </td>
                        
                        {/* Kode Produk */}
                        <td className="px-4 py-3 font-mono text-white">
                          {item.product_sku}
                        </td>
                        
                        {/* User */}
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-white font-medium">{item.user_name}</p>
                            <p className="text-xs text-slate-500">{item.company_name}</p>
                          </div>
                        </td>
                        
                        {/* Jumlah Total */}
                        <td className="px-4 py-3 text-center">
                          <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {item.total_quantity} Unit
                          </Badge>
                          {item.items.length > 1 && (
                            <p className="text-xs text-slate-500 mt-1">
                              ({item.items.length} item)
                            </p>
                          )}
                        </td>
                        
                        {/* Harga Total */}
                        <td className="px-4 py-3 text-right">
                          <span className="text-orange-400 font-mono font-bold">
                            {formatRupiah(item.total_price)}
                          </span>
                        </td>
                        
                        {/* Status */}
                        <td className="px-4 py-3">
                          <Badge className={`${statusConfig.color} border`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </td>
                        
                        {/* Aksi */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2 items-center">
                            {/* Expand Button (untuk lihat detail) */}
                            {item.items.length > 1 && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  // Show detail modal
                                  alert(`Detail: ${item.items.length} items dari ${item.user_name}`)
                                }}
                                className="text-xs border-slate-600"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Detail
                              </Button>
                            )}
                            
                            {/* Accept/Decline Buttons */}
                            {(item.status === 'requested' || item.status === 'pending_review') && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => updateWishlistStatus(item.items[0].id, 'accept')}
                                  className="text-xs bg-emerald-600 hover:bg-emerald-700 border border-emerald-500"
                                >
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => updateWishlistStatus(item.items[0].id, 'decline')}
                                  variant="destructive"
                                  className="text-xs"
                                >
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Decline
                                </Button>
                              </>
                            )}
                            
                            {/* Note Button */}
                            <Button
                              size="sm"
                              onClick={() => openNoteModal(item.items[0])}
                              disabled={item.status !== 'accepted' && item.status !== 'declined' && item.status !== 'deal'}
                              className={`h-8 w-8 p-0 ${
                                (item.status === 'accepted' || item.status === 'declined' || item.status === 'deal')
                                  ? 'text-slate-400 hover:text-white hover:bg-slate-700' 
                                  : 'text-slate-600 cursor-not-allowed opacity-50'
                              }`}
                            >
                              <MessageSquare className="h-4 w-4" />
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
          </CardContent>
        </Card>
      )}

      {/* PRODUCTS TABLE - Only shows when filterView !== 'wishlist' */}
      {filterView !== 'wishlist' && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-green-400" />
                {filterView === 'all' ? 'Daftar Produk' : filterView === 'auction' ? 'Produk Lelang' : 'Permintaan Client'}
              </div>
              <span className="text-sm text-slate-400">
                {totalProducts === 0 ? '0' : `${startIndex}-${endIndex}`} dari {totalProducts}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <div className="text-center py-12 text-slate-500 flex flex-col items-center">
                {filterView === 'auction' ? <Gavel className="h-12 w-12 mb-3 opacity-50" /> :
                filterView === 'request' ? <MessageSquare className="h-12 w-12 mb-3 opacity-50" /> :
                <Package className="h-12 w-12 mb-3 opacity-50" />}
                <p className="text-lg font-medium">{getEmptyMessage()}</p>
                {filterView !== 'all' && (
                  <Button
                    variant="link"
                    onClick={() => setFilterView('all')}
                    className="mt-2 text-blue-400"
                  >
                    Kembali ke Semua Produk
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-800 uppercase font-medium">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-lg">No</th>
                      <th className="px-4 py-3">Nama Produk</th>
                      <th className="px-4 py-3">Harga Produk</th>
                      <th className="px-4 py-3">Info Lelang</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 rounded-tr-lg text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {products.map((product, index) => {
                      const globalIndex = startIndex + index
                      const isBidDeadlineVisible = showBidDeadline[product.id]
                      return (
                        <tr key={product.id} className="hover:bg-slate-800/50">
                          <td className="px-4 py-3 text-slate-400">{globalIndex}</td>
                          <td className="px-4 py-3 font-medium text-white">
                            {product.nama_produk || 'Produk Tanpa Nama'}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-white font-mono">
                              {formatRupiah(product.harga || 0)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {product.auction_active && product.auction_end_time ? (
                              <div className="space-y-2">
                                <div className="flex items-center gap-1 text-orange-400 text-xs font-mono">
                                  <Clock className="h-3 w-3" />
                                  <span>Batas Lelang: {timeRemaining[product.id]?.auction || 'Loading...'}</span>
                                </div>
                                {product.current_bid_price && product.current_bid_price > (product.auction_start_price || 0) && (
                                  <div className="bg-slate-800/50 rounded p-2 border border-slate-700">
                                    <div className="flex items-center justify-between mb-1">
                                      <div className="flex items-center gap-1 text-red-400 text-xs font-mono">
                                        <Timer className="h-3 w-3" />
                                        <span>Bid Deadline:</span>
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => toggleBidDeadlineVisibility(product.id)}
                                        className="h-6 p-1 text-slate-400 hover:text-white"
                                      >
                                        {isBidDeadlineVisible ? (
                                          <EyeOff className="h-3 w-3" />
                                        ) : (
                                          <Eye className="h-3 w-3" />
                                        )}
                                      </Button>
                                    </div>
                                    {isBidDeadlineVisible ? (
                                      <div className="text-red-400 text-xs font-mono font-bold">
                                        {timeRemaining[product.id]?.bidDeadline || 'Loading...'}
                                      </div>
                                    ) : (
                                      <div className="text-slate-600 text-xs italic">
                                        [Hidden - Klik 👁 untuk lihat]
                                      </div>
                                    )}
                                    <div className="text-slate-500 text-xs mt-1">
                                      Current Bid: {formatRupiah(product.current_bid_price || 0)}
                                    </div>
                                    <div className="mt-2 flex gap-1">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => simulateNewBid(product.id, (product.current_bid_price || product.auction_start_price || 0) + (product.auction_increment || 50000))}
                                        className="h-6 text-xs border-green-600 text-green-400 hover:bg-green-900/20"
                                      >
                                        +Bid Test
                                      </Button>
                                    </div>
                                  </div>
                                )}
                                <div className="flex items-center gap-1 text-purple-400 text-xs">
                                  <DollarSign className="h-3 w-3" />
                                  <span>Start: {formatRupiah(product.auction_start_price || 0)}</span>
                                </div>
                                <div className="flex items-center gap-1 text-purple-400 text-xs">
                                  <TrendingUp className="h-3 w-3" />
                                  <span>Kelipatan: {formatRupiah(product.auction_increment || 0)}</span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-500 text-xs">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2 flex-wrap">
                              {product.is_auction ? (
                                <Badge className="bg-purple-600 text-white animate-pulse">
                                  <Gavel className="h-3 w-3 mr-1" />
                                  Sedang Lelang
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-slate-800">
                                  Normal
                                </Badge>
                              )}
                              {product.is_request ? (
                                <Badge className="bg-orange-600 text-white">
                                  <MessageSquare className="h-3 w-3 mr-1" />
                                  Request
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-slate-800">
                                  Tidak Ada Request
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                onClick={() => openEditPriceModal(product.id, product.harga)}
                                className="bg-blue-600 hover:bg-blue-700 text-xs"
                              >
                                <Edit2 className="h-3 w-3 mr-1" />
                                Edit Harga
                              </Button>
                              {product.auction_active ? (
                                <Button
                                  size="sm"
                                  onClick={() => toggleAuctionStatus(product.id, product.is_auction)}
                                  variant="destructive"
                                  className="text-xs"
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Batalkan Lelang
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => openAuctionModal(product.id, false)}
                                  className="bg-orange-600 hover:bg-orange-700 text-xs"
                                >
                                  <Gavel className="h-3 w-3 mr-1" />
                                  Jadwalkan Lelang
                                </Button>
                              )}
                            </div>
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
      )}

      {/* MODAL EDIT HARGA */}
      {showEditPriceModal && (
        <Dialog open={showEditPriceModal} onOpenChange={setShowEditPriceModal}>
          <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-blue-400">
                <Edit2 className="h-5 w-5" />
                Edit Harga Produk
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Update harga produk yang akan ditampilkan di katalog.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Harga Baru (Rp)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="number"
                    value={editingPrice}
                    onChange={(e) => setEditingPrice(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded pl-10 pr-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    placeholder="1000000"
                    autoFocus
                  />
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                <p className="text-sm text-slate-400">Format: Rp {formatRupiah(parseInt(editingPrice) || 0)}</p>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditPriceModal(false)
                  setEditingProductId(null)
                  setEditingPrice('')
                }}
                className="border-slate-600"
                disabled={priceSaving}
              >
                Batal
              </Button>
              <Button
                onClick={handleSavePrice}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={priceSaving}
              >
                {priceSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Simpan Harga
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL KONFIGURASI LELANG */}
      {showAuctionModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="bg-slate-900 border-slate-700 w-full max-w-md">
            <CardHeader className="border-b border-slate-700 flex-shrink-0">
              <CardTitle className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <Gavel className="h-5 w-5 text-purple-500" />
                  {isEditingAuction ? 'Edit Detail Lelang' : 'Konfigurasi Lelang'}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowAuctionModal(false)
                    setSelectedProductId(null)
                    setIsEditingAuction(false)
                    setSelectedFiles([])
                    setImagePreviews([])
                    setExistingGalleryUrls([])
                  }}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[60vh] overflow-y-auto py-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Harga Awal Lelang (Rp)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="number"
                    value={auctionConfig.startPrice}
                    onChange={(e) => setAuctionConfig({...auctionConfig, startPrice: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-600 rounded pl-10 pr-4 py-2 text-white focus:outline-none focus:border-purple-500"
                    placeholder="500000"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Kelipatan Bid (Rp)</label>
                <div className="relative">
                  <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="number"
                    value={auctionConfig.increment}
                    onChange={(e) => setAuctionConfig({...auctionConfig, increment: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-600 rounded pl-10 pr-4 py-2 text-white focus:outline-none focus:border-purple-500"
                    placeholder="50000"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Durasi Lelang (Hari)</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="number"
                    value={auctionConfig.durationDays}
                    onChange={(e) => setAuctionConfig({...auctionConfig, durationDays: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-600 rounded pl-10 pr-4 py-2 text-white focus:outline-none focus:border-purple-500"
                    placeholder="14"
                  />
                </div>
                {isEditingAuction && (
                  <p className="text-xs text-orange-400 mt-1">⚠️ Jika lebih pendek dari sisa waktu, timer akan reset. Jika lebih panjang, diabaikan.</p>
                )}
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Bid Deadline (Hari)</label>
                <div className="relative">
                  <Timer className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="number"
                    value={auctionConfig.bidDeadlineDays}
                    onChange={(e) => setAuctionConfig({...auctionConfig, bidDeadlineDays: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-600 rounded pl-10 pr-4 py-2 text-white focus:outline-none focus:border-purple-500"
                    placeholder="3"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Deskripsi Kondisi Barang</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <textarea
                    value={auctionConfig.description}
                    onChange={(e) => setAuctionConfig({...auctionConfig, description: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-600 rounded pl-10 pr-4 py-2 text-white focus:outline-none focus:border-purple-500 min-h-[100px]"
                    placeholder="Contoh: Barang display unit, ada goresan minor di sudut..."
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Foto Produk Lelang (Max 5 Gambar)
                </label>
                <div className="border-2 border-dashed border-slate-600 rounded-lg p-4">
                  {existingGalleryUrls.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-slate-500 mb-2">Gambar Tersimpan:</p>
                      <div className="grid grid-cols-3 gap-2">
                        {existingGalleryUrls.map((url, index) => (
                          <div key={`existing-${index}`} className="relative group">
                            <img
                              src={url}
                              alt={`Gallery ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg border border-slate-700"
                            />
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => removeExistingImage(index)}
                              className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {imagePreviews.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-slate-500 mb-2">Preview Gambar Baru:</p>
                      <div className="grid grid-cols-3 gap-2">
                        {imagePreviews.map((preview, index) => (
                          <div key={`preview-${index}`} className="relative group">
                            <img
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg border border-slate-700"
                            />
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => removePreviewImage(index)}
                              className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {(existingGalleryUrls.length + imagePreviews.length) < 5 ? (
                    <div className="text-center space-y-2">
                      <Upload className="h-8 w-8 text-slate-500 mx-auto" />
                      <p className="text-sm text-slate-400">
                        Upload {5 - (existingGalleryUrls.length + imagePreviews.length)} gambar lagi
                      </p>
                      <p className="text-xs text-slate-500">Max 10MB per gambar (JPG, PNG, WebP)</p>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                        id="image-upload"
                      />
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById('image-upload')?.click()}
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
                    </div>
                  ) : (
                    <div className="text-center py-4 text-green-400 text-sm">
                      ✅ Maksimum 5 gambar tercapai
                    </div>
                  )}
                </div>
                {(existingGalleryUrls.length + imagePreviews.length) > 0 && (
                  <p className="text-xs text-slate-500 mt-1">
                    Total: {existingGalleryUrls.length + imagePreviews.length}/5 gambar
                  </p>
                )}
              </div>
            </CardContent>
            <div className="border-t border-slate-700 p-4 flex gap-2 flex-shrink-0">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAuctionModal(false)
                  setSelectedProductId(null)
                  setIsEditingAuction(false)
                  setSelectedFiles([])
                  setImagePreviews([])
                  setExistingGalleryUrls([])
                }}
                className="flex-1 border-slate-600"
                disabled={auctionLoading || uploadingImage}
              >
                Batal
              </Button>
              <Button
                onClick={submitAuctionConfig}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
                disabled={auctionLoading || uploadingImage}
              >
                {auctionLoading || uploadingImage ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    {isEditingAuction ? 'Update Lelang' : 'Jadwalkan Lelang'}
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ✅ MODAL ADMIN NOTE - ADDED AT END */}
      {showNoteModal && (
        <Dialog open={showNoteModal} onOpenChange={setShowNoteModal}>
          <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-blue-400">
                <MessageSquare className="h-5 w-5" />
                Admin Note
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Berikan catatan internal untuk wishlist ini.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              {selectedWishlistItem && (
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <div className="flex gap-4">
                    {selectedWishlistItem.products?.gambar_url ? (
                      <img
                        src={selectedWishlistItem.products.gambar_url}
                        alt={selectedWishlistItem.products.nama_produk}
                        className="w-20 h-20 object-cover rounded-lg border border-slate-600"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-600">
                        <ImageIcon className="h-8 w-8 text-slate-500" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-white font-medium">{selectedWishlistItem.products?.nama_produk}</p>
                      <p className="text-sm text-slate-400">User: {selectedWishlistItem.profiles?.full_name}</p>
                      <p className="text-sm text-slate-400">Company: {selectedWishlistItem.profiles?.company_name || '-'}</p>
                      <p className="text-blue-400 font-mono text-sm mt-1">
                        {formatRupiah((selectedWishlistItem.price || 0) * selectedWishlistItem.quantity)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Catatan Admin</label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500 min-h-[120px]"
                  placeholder="Contoh: User meminta diskon 10% untuk pembelian bulk..."
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowNoteModal(false)
                  setSelectedWishlistItem(null)
                  setAdminNote('')
                }}
                className="border-slate-600"
                disabled={noteSaving}
              >
                Batal
              </Button>
              <Button
                onClick={handleSaveNote}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={noteSaving}
              >
                {noteSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Simpan Note
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