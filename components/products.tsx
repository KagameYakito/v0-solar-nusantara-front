'use client'

import { CheckCircle2, SunMedium, Activity, BatteryCharging } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/language-context'

const productIcons = [SunMedium, Activity, BatteryCharging]

export function Products() {
  const { t } = useLanguage()
  const products = t.products.items

  return (
    <section
      id="products"
      className="relative py-28 px-4 md:px-8 bg-gradient-to-b from-background to-muted/20"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-20">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            {t.products.sectionTitle}
          </h2>
          <p className="text-foreground/70 text-lg max-w-2xl mx-auto font-medium">
            {t.products.sectionDesc}
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {products.map((product, idx) => {
            const Icon = productIcons[idx]
            return (
              <div
                key={idx}
                className="group relative bg-card/60 backdrop-blur-sm border-2 border-border hover:border-primary/40 rounded-2xl p-8 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300"
              >
                {/* Icon */}
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary via-accent to-secondary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Icon className="h-8 w-8 text-white" />
                </div>

                {/* Product Name */}
                <h3 className="text-2xl font-bold mb-5 text-foreground">
                  {product.name}
                </h3>

                {/* Technical Specs */}
                <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-border">
                  <div className="bg-primary/5 rounded-lg p-3">
                    <p className="text-foreground/60 text-xs mb-1 font-semibold">{t.products.outputLabel}</p>
                    <p className="font-bold text-primary text-lg">
                      {product.power}
                    </p>
                  </div>
                  <div className="bg-secondary/5 rounded-lg p-3">
                    <p className="text-foreground/60 text-xs mb-1 font-semibold">{t.products.efficiencyLabel}</p>
                    <p className="font-bold text-secondary text-lg">
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
                      <CheckCircle2 className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Button
                  className="w-full bg-gradient-to-r from-primary/10 to-accent/10 hover:from-primary/20 hover:to-accent/20 text-primary border-2 border-primary/30 hover:border-primary/50 rounded-xl font-semibold transition-all duration-200"
                  variant="outline"
                >
                  {t.products.viewDetails}
                </Button>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
