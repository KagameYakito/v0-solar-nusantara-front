'use client'

import { Users, Globe, Award, Zap, Sun, Leaf } from 'lucide-react'

export function About() {
  const values = [
    {
      icon: Zap,
      title: 'Innovation',
      description: 'Cutting-edge technology for tomorrow\'s energy needs',
    },
    {
      icon: Globe,
      title: 'Sustainability',
      description: 'Committed to reducing carbon footprint globally',
    },
    {
      icon: Award,
      title: 'Quality',
      description: 'Industry-leading standards and certifications',
    },
    {
      icon: Users,
      title: 'Partnership',
      description: 'Long-term relationships with our enterprise clients',
    },
  ]

  return (
    <section
      id="about"
      className="relative py-24 px-4 md:px-8"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 text-foreground">
            About Solar Nusantara
          </h2>
          <p className="text-foreground/70 text-lg max-w-3xl mx-auto">
            Pioneering enterprise solar solutions across Southeast Asia for over 18 years with proven track record in industrial-scale renewable energy deployment.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-12 mb-16 items-center">
          {/* Left Column - Visual */}
          <div className="relative h-80 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl border border-primary/20 overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 flex items-center justify-center gap-8">
              <Sun className="h-24 w-24 text-primary/40 animate-pulse" />
              <Leaf className="h-20 w-20 text-secondary/40" />
            </div>
          </div>

          {/* Right Column - Text */}
          <div>
            <h3 className="text-3xl font-bold mb-6 text-foreground">Our Mission</h3>
            <p className="text-foreground/70 mb-4">
              Solar Nusantara is dedicated to making enterprise solar energy accessible, affordable, and reliable for businesses across Southeast Asia with cutting-edge technology.
            </p>
            <p className="text-foreground/70 mb-6">
              With over 18 years of industry experience, we've deployed 2.5GW of solar capacity, partnered with 250+ enterprises, and consistently delivered 40% average cost savings for clients across industrial and commercial sectors.
            </p>

            <div className="space-y-3">
              {[
                'ISO 9001 & ISO 14001 Certified',
                'Industry leader in safety standards',
                'Award-winning enterprise support',
                'Partnerships with global manufacturers',
              ].map((item, idx) => (
                <div key={idx} className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-foreground/80">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Core Values */}
        <div className="grid md:grid-cols-4 gap-6 mb-16">
          {values.map((value, idx) => {
            const Icon = value.icon
            return (
              <div
                key={idx}
                className="bg-card/50 border border-foreground/15 rounded-xl p-6 hover:border-primary/50 transition-colors"
              >
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10 mb-4">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-bold mb-2 text-foreground">{value.title}</h4>
                <p className="text-sm text-foreground/70">{value.description}</p>
              </div>
            )
          })}
        </div>

        {/* Company Statistics */}
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { number: '2.5GW', label: 'Installed Capacity' },
            { number: '250+', label: 'Enterprise Partners' },
            { number: '18+', label: 'Years Experience' },
            { number: '99.9%', label: 'System Uptime' },
          ].map((stat, idx) => (
            <div key={idx} className="text-center p-8 bg-card/40 border border-foreground/15 rounded-xl">
              <div className="text-4xl font-bold text-primary mb-2">
                {stat.number}
              </div>
              <p className="text-foreground/70 font-medium text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
