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
      className="relative py-28 px-4 md:px-8 bg-gradient-to-b from-muted/20 to-background"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-20">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            About Solar Nusantara
          </h2>
          <p className="text-foreground/70 text-lg max-w-3xl mx-auto font-medium">
            Pioneering enterprise solar solutions across Southeast Asia for over 18 years with proven track record in industrial-scale renewable energy deployment.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-12 mb-20 items-center">
          {/* Left Column - Visual */}
          <div className="relative h-96 bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 rounded-3xl border-2 border-primary/20 overflow-hidden flex items-center justify-center shadow-xl">
            <div className="absolute inset-0 flex items-center justify-center gap-12">
              <Sun className="h-28 w-28 text-primary/50 animate-pulse" />
              <Leaf className="h-24 w-24 text-secondary/50" />
            </div>
          </div>

          {/* Right Column - Text */}
          <div>
            <h3 className="text-3xl font-bold mb-6 text-foreground">Our Mission</h3>
            <p className="text-foreground/70 mb-4 leading-relaxed">
              Solar Nusantara is dedicated to making enterprise solar energy accessible, affordable, and reliable for businesses across Southeast Asia with cutting-edge technology.
            </p>
            <p className="text-foreground/70 mb-8 leading-relaxed">
              With over 18 years of industry experience, we've deployed 2.5GW of solar capacity, partnered with 250+ enterprises, and consistently delivered 40% average cost savings for clients across industrial and commercial sectors.
            </p>

            <div className="space-y-4">
              {[
                'ISO 9001 & ISO 14001 Certified',
                'Industry leader in safety standards',
                'Award-winning enterprise support',
                'Partnerships with global manufacturers',
              ].map((item, idx) => (
                <div key={idx} className="flex items-center space-x-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-accent" />
                  <span className="text-foreground/80 font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Core Values */}
        <div className="grid md:grid-cols-4 gap-6 mb-20">
          {values.map((value, idx) => {
            const Icon = value.icon
            return (
              <div
                key={idx}
                className="bg-card/60 border-2 border-border hover:border-secondary/40 rounded-2xl p-6 hover:shadow-lg hover:shadow-secondary/10 transition-all duration-300"
              >
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-xl bg-gradient-to-br from-secondary to-accent mb-5 shadow-md">
                  <Icon className="h-7 w-7 text-white" />
                </div>
                <h4 className="font-bold mb-3 text-foreground text-lg">{value.title}</h4>
                <p className="text-sm text-foreground/70 leading-relaxed">{value.description}</p>
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
            <div key={idx} className="text-center p-8 bg-gradient-to-br from-card/80 to-card/60 border-2 border-border hover:border-primary/30 rounded-2xl hover:shadow-lg transition-all duration-200">
              <div className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-3">
                {stat.number}
              </div>
              <p className="text-foreground/70 font-semibold text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
