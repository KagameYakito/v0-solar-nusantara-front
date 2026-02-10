'use client'

import { ArrowRight, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Hero() {
  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center pt-20 px-4"
    >
      <div className="max-w-4xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center space-x-2 mb-8 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
          <Zap className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-primary">
            Enterprise Solar Solutions
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
          <span className="block text-foreground mb-2">Harness the Power</span>
          <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
            of the Sun
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-foreground/70 mb-8 max-w-2xl mx-auto leading-relaxed">
          Transform your business with enterprise-grade solar energy solutions.
          Reduce costs, increase efficiency, and power your future with
          renewable energy.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Button
            size="lg"
            className="bg-primary hover:bg-primary/90 text-white rounded-full text-base font-semibold"
          >
            Get Started
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-foreground/20 hover:bg-foreground/5 rounded-full text-base font-semibold bg-transparent"
          >
            Watch Demo
          </Button>
        </div>

        {/* Search Section */}
        <div className="mb-16 max-w-2xl mx-auto">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition duration-300" />
            <div className="relative bg-card/50 backdrop-blur-xl border border-foreground/10 rounded-2xl p-1">
              <div className="flex items-center space-x-3 px-6 py-4">
                <svg
                  className="h-5 w-5 text-foreground/50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search solar panels, inverters, components..."
                  className="flex-1 bg-transparent text-foreground placeholder-foreground/50 focus:outline-none text-sm"
                />
                <Button
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-white rounded-full"
                >
                  Search
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
          <div className="bg-card/40 backdrop-blur border border-foreground/10 rounded-xl p-6">
            <div className="text-3xl font-bold text-primary mb-2">50+</div>
            <p className="text-sm text-foreground/70">Enterprise Clients</p>
          </div>
          <div className="bg-card/40 backdrop-blur border border-foreground/10 rounded-xl p-6">
            <div className="text-3xl font-bold text-secondary mb-2">500MW</div>
            <p className="text-sm text-foreground/70">Capacity Installed</p>
          </div>
          <div className="bg-card/40 backdrop-blur border border-foreground/10 rounded-xl p-6">
            <div className="text-3xl font-bold text-primary mb-2">30%</div>
            <p className="text-sm text-foreground/70">Cost Reduction</p>
          </div>
        </div>
      </div>
    </section>
  )
}
