'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HeroProps {
  isLoggedIn?: boolean
}

export function Hero({ isLoggedIn: initialIsLoggedIn }: HeroProps) {
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(initialIsLoggedIn ?? false)

  // Listen for localStorage changes to sync login state
  useEffect(() => {
    const syncLoginState = () => {
      const loggedIn = localStorage.getItem('isLoggedIn') === 'true'
      setIsLoggedIn(loggedIn)
    }

    // Initial sync
    syncLoginState()

    // Listen to storage changes (from other tabs/windows)
    window.addEventListener('storage', syncLoginState)

    // Also check periodically in case the navbar updated without storage event
    const interval = setInterval(syncLoginState, 500)

    return () => {
      window.removeEventListener('storage', syncLoginState)
      clearInterval(interval)
    }
  }, [])

  const handleRestrictedClick = () => {
    if (!isLoggedIn) {
      setShowLoginPrompt(true)
      setTimeout(() => setShowLoginPrompt(false), 3000)
    }
  }

        {/* Main Headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-tight">
          <span className="block text-foreground">Powering Indonesia's</span>
          <span className="block text-primary">Industrial Future</span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-foreground/70 mb-12 max-w-3xl mx-auto leading-relaxed">
          Enterprise-grade solar energy solutions designed for businesses. Reduce operational costs, maximize energy efficiency, and accelerate your sustainable growth.
        </p>

        {/* Search Bar - Prominently Below Headline */}
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
          {isLoggedIn ? (
            <Link href="/catalog">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white rounded-lg text-base font-semibold px-8"
              >
                View Products
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          ) : (
            <Button
              size="lg"
              disabled
              className="bg-foreground/20 text-foreground/50 cursor-not-allowed rounded-lg text-base font-semibold px-8"
              onClick={handleRestrictedClick}
            >
              View Products
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          )}
          <Button
            size="lg"
            disabled={!isLoggedIn}
            variant="outline"
            className={`rounded-lg text-base font-semibold ${
              isLoggedIn
                ? 'border-foreground/30 hover:bg-foreground/5 bg-transparent text-foreground'
                : 'border-foreground/15 bg-transparent text-foreground/50 cursor-not-allowed'
            }`}
            onClick={!isLoggedIn ? handleRestrictedClick : undefined}
          >
            Request for Quotation
          </Button>
        </div>

        {/* Login Required Popup */}
        {showLoginPrompt && (
          <div className="fixed top-24 left-1/2 transform -translate-x-1/2 bg-destructive/90 text-white px-6 py-3 rounded-lg shadow-lg z-40 animate-pulse">
            Please log in first!
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
