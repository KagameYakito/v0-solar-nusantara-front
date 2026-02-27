'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation' // 1. Import Router untuk navigasi manual
import { ArrowRight, Search, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/utils/supabaseClient'

export function Hero() {
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter() // 2. Inisialisasi Router

  // Sinkronisasi Status Login dengan Supabase Auth
  useEffect(() => {
    // Cek session saat pertama kali load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session)
      setLoading(false)
    })

    // Dengarkan perubahan auth real-time (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // 3. FUNGSI PENJAGA GERBANG (GATEKEEPER)
  // Fungsi ini mengecek sesi LANGSUNG ke server setiap kali tombol diklik
  const handleViewProductsClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    console.log("🔴 TOMBOL DIKLIK! Starting check...") // <--- TAMBAHKAN INI
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error("❌ Error getting session:", error)
      }

      if (!session) {
        console.log("⛔ NO SESSION. Access Denied.")
        setShowLoginPrompt(true)
        setTimeout(() => setShowLoginPrompt(false), 3000)
      } else {
        console.log("✅ SESSION VALID. Redirecting...")
        router.push('/catalog')
      }
    } catch (err) {
      console.error("💥 CRITICAL ERROR IN CLICK HANDLER:", err)
    }
  }

  // Tampilkan loading spinner jika masih cek session
  if (loading) {
    return (
      <section className="relative min-h-screen flex items-center justify-center pt-32 px-4 pb-12">
        <div className="text-primary animate-pulse font-bold text-xl">Checking Access...</div>
      </section>
    )
  }

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center pt-32 px-4 pb-12"
    >
      <div className="max-w-5xl mx-auto text-center w-full">
        {/* Main Headline */}
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
                <Button
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-white rounded-lg px-6"
                >
                  Search
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          
          {/* TOMBOL VIEW PRODUCTS (VERSI AMAN & DIPERKERAS) */}
          {/* Menggunakan <button> biasa agar bisa kontrol penuh event onClick */}
          <button
            onClick={handleViewProductsClick}
            // HAPUS: disabled={!isLoggedIn}
            // GANTI CLASS: Hapus logika kondisi, paksa selalu biru (bg-primary)
            className="inline-flex items-center justify-center rounded-lg text-base font-semibold px-8 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 hover:scale-105 transition-all cursor-pointer"
          >
            View Products
            <ArrowRight className="ml-2 h-5 w-5" />
          </button>

          {/* TOMBOL RFQ */}
          <Button
            size="lg"
            disabled={!isLoggedIn}
            variant="outline"
            className={`rounded-lg text-base font-semibold transition-all ${
              isLoggedIn
                ? 'border-primary/50 text-primary hover:bg-primary/10 hover:scale-105'
                : 'border-foreground/10 bg-transparent text-foreground/40 cursor-not-allowed'
            }`}
            onClick={() => {
              // Logika keamanan serupa untuk tombol RFQ
              if (!isLoggedIn) {
                setShowLoginPrompt(true)
                setTimeout(() => setShowLoginPrompt(false), 3000)
              } else {
                router.push('/dashboard') // Atau halaman RFQ lainnya
              }
            }}
          >
            Request for Quotation
          </Button>
        </div>

        {/* POPUP PERINGATAN (SATPAM BERBICARA) */}
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
    </section>
  )
}