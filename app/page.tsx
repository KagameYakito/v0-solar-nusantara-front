import { AnimatedBackground } from '@/components/animated-background'
import { Navbar } from '@/components/navbar'
import { Hero } from '@/components/hero'
import { Products } from '@/components/products'
import { Solutions } from '@/components/solutions'
import { About } from '@/components/about'
import { ContactFooter } from '@/components/contact-footer'

export default function Home() {
  return (
    <div className="relative w-full overflow-hidden">
      {/* Animated background */}
      <AnimatedBackground />

      {/* Content */}
      <div className="relative z-10">
        {/* Navbar */}
        <Navbar />

        {/* Hero Section */}
        <Hero />

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
