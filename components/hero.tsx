'use client'

import Link from 'next/link'
import { ArrowRight, Search, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Hero() {
  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center pt-32 px-4 pb-12"
    >
      <div className="max-w-5xl mx-auto text-center w-full">
        {/* Badge */}
        <div className="inline-flex items-center space-x-2 mb-8 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
          <Zap className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-primary">
            Enterprise Solar Solutions
          </span>
        </div>

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
          <Link href="/catalog">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-white rounded-lg text-base font-semibold px-8"
            >
              View Products
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Button
            size="lg"
            variant="outline"
            className="border-foreground/30 hover:bg-foreground/5 rounded-lg text-base font-semibold bg-transparent"
          >
            Request for Quotation
          </Button>
        </div>

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
