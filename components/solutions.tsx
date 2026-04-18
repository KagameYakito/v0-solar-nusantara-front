'use client'

import { Building2, Factory, Home, Network, TrendingUp } from 'lucide-react'
import { useLanguage } from '@/lib/language-context'

const solutionIcons = [Building2, Factory, Home, Network]

export function Solutions() {
  const { t } = useLanguage()
  const solutions = t.solutions.items
  const stats = t.solutions.stats

  return (
    <section
      id="solutions"
      className="relative py-28 px-4 md:px-8"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-20">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            {t.solutions.sectionTitle}
          </h2>
          <p className="text-foreground/70 text-lg max-w-2xl mx-auto font-medium">
            {t.solutions.sectionDesc}
          </p>
        </div>

        {/* Solutions Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-20">
          {solutions.map((solution, idx) => {
            const Icon = solutionIcons[idx]
            return (
              <div
                key={idx}
                className="group relative bg-card/60 backdrop-blur-sm border-2 border-border hover:border-accent/40 rounded-2xl p-8 hover:shadow-xl hover:shadow-accent/10 transition-all duration-300"
              >
                {/* Icon Container */}
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-xl bg-gradient-to-br from-accent to-secondary mb-6 group-hover:shadow-lg group-hover:shadow-accent/30 transition-all duration-300">
                  <Icon className="h-8 w-8 text-white" />
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold mb-4 text-foreground">
                  {solution.title}
                </h3>

                {/* Description */}
                <p className="text-foreground/70 mb-6 leading-relaxed">
                  {solution.description}
                </p>

                {/* Benefits List */}
                <ul className="space-y-3">
                  {solution.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center mt-0.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-secondary" />
                      </div>
                      <span className="text-sm text-foreground/80 font-medium">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        {/* Key Differentiators */}
        <div className="bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5 border-2 border-border rounded-3xl p-12 shadow-lg">
          <h3 className="text-3xl font-bold text-center mb-16 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {t.solutions.whyTitle}
          </h3>

          <div className="grid md:grid-cols-3 gap-10">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center p-6 rounded-2xl bg-background/60 border border-border hover:border-primary/30 transition-all duration-200">
                <div className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
                  {stat.value}
                </div>
                <div className="font-bold text-foreground mb-3 text-lg">
                  {stat.label}
                </div>
                <p className="text-sm text-foreground/70">{stat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
