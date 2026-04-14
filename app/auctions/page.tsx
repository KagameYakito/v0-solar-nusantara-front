'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, DollarSign, Loader2, Search, ImageIcon, Filter } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface AuctionProduct {
  id: string
  nama_produk: string | null
  auction_start_price: number | null
  current_bid_price: number | null
  auction_end_time: string | null
  auction_gallery_urls: string[] | null
  gambar_url: string | null
  auction_active: boolean
}

interface Bidder {
  username: string
  bid_amount: number
  bid_time: string
}

export default function AuctionsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<AuctionProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [timeRemaining, setTimeRemaining] = useState<Record<string, string>>({})
  const [bidders, setBidders] = useState<Record<string, Bidder[]>>({})

  // Fetch auction products
  useEffect(() => {
    fetchAuctionProducts()
  }, [])

  // Fetch bidders for each product
  useEffect(() => {
    if (products.length > 0) {
      fetchBidders()
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

      // Fetch bids for each product
      for (const productId of productIds) {
        const { data: bids, error } = await supabase
          .from('auction_bids')
          .select(`
            bid_amount,
            created_at,
            profiles:user_id (
              username
            )
          `)
          .eq('product_id', productId)
          .order('bid_amount', { ascending: false })
          .limit(3)

        if (!error && bids) {
          biddersData[productId] = bids.map((bid: any) => ({
            username: bid.profiles?.username || 'Anonymous',
            bid_amount: bid.bid_amount,
            bid_time: bid.created_at
          }))
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
    
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}j ago`
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
  }

  const filteredProducts = products.filter(product =>
    product.nama_produk?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getProductImage = (product: AuctionProduct) => {
    if (product.auction_gallery_urls && product.auction_gallery_urls.length > 0) {
      return product.auction_gallery_urls[0]
    }
    return product.gambar_url || null
  }

  const getCurrentPrice = (product: AuctionProduct) => {
    return product.current_bid_price && product.current_bid_price > 0
      ? product.current_bid_price
      : product.auction_start_price
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
              const image = getProductImage(product)
              const currentPrice = getCurrentPrice(product)
              const productBidders = bidders[product.id] || []

              return (
                <Card key={product.id} className="bg-slate-900 border-slate-800 hover:border-green-500/50 transition-all duration-300 group">
                  {/* Product Image - Diperpendek */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-800 rounded-t-lg">
                    {image ? (
                      <img
                        src={image}
                        alt={product.nama_produk || 'Product'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/600x450?text=No+Image'
                        }}
                      />
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

                  {/* Product Info - Diperketat */}
                  <CardContent className="p-4 space-y-3">
                    <h3 className="font-bold text-lg text-white line-clamp-2 min-h-[3rem]">
                      {product.nama_produk || 'Produk Tanpa Nama'}
                    </h3>

                    {/* Current Price */}
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-xs text-slate-400">Harga Saat Ini</p>
                        <p className="text-xl font-bold text-green-500">
                          {formatRupiah(currentPrice)}
                        </p>
                      </div>
                    </div>

                    {/* Time Remaining */}
                    <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-2 border border-slate-700">
                      <Clock className="h-4 w-4 text-orange-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-400">Sisa Waktu</p>
                        <p className="text-sm font-mono font-semibold text-orange-400 truncate">
                          {timeRemaining[product.id] || 'Loading...'}
                        </p>
                      </div>
                    </div>

                    {/* ✅ Bidders Log - REAL DATA */}
                    {productBidders.length > 0 && (
                      <div className="bg-slate-800/30 rounded-lg p-2 border border-slate-700/50">
                        <p className="text-xs text-slate-400 mb-2 font-semibold">Live Bidders</p>
                        <div className="space-y-1.5">
                          {productBidders.map((bidder, index) => (
                            <div key={index} className="flex items-center justify-between text-xs">
                              <span className="text-slate-300 truncate max-w-[120px]">
                                {bidder.username}
                              </span>
                              <div className="text-right">
                                <span className="text-green-400 font-mono block">
                                  {formatRupiah(bidder.bid_amount)}
                                </span>
                                <span className="text-slate-500 text-[10px]">
                                  {formatTime(bidder.bid_time)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bid Button */}
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-base font-semibold">
                      Place Bid Sekarang
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}