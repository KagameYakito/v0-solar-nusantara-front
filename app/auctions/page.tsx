'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, Clock, DollarSign, Loader2, Search, ImageIcon, Filter,
  ChevronLeft, ChevronRight, X, AlertCircle, CheckCircle
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface AuctionProduct {
  id: string
  nama_produk: string | null
  auction_start_price: number | null
  current_bid_price: number | null
  auction_increment: number | null
  auction_end_time: string | null
  auction_gallery_urls: string[] | null
  gambar_url: string | null
  auction_active: boolean
  auction_description: string | null
}

interface Bidder {
  username: string
  bid_amount: number
  bid_time: string
  isCurrentUser?: boolean
}

export default function AuctionsPage() {
  const router = useRouter()
  const [highlightedProduct, setHighlightedProduct] = useState<string | null>(null)
  const [products, setProducts] = useState<AuctionProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [timeRemaining, setTimeRemaining] = useState<Record<string, string>>({})
  const [bidders, setBidders] = useState<Record<string, Bidder[]>>({})
  const [currentImageIndex, setCurrentImageIndex] = useState<Record<string, number>>({})
  const [currentUser, setCurrentUser] = useState<any>(null)
  // Bid Modal State
  const [showBidModal, setShowBidModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<AuctionProduct | null>(null)
  const [bidAmount, setBidAmount] = useState('')
  const [submittingBid, setSubmittingBid] = useState(false)
  const [bidError, setBidError] = useState('')
  const [bidSuccess, setBidSuccess] = useState(false)

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      // ✅ PAKAI 'data:' JANGAN DIHILANGKAN
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        // ✅ PAKAI 'data:' JUGA DI SINI
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, role')  // ✅ Tambah role
          .eq('id', session.user.id)
          .single()
        
        setCurrentUser({
          id: session.user.id,
          username: profile?.full_name || 'Anonymous',
          role: profile?.role || 'user'  // ✅ Simpan role
        })
      }
    }
    fetchUser()
  }, [])

  // Fetch auction products
  useEffect(() => {
    fetchAuctionProducts()
  }, [])

  // Fetch bidders for each product
  useEffect(() => {
    if (products.length > 0) {
      fetchBidders()
      
      const channel = supabase
        .channel('auction-bids')
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'auction_bids' 
          },
          () => {
            fetchBidders()
            fetchAuctionProducts()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [products])

  // Countdown timer
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime()
      const newTimeRemaining: Record<string, string> = {}

      products.forEach(product => {
        if (product.auction_end_time && product.auction_active) {
          const auctionEnd = new Date(product.auction_end_time).getTime()
          const distance = auctionEnd - now

          if (distance > 0) {
            const days = Math.floor(distance / (1000 * 60 * 60 * 24))
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
            const seconds = Math.floor((distance % (1000 * 60)) / 1000)
            newTimeRemaining[product.id] = `${days}h ${hours}j ${minutes}m ${seconds}d`
          } else {
            newTimeRemaining[product.id] = 'SELESAI'
          }
        }
      })

      setTimeRemaining(newTimeRemaining)
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [products])

  useEffect(() => {
    // Ambil query param dari URL
    const params = new URLSearchParams(window.location.search)
    const productId = params.get('highlight')
    
    if (productId) {
      setHighlightedProduct(productId)
      
      const timer = setTimeout(() => {
        const element = document.getElementById(`product-card-${productId}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
          
          setTimeout(() => {
            setHighlightedProduct(null)
            // Bersihkan URL tanpa reload
            window.history.replaceState({}, '', window.location.pathname)
          }, 5000)
        }
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [])

  const fetchAuctionProducts = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_auction', true)
        .eq('auction_active', true)
        .order('auction_end_time', { ascending: true })

      if (error) throw error
      setProducts(data || [])
    } catch (err) {
      console.error('Failed to fetch auction products:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchBidders = async () => {
    try {
      const productIds = products.map(p => p.id)
      const biddersData: Record<string, Bidder[]> = {}

      for (const productId of productIds) {
        const { data: bids, error } = await supabase
          .from('auction_bids')
          .select(`
            bid_price,
            created_at,
            bidder_id
          `)
          .eq('product_id', productId)
          .order('bid_price', { ascending: false })
          .limit(10)

        if (error) {
          console.error(`Error fetching bids for product ${productId}:`, error)
          continue
        }
        
        if (bids && bids.length > 0) {
          const bidderIds = [...new Set(bids.map((b: any) => b.bidder_id))]
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', bidderIds)

          biddersData[productId] = bids.map((bid: any) => {
            const profile = profiles?.find((p: any) => p.id === bid.bidder_id)
            return {
              username: profile?.full_name || 'Anonymous',
              bid_amount: bid.bid_price,
              bid_time: bid.created_at,
              isCurrentUser: bid.bidder_id === currentUser?.id
            }
          })
        } else {
          biddersData[productId] = []
        }
      }

      setBidders(biddersData)
    } catch (err) {
      console.error('Failed to fetch bidders:', err)
    }
  }

  const formatRupiah = (amount: number | null) => {
    if (!amount) return 'Rp 0'
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    
    if (minutes < 60) return `${minutes}m lalu`
    if (hours < 24) return `${hours}j lalu`
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
  }

  const filteredProducts = products.filter(product =>
    product.nama_produk?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getProductImages = (product: AuctionProduct) => {
    const images: (string | null)[] = []
    
    if (product.auction_gallery_urls && product.auction_gallery_urls.length > 0) {
      images.push(...product.auction_gallery_urls)
    }
    
    if (product.gambar_url && !images.includes(product.gambar_url)) {
      images.push(product.gambar_url)
    }
    
    return images.length > 0 ? images : [null]
  }

  const getCurrentPrice = (product: AuctionProduct) => {
    return product.current_bid_price && product.current_bid_price > 0
      ? product.current_bid_price
      : (product.auction_start_price || 0)
  }

  const nextImage = (productId: string, totalImages: number) => {
    setCurrentImageIndex(prev => ({
      ...prev,
      [productId]: ((prev[productId] || 0) + 1) % totalImages
    }))
  }

  const prevImage = (productId: string, totalImages: number) => {
    setCurrentImageIndex(prev => ({
      ...prev,
      [productId]: ((prev[productId] || 0) - 1 + totalImages) % totalImages
    }))
  }

  const handlePlaceBid = (product: AuctionProduct) => {
    if (!currentUser) {
      alert('Silakan login terlebih dahulu!')
      router.push('/auth/signin')
      return
    }
  
    // ✅ BLOCK ADMIN - Tidak boleh place bid
    if (currentUser.role && currentUser.role.includes('admin')) {
      alert('❌ Anda adalah admin, fitur ini untuk user!')
      return
    }
  
    setSelectedProduct(product)
    const currentPrice = getCurrentPrice(product)
    const minIncrement = product.auction_increment || 50000
    const suggestedBid = currentPrice + minIncrement
    
    setBidAmount(suggestedBid.toString())
    setBidError('')
    setBidSuccess(false)
    setShowBidModal(true)
  }

  // ✅ FUNGSI GENERATE KODE BID RANDOM
const generateBidCode = () => {
  const letters = 'ACQPDV' // Hanya huruf A, C, Q, P, D, V
  const numbers = '0123456789'
  
  let code = '#'
  
  // 3 huruf random
  for (let i = 0; i < 3; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length))
  }
  
  // 5 angka random
  for (let i = 0; i < 5; i++) {
    code += numbers.charAt(Math.floor(Math.random() * numbers.length))
  }
  
  return code
}

const submitBid = async () => {
  if (!selectedProduct || !currentUser) return

  const bidValue = parseInt(bidAmount)
  const currentPrice = getCurrentPrice(selectedProduct)
  const minIncrement = selectedProduct.auction_increment || 50000
  const minBid = currentPrice + minIncrement

  if (isNaN(bidValue)) {
    setBidError('Masukkan harga yang valid!')
    return
  }

  if (bidValue <= currentPrice) {
    setBidError('Harga bid harus lebih tinggi dari harga saat ini!')
    return
  }

  if (bidValue < minBid) {
    setBidError(`Minimal bid adalah ${formatRupiah(minBid)} (kenaikan ${formatRupiah(minIncrement)})`)
    return
  }

  try {
    setSubmittingBid(true)
    setBidError('')

    // Generate unique bid code
    let bidCode = generateBidCode()
    let isUnique = false
    let attempts = 0
    
    // Pastikan kode unik
    while (!isUnique && attempts < 10) {
      const { data: existingBid } = await supabase
        .from('auction_bids')
        .select('bid_code')
        .eq('bid_code', bidCode)
        .maybeSingle()
      
      if (!existingBid) {
        isUnique = true
      } else {
        bidCode = generateBidCode()
        attempts++
      }
    }

    const { data: latestBid } = await supabase
      .from('auction_bids')
      .select('bid_price')
      .eq('product_id', selectedProduct.id)
      .order('bid_price', { ascending: false })
      .limit(1)
      .single()

    if (latestBid && latestBid.bid_price >= bidValue) {
      setBidError('Maaf, harga saat ini telah lebih tinggi! Silakan coba lagi.')
      return
    }

    const { error: insertError } = await supabase
      .from('auction_bids')
      .insert({
        product_id: selectedProduct.id,
        bidder_id: currentUser.id,
        bid_price: bidValue,
        bid_code: bidCode, // ✅ SIMPAN KODE BID
        created_at: new Date().toISOString()
      })

    if (insertError) throw insertError

    await supabase
      .from('products')
      .update({ 
        current_bid_price: bidValue,
        updated_at: new Date().toISOString()
      })
      .eq('id', selectedProduct.id)

    const { data: product } = await supabase
      .from('products')
      .select('bid_deadline_duration')
      .eq('id', selectedProduct.id)
      .single()

    if (product?.bid_deadline_duration) {
      const newDeadline = new Date()
      newDeadline.setDate(newDeadline.getDate() + product.bid_deadline_duration)
      
      await supabase
        .from('products')
        .update({
          bid_deadline_time: newDeadline.toISOString()
        })
        .eq('id', selectedProduct.id)
    }

    setBidSuccess(true)
    
    await fetchBidders()
    await fetchAuctionProducts()

    setTimeout(() => {
      setShowBidModal(false)
      setBidSuccess(false)
    }, 2000)

  } catch (err: any) {
    console.error('Failed to submit bid:', err)
    setBidError('Gagal menempatkan bid. Silakan coba lagi.')
  } finally {
    setSubmittingBid(false)
  }
}

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-green-500">Product Auctions</h1>
              <p className="text-sm text-slate-400">Bid on exclusive industrial equipment</p>
            </div>
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title & Description */}
        <div className="mb-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-3">Halaman Lelang</h2>
          <p className="text-lg text-slate-400 max-w-3xl mx-auto">
            Pilih produk yang kamu inginkan dan place bid untuk memenangkan lelang!
          </p>
        </div>

        {/* Search Bar & Filter */}
        <div className="mb-12">
          <div className="flex gap-4 max-w-5xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari produk lelang (misal: battery, inverter)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-12 pr-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
              />
            </div>
            <Button variant="outline" className="border-slate-700 hover:bg-slate-800 px-6">
              <Filter className="h-5 w-5 mr-2" />
              Filter
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-green-500" />
            <span className="ml-2 text-slate-400">Memuat produk lelang...</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredProducts.length === 0 && (
          <div className="text-center py-20">
            <ImageIcon className="h-16 w-16 mx-auto mb-4 text-slate-600" />
            <h3 className="text-lg font-medium text-slate-400">Tidak ada produk lelang</h3>
            <p className="text-slate-500 mt-2">Produk lelang akan muncul di sini</p>
          </div>
        )}

        {/* Product Grid - 2 Columns */}
        {!loading && filteredProducts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredProducts.map((product) => {
              const images = getProductImages(product)
              const currentIndex = currentImageIndex[product.id] ?? 0
              const currentImage = images[currentIndex] ?? null
              const currentPrice = getCurrentPrice(product)
              const productBidders = bidders[product.id] || []

              return (
                <Card 
                  key={product.id} 
                  id={`product-card-${product.id}`}  // ✅ TAMBAHKAN INI
                  className={`bg-slate-900 border-slate-800 hover:border-green-500/50 transition-all duration-300 group ${
                    highlightedProduct === product.id 
                      ? 'ring-4 ring-blue-500 ring-offset-4 ring-offset-slate-950 animate-glow' 
                      : ''
                  }`}  // ✅ GANTI className DI SINI
                >
                  {/* Product Image dengan Carousel */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-800 rounded-t-lg group/card">
                    {currentImage ? (
                      <>
                        <img
                          src={currentImage}
                          alt={product.nama_produk || 'Product'}
                          className="w-full h-full object-cover transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/600x450?text=No+Image'
                          }}
                        />
                        
                        {images.length > 1 && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                prevImage(product.id, images.length)
                              }}
                              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 z-10"
                              aria-label="Previous image"
                            >
                              <ChevronLeft className="h-5 w-5" />
                            </button>
                            
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                nextImage(product.id, images.length)
                              }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 z-10"
                              aria-label="Next image"
                            >
                              <ChevronRight className="h-5 w-5" />
                            </button>
                            
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                              {images.map((_, idx) => (
                                <button
                                  key={`${product.id}-dot-${idx}`}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setCurrentImageIndex(prev => ({ ...prev, [product.id]: idx }))
                                  }}
                                  className={`w-2 h-2 rounded-full transition-all ${
                                    idx === currentIndex 
                                      ? 'bg-white w-6' 
                                      : 'bg-white/50 hover:bg-white/80'
                                  }`}
                                  aria-label={`Go to image ${idx + 1}`}
                                />
                              ))}
                            </div>
                            
                            <div className="absolute top-4 right-4 bg-black/60 text-white px-2 py-1 rounded text-xs">
                              {currentIndex + 1} / {images.length}
                            </div>
                          </>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-12 w-12 text-slate-600" />
                      </div>
                    )}
                    
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-purple-600 text-white px-3 py-1">
                        Sedang Lelang
                      </Badge>
                    </div>
                  </div>

                  {/* Product Info - FIXED HEIGHT STRUCTURE */}
                  <CardContent className="p-4">
                    <h3 className="font-bold text-lg text-white line-clamp-2 min-h-[3rem] mb-3">
                      {product.nama_produk || 'Produk Tanpa Nama'}
                    </h3>

                    <div className="flex items-center gap-2 mb-3">
                      <DollarSign className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-slate-400">Harga Saat Ini</p>
                        <p className="text-xl font-bold text-green-500">
                          {formatRupiah(currentPrice)}
                        </p>
                      </div>
                    </div>

                    {/* Deskripsi - Fixed Height */}
                    <div className="bg-blue-900/10 rounded-lg p-2 border border-blue-700/30 mb-3 h-[120px] overflow-hidden">
                      <p className="text-xs text-blue-400 font-semibold mb-1">Kondisi Barang:</p>
                      <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                        {product.auction_description || 'Tidak ada deskripsi'}
                      </p>
                    </div>

                    {/* Timer - Fixed Height */}
                    <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-2 border border-slate-700 mb-3 h-[50px]">
                      <Clock className="h-4 w-4 text-orange-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-400">Sisa Waktu</p>
                        <p className="text-sm font-mono font-semibold text-orange-400 truncate">
                          {timeRemaining[product.id] || 'Loading...'}
                        </p>
                      </div>
                    </div>

                    {/* Bidders - Fixed Height */}
                    <div className="bg-slate-800/30 rounded-lg p-2 border border-slate-700/50 mb-3 h-[150px] overflow-hidden">
                      <p className="text-xs text-slate-400 mb-2 font-semibold">Live Bidders</p>
                      {productBidders.length > 0 ? (
                        <div 
                          className={`space-y-1.5 ${
                            productBidders.length > 2 ? 'max-h-[120px] overflow-y-auto' : ''
                          }`}
                          style={{
                            scrollbarWidth: 'thin',
                            scrollbarColor: 'rgba(100, 116, 139, 0.5) transparent'
                          }}
                        >
                          {productBidders.map((bidder, index) => (
                            <div 
                              key={`${product.id}-bidder-${index}`} 
                              className={`flex items-center justify-between text-xs p-1.5 rounded ${
                                bidder.isCurrentUser 
                                  ? 'bg-yellow-500/20 border border-yellow-500/50' 
                                  : ''
                              }`}
                            >
                              <span className={`truncate max-w-[120px] ${
                                bidder.isCurrentUser ? 'text-yellow-400 font-semibold' : 'text-slate-300'
                              }`}>
                                {bidder.username} {bidder.isCurrentUser && '(Anda)'}
                              </span>
                              <div className="text-right">
                                <span className={`font-mono block ${
                                  bidder.isCurrentUser ? 'text-yellow-400 font-bold' : 'text-green-400'
                                }`}>
                                  {formatRupiah(bidder.bid_amount)}
                                </span>
                                <span className="text-slate-500 text-[10px]">
                                  {formatTime(bidder.bid_time)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-slate-500 text-xs">
                          <p>Belum ada bidder</p>
                          <p className="text-slate-600 mt-1">Jadilah yang pertama!</p>
                        </div>
                      )}
                    </div>

                    {/* Tombol - Always at same position */}
                    <Button 
                      onClick={() => handlePlaceBid(product)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-base font-semibold"
                    >
                      Place Bid Sekarang
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* BID MODAL */}
      <Dialog open={showBidModal} onOpenChange={setShowBidModal}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-400">
              <DollarSign className="h-5 w-5" />
              Place Bid
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Letakkan bid anda untuk lelang ini.
            </DialogDescription>
          </DialogHeader>

          {bidSuccess ? (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Terima kasih telah mengisi!</h3>
              <p className="text-slate-400">Bid anda berhasil ditempatkan.</p>
            </div>
          ) : (
            <>
              <div className="space-y-4 py-4">
                {selectedProduct && (
                  <>
                    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                      <p className="text-sm text-slate-400">Harga saat ini:</p>
                      <p className="text-2xl font-bold text-green-500">
                        {formatRupiah(getCurrentPrice(selectedProduct))}
                      </p>
                    </div>

                    <div className="bg-blue-900/20 rounded-lg p-3 border border-blue-700/50">
                      <p className="text-sm text-blue-400">Minimal kenaikan:</p>
                      <p className="text-lg font-semibold text-blue-300">
                        {formatRupiah(selectedProduct.auction_increment || 50000)}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm text-slate-400 mb-2 block">
                        Jumlah Bid Anda (Rp)
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                        <input
                          type="number"
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 text-lg font-mono"
                          placeholder="Masukkan harga..."
                          autoFocus
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Minimal: {formatRupiah(getCurrentPrice(selectedProduct) + (selectedProduct.auction_increment || 50000))}
                      </p>
                    </div>

                    {bidError && (
                      <div className="bg-red-900/20 border border-red-700 rounded-lg p-3 flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-400">{bidError}</p>
                      </div>
                    )}
                  </>
                )}
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowBidModal(false)}
                  className="border-slate-600"
                  disabled={submittingBid}
                >
                  Batal
                </Button>
                <Button
                  onClick={submitBid}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={submittingBid}
                >
                  {submittingBid ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Konfirmasi Bid
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}