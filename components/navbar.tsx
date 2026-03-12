'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, Moon, Sun, Zap, LogOut, Box, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AuthModals, type RegistrationData } from './auth-modals'
import { supabase } from '@/utils/supabaseClient'
import { useRouter } from 'next/navigation' // Import Router

export function Navbar() {
  const router = useRouter() // Inisialisasi Router
  const [isOpen, setIsOpen] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [userRole, setUserRole] = useState<string | null>(null) // State untuk Role
  const [isLoadingRole, setIsLoadingRole] = useState(false) // State Loading Role
  
  // State tambahan untuk handle focus window (opsional)
  const [isWindowFocused, setIsWindowFocused] = useState(true);

  // 1. Efek untuk Theme Initialization
  useEffect(() => {
    const isDarkMode =
      localStorage.theme === 'dark' ||
      (!('theme' in localStorage) &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    setIsDark(isDarkMode)
  }, [])

  // 2. Efek untuk Window Focus/Blur (Mencegah konflik saat switch tab)
  useEffect(() => {
    const handleFocus = () => {
      setIsWindowFocused(true);
      console.log("Window focused - skipping auto refresh to prevent conflicts");
    };

    const handleBlur = () => {
      setIsWindowFocused(false);
      console.log("Window blurred");
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // 3. Efek Utama: Cek Session & Auth Listener
  useEffect(() => {
    // Fungsi lokal untuk cek session awal
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setIsLoggedIn(true)
        setUserEmail(session.user.email || '')
        await fetchUserRole(session.user.id) // Ambil role jika sudah login
      }
    }
    
    // Jalankan cek session
    checkSession()

    // Listen perubahan auth (login/logout real-time)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        setIsLoggedIn(true)
        setUserEmail(session.user.email || '')
        await fetchUserRole(session.user.id) // Ambil role saat login baru
      } else {
        setIsLoggedIn(false)
        setUserEmail('')
        setUserRole(null) // Reset role saat logout
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Fungsi Baru: Mengambil Role User dari Database
  const fetchUserRole = async (userId: string) => {
    setIsLoadingRole(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()
      
      if (error) throw error
      setUserRole(data?.role || 'user')
    } catch (error) {
      console.error("Gagal mengambil role user:", error)
      setUserRole('user') // Fallback ke user biasa jika error
    } finally {
      setIsLoadingRole(false)
    }
  }

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

  const handleRegisterSubmit = (data: RegistrationData) => {
    setUserEmail(data.email)
    setIsLoggedIn(true)
    setIsRegisterModalOpen(false)
    if (typeof window !== 'undefined') {
      localStorage.setItem('isLoggedIn', 'true')
    }
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.warn("Sign out error (mungkin sesi expired):", error)
    } finally {
      // Pastikan state lokal dibersihkan apapun yang terjadi
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

  // FUNGSI PINTAR: SMART DASHBOARD REDIRECT (Versi Stabil)
  const handleDashboardClick = async () => {
    if (isLoadingRole) return; // Cegah klik ganda saat loading
    
    try {
      // 1. Ambil session fresh langsung dari Supabase
      const { data, error } = await supabase.auth.getSession();
      
      // Cek jika ada error atau tidak ada session
      if (error || !data?.session) {
        window.location.href = '/auth/signin';
        return;
      }

      const session = data.session;

      // 2. Ambil role dari database
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      // Jika gagal ambil profile, amanannya kembali ke home
      if (profileError || !profileData) {
        window.location.href = '/';
        return;
      }

      const role = profileData.role || 'user';

      // 3. Hard redirect berdasarkan role
      switch (role) {
        case 'super_admin':
          window.location.href = '/dashboard/super-admin';
          break;
        case 'admin_sales':
          window.location.href = '/dashboard/sales';
          break;
        case 'admin_logistik':
          window.location.href = '/dashboard/logistik';
          break;
        case 'admin_data':
          window.location.href = '/dashboard/data';
          break;
        default:
          window.location.href = '/dashboard/user';
          break;
      }
    } catch (err) {
      console.error("Dashboard click error:", err);
      // Fallback ke home jika ada error tak terduga
      window.location.href = '/';
    }
  };

  const maskEmail = (email: string) => {
    if (!email) return ''
    const [localPart, domain] = email.split('@')
    return `${localPart.charAt(0)}***@***.${domain.split('.')[1]}`
  }

  const navLinks = [
    { href: '#products', label: 'Products' },
    { href: '#solutions', label: 'Auctions' },
    { href: '#contact', label: 'Contact' },
  ]

  return (
    <nav className="fixed top-0 w-full z-50 backdrop-blur-lg bg-background/80 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="#" className="flex items-center space-x-2 group">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent hidden sm:inline">
              Solar Nusantara
            </span>
          </Link>

          {/* Desktop Navigation */}
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

          {/* Right Side Actions */}
          <div className="hidden md:flex items-center space-x-4">
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
                <span className="text-sm text-foreground/70 font-medium">
                  {maskEmail(userEmail)}
                </span>
                
                {/* TOMBOL DASHBOARD PINTAR */}
                <Button
                  size="sm"
                  onClick={handleDashboardClick}
                  disabled={isLoadingRole}
                  className="bg-primary hover:bg-primary/90 text-white rounded-lg min-w-[120px]"
                >
                  {isLoadingRole ? (
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

          {/* Mobile Menu Button */}
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

        {/* Mobile Menu */}
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
            <div className="px-4 pt-4 space-y-2">
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
                      className="flex-1 text-foreground/60 cursor-default text-xs"
                    >
                      {maskEmail(userEmail)}
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    {/* TOMBOL DASHBOARD PINTAR (MOBILE) */}
                    <Button
                      size="sm"
                      onClick={() => {
                        handleDashboardClick()
                        setIsOpen(false)
                      }}
                      disabled={isLoadingRole}
                      className="flex-1 bg-primary hover:bg-primary/90 text-white text-xs"
                    >
                       {isLoadingRole ? (
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
                      className="flex-1 border-foreground/30 text-foreground"
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

      {/* Auth Modals */}
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