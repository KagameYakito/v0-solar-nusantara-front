'use client'

import { Check, Zap } from 'lucide-react'
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
    icon: '⚡',
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
    icon: '🔄',
  },
  {
    name: 'Battery Storage',
    power: '15kWh',
    efficiency: 'N/A',
    features: [
      'Lithium-ion cells',
      'Fast charging',
      '10,000+ cycles',
      'Scalable system',
    ],
    icon: '🔋',
  },
]

export function Products() {
  return (
    <section
      id="products"
      className="relative py-24 px-4 md:px-8 bg-gradient-to-br from-background via-card/20 to-background"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Our Product Line
          </h2>
          <p className="text-foreground/70 text-lg max-w-2xl mx-auto">
            Cutting-edge solar technology designed for enterprise scale and
            reliability.
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {products.map((product, idx) => (
            <div
              key={idx}
              className="group relative bg-card/40 backdrop-blur border border-foreground/10 rounded-2xl p-8 hover:border-primary/30 transition-all duration-300 hover:shadow-xl"
            >
              {/* Gradient overlay on hover */}
              <div className="absolute -inset-px bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />

              {/* Icon */}
              <div className="text-5xl mb-4">{product.icon}</div>

              {/* Product Name */}
              <h3 className="text-xl font-bold mb-2">{product.name}</h3>

              {/* Specs */}
              <div className="flex gap-4 mb-6 text-sm text-foreground/70">
                <div>
                  <p className="text-foreground/50">Output</p>
                  <p className="font-semibold text-foreground">{product.power}</p>
                </div>
                <div>
                  <p className="text-foreground/50">Efficiency</p>
                  <p className="font-semibold text-foreground">
                    {product.efficiency}
                  </p>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {product.features.map((feature, i) => (
                  <li key={i} className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground/80">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Button */}
              <Button
                variant="outline"
                className="w-full border-foreground/20 hover:bg-primary/5 hover:border-primary/50 bg-transparent"
              >
                Learn More
              </Button>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 border border-foreground/10 rounded-3xl p-12 text-center">
          <h3 className="text-3xl font-bold mb-4">
            Ready to Transform Your Energy?
          </h3>
          <p className="text-foreground/70 mb-8 max-w-2xl mx-auto">
            Contact our enterprise team to design a custom solution for your
            business needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-primary hover:bg-primary/90 text-white rounded-full">
              Get a Quote
            </Button>
            <Button
              variant="outline"
              className="border-foreground/20 hover:bg-foreground/5 rounded-full bg-transparent"
            >
              Schedule Demo
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
