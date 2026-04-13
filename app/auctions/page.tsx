'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, DollarSign, Loader2, Search, ImageIcon } from 'lucide-react'
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

export default function AuctionsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<AuctionProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [timeRemaining, setTimeRemaining] = useState<Record<string, string>>({})

  // Fetch auction products
  useEffect(() => {
    fetchAuctionProducts()
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

  const formatRupiah = (amount: number | null) => {
    if (!amount) return 'Rp 0'
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
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
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-green-500">Product Auctions</h1>
                <p className="text-sm text-slate-400">Bid on exclusive industrial equipment</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari produk lelang (misal: battery, inverter)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-12 pr-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-green-500" />
            <span className="ml-2 text-slate-400">Memuat produk lelang...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <ImageIcon className="h-16 w-16 mx-auto mb-4 text-slate-600" />
            <h3 className="text-lg font-medium text-slate-400">Tidak ada produk lelang</h3>
            <p className="text-slate-500 mt-2">Produk lelang akan muncul di sini</p>
          </div>
        ) : (
          /* Product Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const image = getProductImage(product)
              const currentPrice = getCurrentPrice(product)

              return (
                <Card key={product.id} className="bg-slate-900 border-slate-800 hover:border-green-500/50 transition-all duration-300 group">
                  {/* Product Image */}
                  <div className="relative aspect-[4/5] overflow-hidden bg-slate-800 rounded-t-lg">
                    {image ? (
                      <img
                        src={image}
                        alt={product.nama_produk || 'Product'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/400x500?text=No+Image'
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-12 w-12 text-slate-600" />
                      </div>
                    )}
                    
                    {/* Auction Badge */}
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-purple-600 text-white">
                        Sedang Lelang
                      </Badge>
                    </div>
                  </div>

                  {/* Product Info */}
                  <CardContent className="p-4 space-y-3">
                    <h3 className="font-semibold text-white line-clamp-2 min-h-[3rem]">
                      {product.nama_produk || 'Produk Tanpa Nama'}
                    </h3>

                    {/* Current Price */}
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="text-xs text-slate-400">Harga Saat Ini</p>
                        <p className="text-lg font-bold text-green-500">
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

                    {/* Bid Button */}
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                      Place Bid
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