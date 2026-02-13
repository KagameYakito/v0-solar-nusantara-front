'use client'

import { useState } from 'react'
import { AnimatedBackground } from '@/components/animated-background'
import { Navbar } from '@/components/navbar'
import { Hero } from '@/components/hero'
import { Products } from '@/components/products'
import { Solutions } from '@/components/solutions'
import { About } from '@/components/about'
import { ContactFooter } from '@/components/contact-footer'

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // Listen for login events from Navbar (we'll update this through context if needed)
  // For now, we'll use localStorage to sync state between Navbar and Hero
  const [loginState, setLoginState] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('isLoggedIn') === 'true'
    }
    return false
  })

  return (
    <div className="relative w-full overflow-hidden">
      {/* Animated background */}
      <AnimatedBackground />

      {/* Content */}
      <div className="relative z-10">
        {/* Navbar */}
        <Navbar />

        {/* Hero Section - Pass login state */}
        <Hero isLoggedIn={loginState} />

        {/* Products Section */}
        <Products />

        {/* Solutions Section */}
        <Solutions />

        {/* About Section */}
        <About />

        {/* Contact & Footer */}
        <ContactFooter />
      </div>
    </div>
  )
}
