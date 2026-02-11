'use client'

import { Check, Sun, Zap, Battery } from 'lucide-react'
import { Button } from '@/components/ui/button'

const products = [
  {
    name: 'Premium Solar Panels',
    power: '600W',
    efficiency: '22%',
    features: [
      'Monocrystalline cells',
      '25-year warranty',
      'Temperature resistant',
      'Industry leading efficiency',
    ],
    Icon: Sun,
  },
  {
    name: 'Smart Inverters',
    power: '10kW',
    efficiency: '98.5%',
    features: [
      'Advanced monitoring',
      'Grid compatible',
      'Battery ready',
      'Real-time analytics',
    ],
    Icon: Zap,
  },
  {
    name: 'Battery Storage',
    power: '15kWh',
    efficiency: '96%',
    features: [
      'Lithium-ion cells',
      'Fast charging',
      '10,000+ cycles',
      'Scalable system',
    ],
    Icon: Battery,
  },
]

export function Products() {
  return (
    <section
      id="products"
      className="relative py-24 px-4 md:px-8"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 text-foreground">
            Featured Products
          </h2>
          <p className="text-foreground/70 text-lg max-w-2xl mx-auto">
            Enterprise-grade solar components engineered for maximum reliability and performance at scale.
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {products.map((product, idx) => (
            <div
              key={idx}
              className="group relative bg-card/50 backdrop-blur border border-foreground/15 rounded-xl p-8 hover:border-primary/50 transition-all duration-300"
            >
              {/* Icon */}
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary to-secondary/80 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <product.Icon className="h-8 w-8 text-white" />
              </div>

              {/* Product Name */}
              <h3 className="text-2xl font-bold mb-4 text-foreground">
                {product.name}
              </h3>

              {/* Technical Specs */}
              <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-foreground/10">
                <div>
                  <p className="text-foreground/60 text-sm mb-1">Output</p>
                  <p className="font-semibold text-primary text-lg">
                    {product.power}
                  </p>
                </div>
                <div>
                  <p className="text-foreground/60 text-sm mb-1">Efficiency</p>
                  <p className="font-semibold text-primary text-lg">
                    {product.efficiency}
                  </p>
                </div>
              </div>

              {/* Features List */}
              <ul className="space-y-3 mb-8">
                {product.features.map((feature, i) => (
                  <li
                    key={i}
                    className="flex items-start space-x-3 text-foreground/80"
                  >
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Button
                className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg font-semibold"
                variant="outline"
              >
                View Details
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
