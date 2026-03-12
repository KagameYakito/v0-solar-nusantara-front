'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, Moon, Sun, Zap, Box, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AuthModals, type RegistrationData } from './auth-modals'
import { supabase } from '@/utils/supabaseClient'
import { useRouter } from 'next/navigation' // Import Router

export function Navbar() {
  const router = useRouter() // Inisialisasi Router
  
  // State untuk UI Mobile Menu
  const [isOpen, setIsOpen] = useState(false)
  
  // State untuk Theme (Dark/Light)
  const [isDark, setIsDark] = useState(false)
  
  // State untuk Modals Auth
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)
  
  // State untuk Status Login User
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [userRole, setUserRole] = useState<string | null>(null) // State untuk Role
  
  // State untuk Loading Indicator (Ganti nama dari isLoadingRole jadi isChecking agar lebih umum)
  const [isChecking, setIsChecking] = useState(false)

  // =========================================================================
  // 1. EFEK INISIALISASI TEMA (DARK MODE)
  // =========================================================================
  useEffect(() => {
    const isDarkMode =
      localStorage.theme === 'dark' ||
      (!('theme' in localStorage) &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    
    setIsDark(isDarkMode)
  }, [])

  // =========================================================================
  // 2. EFEK UTAMA: AUTHENTICATION & PAGE SHOW LISTENER
  // =========================================================================
  useEffect(() => {
    
    // Fungsi Internal: Refresh Session Data secara Manual
    // Dipanggil saat load pertama kali ATAU saat halaman di-restore dari cache
    const refreshSessionData = async () => {
      try {
        console.log("🔄 Memulai refresh session data...")
        const { data: { session }, error } = await supabase.auth.getSession()
        
        // Cek jika ada error atau session tidak ditemukan (expired/invalid)
        if (error || !session) {
          console.warn("⚠️ Session invalid atau expired. Resetting state.")
          setIsLoggedIn(false)
          setUserEmail('')
          setUserRole(null)
          return
        }

        // Jika session valid, update state UI
        console.log("✅ Session valid. Updating user state.")
        setIsLoggedIn(true)
        setUserEmail(session.user.email || '')
        
        // Ambil role terbaru dari database profiles
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()
        
        if (profileError) {
          console.error("❌ Gagal mengambil role:", profileError)
          setUserRole('user') // Fallback
        } else {
          setUserRole(profile?.role || 'user')
        }

      } catch (err) {
        console.error("💥 Error saat refresh session:", err)
        setIsLoggedIn(false)
      }
    }

    // A. Jalankan cek session awal saat komponen pertama kali mount
    refreshSessionData()

    // B. Listen perubahan auth real-time (Login / Logout otomatis)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("📡 Auth Event Detected:", event)

      if (event === 'SIGNED_IN' && session) {
        setIsLoggedIn(true)
        setUserEmail(session.user.email || '')
        // Fetch role async setelah login
        supabase.from('profiles').select('role').eq('id', session.user.id).single()
          .then(({ data }) => setUserRole(data?.role || 'user'))
      
      } else if (event === 'SIGNED_OUT') {
        setIsLoggedIn(false)
        setUserEmail('')
        setUserRole(null)
      
      } else if (event === 'TOKEN_REFRESHED') {
        console.log("🔄 Token berhasil di-refresh otomatis oleh Supabase")
      }
    })

    // C. [PENTING] Handle Page Show Event (Saat user kembali dari tab lain/back button)
    // Ini adalah kunci perbaikan bug "stuck session" saat switch tab
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        console.log("🚀 Halaman di-restore dari BFCache! Memicu refresh session manual...")
        // Paksa refresh session karena koneksi JS mungkin stale meski halaman muncul instan
        refreshSessionData()
      }
    }

    // Daftarkan event listener pageshow
    window.addEventListener('pageshow', handlePageShow)

    // Cleanup function saat komponen unmount
    return () => {
      subscription.unsubscribe()
      window.removeEventListener('pageshow', handlePageShow)
    }

  }, []) // Dependency array kosong agar hanya jalan sekali saat mount

  // =========================================================================
  // FUNGSI UTILITAS & HANDLERS
  // =========================================================================

  // Toggle Dark/Light Mode
  const toggleTheme = () => {
    const newDarkMode = !isDark
    setIsDark(newDarkMode)

    if (newDarkMode) {
      localStorage.theme = 'dark'
      document.documentElement.classList.add('dark')
    } else {
      localStorage.theme = 'light'
      document.documentElement.classList.remove('dark')
    }
  }

  // Handle Login Submit (Google OAuth)
  const handleLoginSubmit = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`, 
      },
    })

    if (error) {
      alert('Login failed: ' + error.message)
    }
  }

  // Handle Register Submit (Mockup logic)
  const handleRegisterSubmit = (data: RegistrationData) => {
    setUserEmail(data.email)
    setIsLoggedIn(true)
    setIsRegisterModalOpen(false)
    if (typeof window !== 'undefined') {
      localStorage.setItem('isLoggedIn', 'true')
    }
  }

  // Handle Sign Out
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.warn("Sign out error:", error)
    } finally {
      // Bersihkan state lokal apapun yang terjadi
      setIsLoggedIn(false)
      setUserEmail('')
      setUserRole(null)
      setIsLoginModalOpen(false)
      setIsRegisterModalOpen(false)
      
      if (typeof window !== 'undefined') {
        localStorage.removeItem('isLoggedIn')
        // Hapus manual token Supabase yang mungkin nyangkut (prefix 'sb-')
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-')) {
            localStorage.removeItem(key)
          }
        })
      }

      // Hard redirect untuk reset total state browser
      window.location.href = '/'
    }
  }

  // Handle Dashboard Click (Smart Redirect dengan Fresh Check)
  const handleDashboardClick = async () => {
    // Cegah klik ganda jika sedang proses checking
    if (isChecking) return
    
    setIsChecking(true)
    
    try {
      // 1. Ambil session fresh langsung dari Supabase
      const { data: { session }, error } = await supabase.auth.getSession()
      
      // Cek jika ada error atau tidak ada session
      if (error || !session) {
        console.warn("⚠️ Tidak ada session valid saat klik dashboard. Redirect to login.")
        window.location.href = '/auth/signin'
        return
      }

      // 2. Ambil role dari database
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      // Jika gagal ambil profile, amanannya kembali ke home
      if (profileError || !profile) {
        console.error("❌ Gagal mengambil profile user. Redirect to home.")
        window.location.href = '/'
        return
      }

      const role = profile.role || 'user'
      console.log("🎯 Redirecting user with role:", role)

      // 3. Hard redirect berdasarkan role
      switch (role) {
        case 'super_admin':
          window.location.href = '/dashboard/super-admin'
          break
        case 'admin_sales':
          window.location.href = '/dashboard/sales'
          break
        case 'admin_logistik':
          window.location.href = '/dashboard/logistik'
          break
        case 'admin_data':
          window.location.href = '/dashboard/data'
          break
        default:
          window.location.href = '/dashboard/user'
          break
      }
    } catch (err) {
      console.error("💥 Dashboard click error:", err)
      // Fallback ke home jika ada error tak terduga
      window.location.href = '/'
    } finally {
      setIsChecking(false)
    }
  }

  // Masking Email untuk Tampilan
  const maskEmail = (email: string) => {
    if (!email) return ''
    const [localPart, domain] = email.split('@')
    return `${localPart.charAt(0)}***@***.${domain.split('.')[1]}`
  }

  // Definisi Link Navigasi
  const navLinks = [
    { href: '#products', label: 'Products' },
    { href: '#solutions', label: 'Auctions' },
    { href: '#contact', label: 'Contact' },
  ]

  // =========================================================================
  // RENDERING COMPONENT
  // =========================================================================
  return (
    <nav className="fixed top-0 w-full z-50 backdrop-blur-lg bg-background/80 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo Section */}
          <Link href="#" className="flex items-center space-x-2 group">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent hidden sm:inline">
              Solar Nusantara
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Side Actions (Theme, User, Dashboard, Logout) */}
          <div className="hidden md:flex items-center space-x-4">
            
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-secondary/10 rounded-lg transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="h-5 w-5 text-foreground" />
              ) : (
                <Moon className="h-5 w-5 text-foreground" />
              )}
            </button>

            {/* Conditional Rendering: Logged Out vs Logged In */}
            {!isLoggedIn ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLoginSubmit}
                  className="text-foreground/80 hover:text-foreground"
                >
                  Log In
                </Button>
                <Button
                  size="sm"
                  disabled
                  className="text-foreground/50 hover:text-foreground/70 cursor-not-allowed"
                >
                  <Box className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </>
            ) : (
              <>
                {/* User Email Display */}
                <span className="text-sm text-foreground/70 font-medium">
                  {maskEmail(userEmail)}
                </span>
                
                {/* Smart Dashboard Button */}
                <Button
                  size="sm"
                  onClick={handleDashboardClick}
                  disabled={isChecking}
                  className="bg-primary hover:bg-primary/90 text-white rounded-lg min-w-[120px]"
                >
                  {isChecking ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Box className="h-4 w-4 mr-2" />
                      Dashboard
                    </>
                  )}
                </Button>

                {/* Sign Out Button */}
                <Button
                  size="sm"
                  onClick={handleSignOut}
                  variant="outline"
                  className="border-foreground/30 hover:bg-foreground/5 bg-transparent text-foreground"
                >
                  Sign Out
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button (Hamburger) */}
          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-secondary/10 rounded-lg transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="h-5 w-5 text-foreground" />
              ) : (
                <Moon className="h-5 w-5 text-foreground" />
              )}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 hover:bg-secondary/10 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isOpen && (
          <div className="md:hidden pb-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-4 py-2 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-secondary/10 rounded-lg transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            
            <div className="px-4 pt-4 space-y-2 border-t border-border mt-2">
              {!isLoggedIn ? (
                <>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        handleLoginSubmit()
                        setIsOpen(false)
                      }}
                      className="flex-1 text-foreground/80"
                    >
                      Log In
                    </Button>
                    <Button
                      size="sm"
                      disabled
                      className="flex-1 text-foreground/50 cursor-not-allowed"
                    >
                      <Box className="h-4 w-4 mr-1" />
                      Dashboard
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled
                      className="flex-1 text-foreground/60 cursor-default text-xs justify-start"
                    >
                      {maskEmail(userEmail)}
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    {/* Mobile Dashboard Button */}
                    <Button
                      size="sm"
                      onClick={() => {
                        handleDashboardClick()
                        setIsOpen(false)
                      }}
                      disabled={isChecking}
                      className="flex-1 bg-primary hover:bg-primary/90 text-white text-xs"
                    >
                       {isChecking ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <>
                          <Box className="h-3 w-3 mr-1" />
                          Dashboard
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        handleSignOut()
                        setIsOpen(false)
                      }}
                      variant="outline"
                      className="flex-1 border-foreground/30 text-foreground text-xs"
                    >
                      Sign Out
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Auth Modals Component */}
      <AuthModals
        isLoginOpen={isLoginModalOpen}
        isRegisterOpen={isRegisterModalOpen}
        onLoginClose={() => setIsLoginModalOpen(false)}
        onRegisterClose={() => setIsRegisterModalOpen(false)}
        onLoginSubmit={handleLoginSubmit}
        onRegisterSubmit={handleRegisterSubmit}
      />
    </nav>
  )
}