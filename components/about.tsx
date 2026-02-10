'use client'

import { Users, Globe, Award, Zap } from 'lucide-react'

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
      className="relative py-24 px-4 md:px-8 bg-gradient-to-br from-background via-card/20 to-background"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            About Solar Nusantara
          </h2>
          <p className="text-foreground/70 text-lg max-w-3xl mx-auto">
            Leading the renewable energy revolution across Southeast Asia with
            innovative solar solutions for enterprise clients.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-12 mb-16 items-center">
          {/* Left Column - Image/Visual */}
          <div className="relative h-96 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl border border-foreground/10 overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-6xl">☀️🌍</div>
            </div>
            <svg
              className="absolute inset-0 w-full h-full opacity-10"
              viewBox="0 0 400 400"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="200"
                cy="200"
                r="150"
                stroke="currentColor"
                strokeWidth="1"
              />
              <circle
                cx="200"
                cy="200"
                r="100"
                stroke="currentColor"
                strokeWidth="1"
              />
              <circle
                cx="200"
                cy="200"
                r="50"
                stroke="currentColor"
                strokeWidth="1"
              />
            </svg>
          </div>

          {/* Right Column - Text */}
          <div>
            <h3 className="text-3xl font-bold mb-6">Our Mission</h3>
            <p className="text-foreground/70 mb-4">
              Solar Nusantara is dedicated to making enterprise solar energy
              accessible, affordable, and reliable for businesses across
              Southeast Asia.
            </p>
            <p className="text-foreground/70 mb-6">
              With over 15 years of industry experience, we've installed 500+MW
              of solar capacity, helped 50+ enterprises achieve their
              sustainability goals, and generated millions in energy savings for
              our clients.
            </p>

            <div className="space-y-3">
              {[
                'ISO 9001 & ISO 14001 Certified',
                'Industry leader in safety standards',
                'Award-winning customer service',
                'Partner with global solar manufacturers',
              ].map((item, idx) => (
                <div key={idx} className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-secondary" />
                  <span className="text-foreground/80">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Values Grid */}
        <div className="grid md:grid-cols-4 gap-6">
          {values.map((value, idx) => {
            const Icon = value.icon
            return (
              <div
                key={idx}
                className="bg-card/40 backdrop-blur border border-foreground/10 rounded-xl p-6 hover:border-primary/30 transition-colors"
              >
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 mb-4">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-bold mb-2">{value.title}</h4>
                <p className="text-sm text-foreground/70">{value.description}</p>
              </div>
            )
          })}
        </div>

        {/* Team Stats */}
        <div className="grid md:grid-cols-4 gap-6 mt-16">
          {[
            { number: '500+', label: 'Projects Completed' },
            { number: '1000+', label: 'Team Members' },
            { number: '50+', label: 'Enterprise Clients' },
            { number: '5+', label: 'Countries Served' },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="text-center p-8 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl border border-foreground/10"
            >
              <div className="text-4xl font-bold text-transparent bg-gradient-to-r from-primary to-secondary bg-clip-text mb-2">
                {stat.number}
              </div>
              <p className="text-foreground/70 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
