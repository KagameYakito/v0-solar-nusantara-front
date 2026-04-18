'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, Moon, Sun, Zap, Box, Loader2, AlertCircle, ArrowRight, ArrowUp} from 'lucide-react'
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

   // ✅ NEW STATES FOR NAVIGATION PROTECTION
   const [showLoginAlert, setShowLoginAlert] = useState(false)
   const [showProfileAlert, setShowProfileAlert] = useState(false)
   const [showArrowAnimation, setShowArrowAnimation] = useState(false)
   const [userProfile, setUserProfile] = useState<any>(null)

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

  // ✅ NEW: Fetch user profile untuk check completion
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!isLoggedIn) {
        setUserProfile(null)
        return
      }
      
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        if (error) throw error
        setUserProfile(data)
      } catch (err) {
        console.error("Failed to fetch user profile:", err)
      }
    }
    
    fetchUserProfile()
  }, [isLoggedIn])

  // ✅ NEW: Check profile completion percentage
  const getProfileCompletion = () => {
    if (!userProfile) return 0
    
    const fields = [
      userProfile.full_name,
      userProfile.company_name,
      userProfile.company_type,
      userProfile.company_address,
      userProfile.phone_number
    ]
    
    const filled = fields.filter(f => f && f.trim() !== '').length
    return Math.round((filled / fields.length) * 100)
  }

  // ✅ NEW: Handler untuk Products link
  const handleProductsClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    
    if (!isLoggedIn) {
      setShowLoginAlert(true)
      setTimeout(() => setShowLoginAlert(false), 3000)
      return
    }
    
    // User logged in, proceed to catalog
    router.push('/catalog')
  }

  // ✅ NEW: Handler untuk Auctions link
  const handleAuctionsClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    
    // Check 1: Must be logged in
    if (!isLoggedIn) {
      setShowLoginAlert(true)
      setTimeout(() => setShowLoginAlert(false), 3000)
      return
    }
    
    // Check 2: Only apply restriction for 'user' role
    if (userRole === 'user') {
      const completion = getProfileCompletion()
      
      if (completion < 100) {
        setShowProfileAlert(true)
        setShowArrowAnimation(true)
        
        // Hide arrow after 5 seconds
        setTimeout(() => setShowArrowAnimation(false), 5000)
        return
      }
    }
    
    // All checks passed, proceed to auctions
    router.push('/auctions')
  }

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
        case 'admin_marketing':
          window.location.href = '/dashboard/admin-marketing'
          break
        case 'admin_logistik':
          window.location.href = '/dashboard/logistik'
          break
        case 'admin_data':
          window.location.href = '/dashboard/admin-data'
          break
        default:
          window.location.href = '/dashboard/user'
          break
      }
    } catch (err) {
      console.error("💥 Dashboard click error:", err)
      //
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

  interface NavLink {
    href: string
    label: string
    onClick?: (e: React.MouseEvent) => void
  }

  // Definisi Link Navigasi
  const navLinks: NavLink[] = [
    { 
      href: '/catalog', 
      label: 'Products',
      onClick: handleProductsClick 
    },
    { 
      href: '/auctions', 
      label: 'Auctions',
      onClick: handleAuctionsClick 
    },
    { href: '#contact', label: 'Contact' },
  ]

  // =========================================================================
  // RENDERING COMPONENT
  // =========================================================================
    return (
    <nav className="fixed top-0 w-full z-50 backdrop-blur-xl bg-background/95 border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 relative">
          
          {/* LOGO - Fixed di kiri dengan logo baru */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center space-x-3 group">
              <img 
                src="/solar-nusantara-logo.svg" 
                alt="Solar Nusantara" 
                className="h-12 w-auto transition-transform group-hover:scale-105"
              />
            </Link>
          </div>

          {/* NAV LINKS - Centered absolute */}
          <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 items-center space-x-2">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={link.onClick}  // ✅ Call onClick handler
                className="px-5 py-2 text-sm font-semibold text-foreground/70 hover:text-primary hover:bg-primary/5 rounded-lg transition-all duration-200 cursor-pointer"
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* RIGHT ACTIONS - Fixed di kanan */}
          <div className="flex-shrink-0">
            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className="p-2.5 hover:bg-accent/10 rounded-lg transition-all duration-200"
                aria-label="Toggle theme"
              >
                {isDark ? (
                  <Sun className="h-5 w-5 text-secondary" />
                ) : (
                  <Moon className="h-5 w-5 text-primary" />
                )}
              </button>

              {!isLoggedIn ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLoginSubmit}
                    className="text-foreground/70 hover:text-primary hover:bg-primary/5 font-semibold"
                  >
                    Log In
                  </Button>
                  <Button
                    size="sm"
                    disabled
                    className="bg-muted text-foreground/40 cursor-not-allowed font-semibold"
                  >
                    <Box className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </>
              ) : (
                <>
                  <span className="text-sm text-foreground/60 font-medium min-w-[100px] text-right">
                    {maskEmail(userEmail)}
                  </span>
                  
                  <Button
                    size="sm"
                    onClick={handleDashboardClick}
                    disabled={isChecking}
                    className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white rounded-lg min-w-[120px] font-semibold shadow-sm"
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
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2 absolute right-4">
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

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 space-y-2">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={(e) => {
                  link.onClick?.(e)  // ✅ Optional chaining
                  setIsOpen(false)
                }}
                className="block w-full text-left px-4 py-2 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-secondary/10 rounded-lg transition-colors"
              >
                {link.label}
              </button>
            ))}
            <div className="px-4 pt-4 space-y-2 border-t border-border mt-2">
              {!isLoggedIn ? (
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
        {/* ✅ ALERT: Login Required */}
        {showLoginAlert && (
          <div className="fixed top-24 left-1/2 transform -translate-x-1/2 bg-red-600/90 backdrop-blur-sm text-white px-6 py-3 rounded-xl shadow-2xl z-[60] animate-in fade-in slide-in-from-top-4 duration-300 flex items-center gap-3 border border-red-400/30">
            <AlertCircle className="h-5 w-5" />
            <span className="font-semibold">Login terlebih dahulu untuk akses!</span>
          </div>
        )}

        {/* ✅ ALERT: Profile Incomplete */}
        {showProfileAlert && (
          <div className="fixed top-24 left-1/2 transform -translate-x-1/2 bg-orange-600/90 backdrop-blur-sm text-white px-6 py-3 rounded-xl shadow-2xl z-[60] animate-in fade-in slide-in-from-top-4 duration-300 flex items-center gap-3 border border-orange-400/30">
            <AlertCircle className="h-5 w-5" />
            <span className="font-semibold">Lengkapi profil perusahaan terlebih dahulu!</span>
          </div>
        )}

        {/* ✅ ARROW ANIMATION - Pointing UP to Dashboard Button */}
        {showArrowAnimation && (
          <>
            {/* Add CSS Animation */}
            <style jsx>{`
              @keyframes arrowBounceVertical {
                0%, 100% { 
                  opacity: 1;
                  transform: translateY(0);
                }
                8.33% { 
                  transform: translateY(-15px); 
                }
                16.67% { 
                  transform: translateY(0); 
                }
                25% { 
                  transform: translateY(-15px); 
                }
                33.33% { 
                  transform: translateY(0); 
                }
                41.67% { 
                  transform: translateY(-15px); 
                }
                50% { 
                  transform: translateY(0); 
                }
                80% {
                  opacity: 1;
                  transform: translateY(0);
                }
                100% { 
                  opacity: 0;
                  transform: translateY(0);
                }
              }
            `}</style>
            
            {/* Desktop Arrow Position - Pointing UP to Dashboard button */}
            <div 
              className="hidden md:block fixed z-[70] pointer-events-none"
              style={{
                top: '100px', // Di bawah tombol Dashboard
                right: '195px', // Sejajar dengan tombol Dashboard
              }}
            >
              <ArrowUp 
                className="h-12 w-12 text-orange-500"
                style={{
                  animation: 'arrowBounceVertical 6s ease-in-out forwards'
                }}
              />
            </div>
            
            {/* Mobile Arrow Position */}
            <div 
              className="md:hidden block fixed z-[70] pointer-events-none"
              style={{
                top: '100px',
                right: '75px', // Sejajar dengan tombol Dashboard di mobile
              }}
            >
              <ArrowUp 
                className="h-10 w-10 text-orange-500"
                style={{
                  animation: 'arrowBounceVertical 6s ease-in-out forwards'
                }}
              />
            </div>
          </>
        )}
      </div>
    </nav>
  )
}