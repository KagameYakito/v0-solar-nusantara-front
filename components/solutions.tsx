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
      className="relative py-24 px-4 md:px-8 bg-background"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Enterprise Solutions
          </h2>
          <p className="text-foreground/70 text-lg max-w-2xl mx-auto">
            Tailored solar energy solutions for every business type and scale.
          </p>
        </div>

        {/* Solutions Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {solutions.map((solution, idx) => {
            const Icon = solution.icon
            return (
              <div
                key={idx}
                className="group relative bg-card/50 backdrop-blur border border-foreground/10 rounded-2xl p-8 hover:border-primary/30 transition-all duration-300"
              >
                {/* Gradient overlay on hover */}
                <div className="absolute -inset-px bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />

                {/* Icon */}
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 mb-6 group-hover:from-primary/40 group-hover:to-secondary/40 transition-colors">
                  <Icon className="h-6 w-6 text-primary" />
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold mb-3">{solution.title}</h3>

                {/* Description */}
                <p className="text-foreground/70 mb-6">{solution.description}</p>

                {/* Benefits */}
                <ul className="space-y-3">
                  {solution.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      </div>
                      <span className="text-sm text-foreground/80">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        {/* Comparison Chart */}
        <div className="mt-20">
          <h3 className="text-3xl font-bold text-center mb-12">
            Why Choose Solar Nusantara?
          </h3>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                label: 'Industry Experience',
                value: '15+ Years',
                desc: 'Proven track record in enterprise solar',
              },
              {
                label: 'System Uptime',
                value: '99.9%',
                desc: 'Reliable 24/7 monitoring and support',
              },
              {
                label: 'Customer Satisfaction',
                value: '98%',
                desc: 'High retention and referral rate',
              },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="text-center p-8 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl border border-foreground/10"
              >
                <div className="text-4xl font-bold text-transparent bg-gradient-to-r from-primary to-secondary bg-clip-text mb-2">
                  {stat.value}
                </div>
                <div className="font-semibold text-foreground mb-2">
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
