'use client'

import { Building2, Factory, Home, TrendingUp } from 'lucide-react'

const solutions = [
  {
    icon: Building2,
    title: 'Commercial Buildings',
    description:
      'Optimize energy costs for office complexes and commercial properties with scalable solar solutions.',
    benefits: [
      'Reduce utility bills by 60-80%',
      'Tax incentives & rebates',
      'Improve property value',
    ],
  },
  {
    icon: Factory,
    title: 'Industrial Facilities',
    description:
      'Reliable energy for manufacturing and heavy-duty operations with 24/7 system monitoring.',
    benefits: [
      'Uninterrupted operations',
      'Carbon footprint reduction',
      'ROI in 5-7 years',
    ],
  },
  {
    icon: Home,
    title: 'Residential Complexes',
    description:
      'Multi-unit residential installations with shared energy management and billing systems.',
    benefits: [
      'Community energy sharing',
      'Lower resident costs',
      'Sustainable living',
    ],
  },
  {
    icon: TrendingUp,
    title: 'Smart Grid Integration',
    description:
      'Connect with smart grids and energy trading platforms for maximum efficiency and revenue.',
    benefits: [
      'Sell excess energy',
      'Real-time monitoring',
      'Predictive analytics',
    ],
  },
]

export function Solutions() {
  return (
    <section
      id="solutions"
      className="relative py-28 px-4 md:px-8"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-20">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            Industry Solutions
          </h2>
          <p className="text-foreground/70 text-lg max-w-2xl mx-auto font-medium">
            Purpose-built solar systems for commercial, industrial, and grid integration applications.
          </p>
        </div>

        {/* Solutions Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-20">
          {solutions.map((solution, idx) => {
            const Icon = solution.icon
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
            Why Solar Nusantara
          </h3>

          <div className="grid md:grid-cols-3 gap-10">
            {[
              {
                label: 'Industry Experience',
                value: '18+ Years',
                desc: 'Deep expertise in enterprise solar deployment',
              },
              {
                label: 'System Reliability',
                value: '99.9%',
                desc: 'Enterprise-grade monitoring and support',
              },
              {
                label: 'ROI Timeline',
                value: '5-7 Yrs',
                desc: 'Proven financial returns for clients',
              },
            ].map((stat, idx) => (
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
