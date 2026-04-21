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
  current_bidder_id: string | null
  auction_winner_name: string | null
  auction_end_reason: string | null
  // Fields used when this record is mapped from auction_history
  isHistorical?: boolean
  historyId?: string
  historyStartTime?: string | null
  historyEndTime?: string | null
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
  // Historical finished auctions from auction_history table
  const [historicalProducts, setHistoricalProducts] = useState<AuctionProduct[]>([])
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
  const [showFinishedDialog, setShowFinishedDialog] = useState(false)

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

  // Fetch auction products (active) and finished auctions (from history)
  useEffect(() => {
    fetchAuctionProducts()
    fetchFinishedAuctions()
  }, [])

  // Fetch bidders for each active product
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

  // Subscribe to auction_history inserts to refresh finished auction cards
  useEffect(() => {
    const historyChannel = supabase
      .channel('auction-history-changes')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'auction_history' },
        () => {
          fetchFinishedAuctions()
          fetchAuctionProducts()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(historyChannel)
    }
  }, [])

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
    // Check if running in browser
    if (typeof window === 'undefined') return
    
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
      console.log('🔍 Fetching active auction products...')
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_auction', true)
        .eq('auction_active', true)
        .order('auction_end_time', { ascending: true })
  
      if (error) throw error
      
      console.log('📦 Active products:', data?.length || 0)
      
      setProducts(data || [])
      
    } catch (err) {
      console.error('❌ Failed to fetch auction products:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchBidders = async () => {
    try {
      const productIds = products.map(p => p.id)
      const biddersData: Record<string, Bidder[]> = {}
  
      for (const productId of productIds) {
        const product = products.find(p => p.id === productId)
        
        if (!product) {
          continue
        }
        
        // ✅ FETCH BIDS UNTUK SEMUA PRODUK (aktif maupun selesai)
        // Jangan skip produk yang sudah selesai
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

  // Fetch finished auctions from auction_history table (persists across re-auctions)
  const fetchFinishedAuctions = async () => {
    try {
      const { data: historyData, error: historyError } = await supabase
        .from('auction_history')
        .select('*')
        .in('auction_end_reason', ['force_stop', 'completed'])
        .order('auction_end_time', { ascending: false })

      if (historyError) throw historyError
      if (!historyData || historyData.length === 0) {
        setHistoricalProducts([])
        return
      }

      // Enrich with product image data
      const productIds = [...new Set(historyData.map((h: any) => h.product_id))]
      const { data: productsData } = await supabase
        .from('products')
        .select('id, gambar_url, auction_gallery_urls, auction_description')
        .in('id', productIds)

      // Map auction_history records to AuctionProduct shape
      // Use stored image fields from auction_history first; fallback to current product data
      const mapped: AuctionProduct[] = historyData.map((h: any) => {
        const productInfo = productsData?.find((p: any) => p.id === h.product_id)
        return {
          id: h.product_id,
          historyId: h.id,
          isHistorical: true,
          historyStartTime: h.auction_start_time || null,
          historyEndTime: h.auction_end_time || null,
          nama_produk: h.product_name || null,
          auction_start_price: h.start_price || null,
          current_bid_price: h.final_price || null,
          auction_increment: null,
          auction_end_time: null,
          auction_gallery_urls: h.auction_gallery_urls || productInfo?.auction_gallery_urls || null,
          gambar_url: h.gambar_url || productInfo?.gambar_url || null,
          auction_active: false,
          auction_description: h.auction_description || productInfo?.auction_description || null,
          current_bidder_id: h.winner_id || null,
          auction_winner_name: h.winner_name || null,
          auction_end_reason: h.auction_end_reason || null
        }
      })

      setHistoricalProducts(mapped)

      // Fetch time-range-filtered bidders for each historical auction
      const biddersData: Record<string, Bidder[]> = {}
      for (const h of historyData) {
        let query = supabase
          .from('auction_bids')
          .select('bid_price, created_at, bidder_id')
          .eq('product_id', h.product_id)
          .lte('created_at', h.auction_end_time)
          .order('bid_price', { ascending: false })
          .limit(10)

        if (h.auction_start_time) {
          query = query.gte('created_at', h.auction_start_time)
        }

        const { data: bids } = await query

        if (bids && bids.length > 0) {
          const bidderIds = [...new Set(bids.map((b: any) => b.bidder_id))]
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', bidderIds)

          biddersData[h.id] = bids.map((bid: any) => {
            const profile = profiles?.find((p: any) => p.id === bid.bidder_id)
            return {
              username: profile?.full_name || 'Anonymous',
              bid_amount: bid.bid_price,
              bid_time: bid.created_at,
              isCurrentUser: bid.bidder_id === currentUser?.id
            }
          })
        } else {
          biddersData[h.id] = []
        }
      }

      // Merge historical bidders into the bidders state using historyId as key
      setBidders(prev => ({ ...prev, ...biddersData }))
    } catch (err) {
      console.error('❌ Failed to fetch finished auctions:', err)
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

  // Combine active and historical, then filter by search term
  const allAuctionProducts = [...products, ...historicalProducts]
  const filteredProducts = allAuctionProducts.filter(product =>
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
    // ✅ CEK APAKAH LELANG SUDAH SELESAI
    if (!product.auction_active) {
      setShowFinishedDialog(true)
      return
    }
    
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
        current_bidder_id: currentUser.id, 
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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      {/* Header */}
      <div className="border-b-2 border-border bg-card/80 backdrop-blur-xl shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="/solar-nusantara-logo.svg" 
                alt="Solar Nusantara" 
                className="h-10 w-auto"
              />
              <div className="h-8 w-px bg-border" />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Product Auctions</h1>
                <p className="text-sm text-foreground/60">Bid on exclusive industrial equipment</p>
              </div>
            </div>
            <Link href="/">
              <Button variant="outline" className="border-2 border-primary/40 hover:bg-primary/10 hover:border-primary rounded-xl text-foreground font-semibold bg-transparent transition-all duration-200">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Title & Description */}
        <div className="mb-12 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">Auction Page</h2>
          <p className="text-lg text-foreground/70 max-w-3xl mx-auto font-medium">
            Choose the products you want and place bids to win the auction!
          </p>
        </div>

        {/* Search Bar & Filter */}
        <div className="mb-12">
          <div className="flex gap-4 max-w-5xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/70" />
              <input
                type="text"
                placeholder="Search auction products (e.g., battery, inverter)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-card/60 border-2 border-border rounded-xl pl-12 pr-4 py-4 text-foreground placeholder:text-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200 font-medium"
              />
            </div>
            <Button variant="outline" className="border-2 border-border hover:bg-accent/10 hover:border-accent rounded-xl px-6 font-semibold transition-all duration-200">
              <Filter className="h-5 w-5 mr-2" />
              Filter
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-foreground/70 font-medium">Loading auction products...</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredProducts.length === 0 && (
          <div className="text-center py-20 bg-card/60 rounded-2xl border-2 border-border">
            <ImageIcon className="h-16 w-16 mx-auto mb-4 text-foreground/30" />
            <h3 className="text-lg font-semibold text-foreground/70">No auction products</h3>
            <p className="text-foreground/50 mt-2">Auction products will appear here</p>
          </div>
        )}

        {/* Product Grid - 2 Columns */}
        {!loading && filteredProducts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredProducts.map((product) => {
              // Use historyId as key for historical cards to avoid collision with product.id
              const cardKey = product.isHistorical ? `history-${product.historyId}` : product.id
              // Historical bidders are keyed by historyId, active by product.id
              const bidderKey = product.isHistorical ? (product.historyId || product.id) : product.id
              const images = getProductImages(product)
              const currentIndex = currentImageIndex[cardKey] ?? 0
              const currentImage = images[currentIndex] ?? null
              const currentPrice = getCurrentPrice(product)
              const productBidders = bidders[bidderKey] || []

              return (
                <Card 
                  key={cardKey} 
                  id={`product-card-${cardKey}`}
                  className={`bg-slate-900 border-slate-800 hover:border-green-500/50 transition-all duration-300 group ${
                    highlightedProduct === product.id 
                      ? 'ring-4 ring-blue-500 ring-offset-4 ring-offset-slate-950 animate-pulse border-blue-500' 
                      : ''
                  }`}
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
                                prevImage(cardKey, images.length)
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
                                nextImage(cardKey, images.length)
                              }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 z-10"
                              aria-label="Next image"
                            >
                              <ChevronRight className="h-5 w-5" />
                            </button>
                            
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                              {images.map((_, idx) => (
                                <button
                                  key={`${cardKey}-dot-${idx}`}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setCurrentImageIndex(prev => ({ ...prev, [cardKey]: idx }))
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
                    {product.auction_active ? (
                      <Badge className="bg-purple-600 text-white px-3 py-1">
                        Sedang Lelang
                      </Badge>
                    ) : (product.auction_end_reason === 'force_stop' || product.auction_end_reason === 'completed') ? (
                      <Badge className="bg-pink-600 text-white px-3 py-1">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Lelang Selesai
                      </Badge>
                    ) : null}
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
                          {product.auction_active 
                            ? (timeRemaining[product.id] || 'Loading...')
                            : '0h 0j 0m 0s'
                          }
                        </p>
                      </div>
                    </div>

                    {/* Bidders / Winner - Fixed Height */}
                    {!product.auction_active && (product.auction_winner_name || productBidders.length > 0) ? (
                      /* Winner Banner for finished auctions */
                      <div className="bg-yellow-900/30 rounded-lg p-3 border border-yellow-500/50 mb-3 h-[150px] flex flex-col justify-center">
                        <p className="text-xs text-yellow-400 mb-2 font-semibold text-center">🏆 Pemenang Lelang</p>
                        <div className="text-center space-y-1">
                          <p className="text-base font-bold text-yellow-300 truncate px-2">
                            {product.auction_winner_name || productBidders[0]?.username || 'Anonim'}
                          </p>
                          <p className="text-xl font-bold text-green-400 font-mono">
                            {formatRupiah(product.current_bid_price || productBidders[0]?.bid_amount || 0)}
                          </p>
                          <p className="text-[10px] text-slate-500">Harga Akhir Lelang</p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-800/30 rounded-lg p-2 border border-slate-700/50 mb-3 h-[150px] overflow-hidden">
                        <p className="text-xs text-slate-400 mb-2 font-semibold">
                          {product.auction_active ? 'Live Bidders' : 'Bidder History'}
                        </p>
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
                    )}

                    {/* Tombol - Always at same position */}
                    <Button 
                      onClick={() => handlePlaceBid(product)}
                      disabled={!product.auction_active}
                      className={`w-full py-3 text-base font-semibold ${
                        product.auction_active
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {product.auction_active ? 'Place Bid Sekarang' : 'Lelang Selesai'}
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

      {/* ✅ DIALOG LELANG SUDAH SELESAI */}
      <Dialog open={showFinishedDialog} onOpenChange={setShowFinishedDialog}>
        <DialogContent className="bg-slate-900 border-pink-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-pink-400">
              <AlertCircle className="h-5 w-5" />
              Lelang Sudah Selesai
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Maaf, lelang ini sudah tidak tersedia.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-slate-300 text-center">
              Lelang ini sudah selesai, silakan cari produk lain!
            </p>
          </div>
          
          <DialogFooter>
            <Button
              onClick={() => setShowFinishedDialog(false)}
              className="w-full bg-pink-600 hover:bg-pink-700"
            >
              <X className="h-4 w-4 mr-2" />
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}