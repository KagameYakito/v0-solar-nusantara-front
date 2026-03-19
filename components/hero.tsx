'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Search, Lock, ShoppingCart, Plus, X, CheckCircle, Loader2, ExternalLink, Trash2, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/utils/supabaseClient'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import Link from 'next/link'

// Interface untuk Wishlist (Sama persis dengan di Dashboard User)
interface WishlistItem {
  id: string
  product_id: string
  product_name: string
  quantity: number
  added_date: string
}

export function Hero() {
  const router = useRouter()
  
  // State Auth & Loading
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)

  // State Modal RFQ (Wishlist)
  const [showRFQModal, setShowRFQModal] = useState(false)
  const [wishlist, setWishlist] = useState<WishlistItem[]>([])
  const [submittingRequest, setSubmittingRequest] = useState(false)

  // 1. Sinkronisasi Status Login
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Load Wishlist dari LocalStorage saat modal dibuka
  useEffect(() => {
    if (showRFQModal) {
      const savedWishlist = localStorage.getItem('sonushub_wishlist')
      if (savedWishlist) {
        try {
          setWishlist(JSON.parse(savedWishlist))
        } catch (e) {
          console.error("Failed to parse wishlist:", e)
        }
      }
    }
  }, [showRFQModal])

  // Save Wishlist ke LocalStorage
  useEffect(() => {
    localStorage.setItem('sonushub_wishlist', JSON.stringify(wishlist))
  }, [wishlist])

  // 2. FUNGSI PENJAGA GERBANG (GATEKEEPER) - Digunakan oleh kedua tombol
  const checkAuthAndProceed = async (action: () => void) => {
    console.log("🔴 TOMBOL DIKLIK! Starting check...")
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error || !session) {
        console.log("⛔ NO SESSION. Access Denied.")
        setShowLoginPrompt(true)
        setTimeout(() => setShowLoginPrompt(false), 3000)
      } else {
        console.log("✅ SESSION VALID. Proceeding...")
        action()
      }
    } catch (err) {
      console.error("💥 CRITICAL ERROR:", err)
    }
  }

  // Handler Tombol View Products
  const handleViewProductsClick = (e: React.MouseEvent) => {
    e.preventDefault()
    checkAuthAndProceed(() => {
      router.push('/catalog')
    })
  }

  // Handler Tombol Request for Quotation (BUKA MODAL)
  const handleRFQClick = (e: React.MouseEvent) => {
    e.preventDefault()
    checkAuthAndProceed(() => {
      setShowRFQModal(true)
    })
  }

  // --- Fungsi Manajemen Wishlist (Sama persis dengan Dashboard User) ---
  const updateQuantity = (productId: string, delta: number) => {
    setWishlist(prev => prev.map(item => {
      if (item.product_id === productId) {
        const newQty = Math.max(1, item.quantity + delta)
        return { ...item, quantity: newQty }
      }
      return item
    }))
  }

  const removeItem = (productId: string) => {
    setWishlist(prev => prev.filter(item => item.product_id !== productId))
  }

  const submitRequest = async () => {
    if (wishlist.length === 0) {
      alert("❌ Wishlist kosong! Tambahkan produk dulu dari katalog.")
      return
    }

    try {
      setSubmittingRequest(true)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error("Session expired")

      // Insert ke database (Pastikan tabel product_requests sudah dibuat di SQL sebelumnya)
      const { data, error } = await supabase
        .from('product_requests')
        .insert({
          user_id: session.user.id,
          items: wishlist,
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      // Clear wishlist setelah sukses
      setWishlist([])
      setShowRFQModal(false)
      alert("✅ Permintaan produk berhasil dikirim! Tim kami akan segera memverifikasi.")

    } catch (err: any) {
      console.error("Failed to submit request:", err)
      alert("❌ Gagal mengirim permintaan: " + err.message)
    } finally {
      setSubmittingRequest(false)
    }
  }

  if (loading) {
    return (
      <section className="relative min-h-screen flex items-center justify-center pt-32 px-4 pb-12">
        <div className="text-primary animate-pulse font-bold text-xl">Checking Access...</div>
      </section>
    )
  }

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center pt-32 px-4 pb-12">
      <div className="max-w-5xl mx-auto text-center w-full">
        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-tight">
          <span className="block text-foreground">Powering Indonesia's</span>
          <span className="block text-primary">Industrial Future</span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-foreground/70 mb-12 max-w-3xl mx-auto leading-relaxed">
          Enterprise-grade solar energy solutions designed for businesses. Reduce operational costs, maximize energy efficiency, and accelerate your sustainable growth.
        </p>

        {/* Search Bar */}
        <div className="mb-12 max-w-2xl mx-auto">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition duration-300" />
            <div className="relative bg-card/70 backdrop-blur-md border border-primary/20 rounded-2xl p-2">
              <div className="flex items-center space-x-3 px-6 py-4">
                <Search className="h-5 w-5 text-foreground/60" />
                <input
                  type="text"
                  placeholder="Search solar panels, inverters, battery systems..."
                  className="flex-1 bg-transparent text-foreground placeholder-foreground/50 focus:outline-none text-base"
                />
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-white rounded-lg px-6">
                  Search
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Buttons - DIPERBESAR & DIBUAT NYAMAN */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          
          {/* TOMBOL 1: VIEW PRODUCTS (Gatekeeper Active + Ukuran Besar) */}
          <button
            onClick={handleViewProductsClick}
            className="inline-flex items-center justify-center rounded-lg text-lg font-bold px-7 py-3 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 hover:scale-105 transition-all cursor-pointer min-w-[200px]"
          >
            View Products
            <ArrowRight className="ml-3 h-6 w-6" />
          </button>

          {/* TOMBOL 2: REQUEST FOR QUOTATION (Gatekeeper + Modal RFQ + Ukuran Besar) */}
          <button
            onClick={handleRFQClick}
            className="inline-flex items-center justify-center rounded-lg text-lg font-bold px-7 py-3 border-2 border-primary/50 text-primary hover:bg-primary/10 hover:scale-105 transition-all cursor-pointer bg-transparent min-w-[240px]"
          >
            Request for Quotation
          </button>
        </div>

        {/* POPUP PERINGATAN (Sama persis untuk kedua tombol) */}
        {showLoginPrompt && (
          <div className="fixed top-24 left-1/2 transform -translate-x-1/2 bg-red-600/90 backdrop-blur-sm text-white px-8 py-4 rounded-xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-4 duration-300 flex items-center gap-3 border border-red-400/30">
            <Lock className="h-6 w-6" />
            <span className="font-bold">Access Denied: Session Expired or Not Logged In!</span>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">250+</div>
            <p className="text-foreground/60 text-sm">Enterprise Partners</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">2.5GW</div>
            <p className="text-foreground/60 text-sm">Installed Capacity</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">40%</div>
            <p className="text-foreground/60 text-sm">Average Cost Savings</p>
          </div>
        </div>
      </div>

      {/* MODAL RFQ / WISHLIST (Sama persis dengan Dashboard User) */}
      <Dialog open={showRFQModal} onOpenChange={setShowRFQModal}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-orange-400" />
              Buat Permintaan Produk (RFQ)
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Review produk di wishlist Anda dan ajukan permintaan.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {wishlist.length === 0 ? (
              // EMPTY STATE
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
              // WISHLIST ITEMS
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {wishlist.map((item) => (
                  <div key={item.product_id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div className="flex-1">
                      <p className="text-white font-medium">{item.product_name}</p>
                      <p className="text-slate-400 text-xs">
                        Ditambahkan: {new Date(item.added_date).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
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
                      
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeItem(item.product_id)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {wishlist.length > 0 && (
            <DialogFooter className="border-t border-slate-700 pt-4">
              <div className="flex justify-between w-full">
                <Button
                  variant="outline"
                  onClick={() => setShowRFQModal(false)}
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
                        Kirim Permintaan ({wishlist.length} Produk)
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}