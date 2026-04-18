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
    <section id="home" className="relative min-h-screen flex items-center justify-center pt-32 px-4 pb-16">
      <div className="max-w-6xl mx-auto text-center w-full">
        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-8 leading-tight">
          <span className="block text-foreground mb-2">Powering Indonesia's</span>
          <span className="block bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            Industrial Future
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-foreground/70 mb-14 max-w-3xl mx-auto leading-relaxed font-medium">
          Enterprise-grade solar energy solutions designed for businesses. Reduce operational costs, maximize energy efficiency, and accelerate your sustainable growth.
        </p>

        {/* Search Bar */}
        <div className="mb-14 max-w-2xl mx-auto">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary via-accent to-secondary rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition duration-300" />
            <div className="relative bg-card/80 backdrop-blur-md border-2 border-border rounded-2xl p-2 shadow-lg">
              <div className="flex items-center space-x-3 px-6 py-4">
                <Search className="h-5 w-5 text-primary/70" />
                <input
                  type="text"
                  placeholder="Search solar panels, inverters, battery systems..."
                  className="flex-1 bg-transparent text-foreground placeholder-foreground/50 focus:outline-none text-base"
                />
                <Button size="sm" className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white rounded-lg px-6 font-semibold shadow-sm">
                  Search
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-5 justify-center mb-20">
          
          {/* TOMBOL 1: VIEW PRODUCTS */}
          <button
            onClick={handleViewProductsClick}
            className="inline-flex items-center justify-center rounded-xl text-lg font-bold px-8 py-4 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:scale-105 transition-all duration-200 cursor-pointer min-w-[220px]"
          >
            View Products
            <ArrowRight className="ml-3 h-6 w-6" />
          </button>

          {/* TOMBOL 2: REQUEST FOR QUOTATION */}
          <button
            onClick={handleRFQClick}
            className="inline-flex items-center justify-center rounded-xl text-lg font-bold px-8 py-4 border-2 border-primary/60 text-primary hover:bg-primary/10 hover:border-primary hover:scale-105 transition-all duration-200 cursor-pointer bg-transparent min-w-[260px]"
          >
            Request for Quotation
          </button>
        </div>

        {/* POPUP PERINGATAN (Sama persis untuk kedua tombol) */}
        {showLoginPrompt && (
          <div className="fixed top-24 left-1/2 transform -translate-x-1/2 bg-red-600/90 backdrop-blur-sm text-white px-8 py-4 rounded-xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-4 duration-300 flex items-center gap-3 border border-red-400/30">
            <Lock className="h-6 w-6" />
            <span className="font-bold">Login Terlebih Dahulu Untuk Akses!</span>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center p-6 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/10 hover:border-primary/20 transition-all duration-200">
            <div className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-3">250+</div>
            <p className="text-foreground/60 text-sm font-semibold">Enterprise Partners</p>
          </div>
          <div className="text-center p-6 rounded-xl bg-gradient-to-br from-accent/5 to-secondary/5 border border-accent/10 hover:border-accent/20 transition-all duration-200">
            <div className="text-5xl font-bold bg-gradient-to-r from-accent to-secondary bg-clip-text text-transparent mb-3">2.5GW</div>
            <p className="text-foreground/60 text-sm font-semibold">Installed Capacity</p>
          </div>
          <div className="text-center p-6 rounded-xl bg-gradient-to-br from-secondary/5 to-primary/5 border border-secondary/10 hover:border-secondary/20 transition-all duration-200">
            <div className="text-5xl font-bold bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent mb-3">40%</div>
            <p className="text-foreground/60 text-sm font-semibold">Average Cost Savings</p>
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