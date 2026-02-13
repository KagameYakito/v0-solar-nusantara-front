'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, Moon, Sun, Zap, LogOut, Box } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AuthModals, type RegistrationData } from './auth-modals'

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    // Set initial theme
    const isDarkMode =
      localStorage.theme === 'dark' ||
      (!('theme' in localStorage) &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    setIsDark(isDarkMode)
  }, [])

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

  const handleLoginSubmit = (email: string, password: string) => {
    // Accept any credentials and log user in (dummy mode)
    setUserEmail(email)
    setIsLoggedIn(true)
    setIsLoginModalOpen(false)
    if (typeof window !== 'undefined') {
      localStorage.setItem('isLoggedIn', 'true')
    }
  }

  const handleRegisterSubmit = (data: RegistrationData) => {
    // Auto-login after successful registration
    setUserEmail(data.email)
    setIsLoggedIn(true)
    setIsRegisterModalOpen(false)
    if (typeof window !== 'undefined') {
      localStorage.setItem('isLoggedIn', 'true')
    }
  }

  const handleSignOut = () => {
    setIsLoggedIn(false)
    setUserEmail('')
    setIsLoginModalOpen(false)
    setIsRegisterModalOpen(false)
    if (typeof window !== 'undefined') {
      localStorage.setItem('isLoggedIn', 'false')
    }
  }

  const maskEmail = (email: string) => {
    if (!email) return ''
    const [localPart, domain] = email.split('@')
    return `${localPart.charAt(0)}***@***.${domain.split('.')[1]}`
  }

  const navLinks = [
    { href: '#home', label: 'Home' },
    { href: '#products', label: 'Products' },
    { href: '#solutions', label: 'Solutions' },
    { href: '#about', label: 'About' },
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
                  onClick={() => setIsLoginModalOpen(true)}
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
                <Button
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-white rounded-lg"
                >
                  <Box className="h-4 w-4 mr-2" />
                  Dashboard
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
                        setIsLoginModalOpen(true)
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
                    <Button
                      size="sm"
                      className="flex-1 bg-primary hover:bg-primary/90 text-white text-xs"
                    >
                      <Box className="h-4 w-4 mr-1" />
                      Dashboard
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
