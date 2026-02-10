'use client'

import { Mail, Phone, MapPin, ArrowRight, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ContactFooter() {
  return (
    <>
      {/* Contact Section */}
      <section
        id="contact"
        className="relative py-24 px-4 md:px-8"
      >
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 text-foreground">
              Get In Touch
            </h2>
            <p className="text-foreground/70 text-lg max-w-2xl mx-auto">
              Connect with our enterprise team to discuss your solar energy requirements and get a custom solution tailored to your business.
            </p>
          </div>

          {/* Contact Methods */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[
              {
                icon: Mail,
                title: 'Email',
                value: 'enterprise@solarnusantara.com',
                desc: 'Response within 24 hours',
              },
              {
                icon: Phone,
                title: 'Phone',
                value: '+62 (021) 555-0123',
                desc: 'Available Mon-Fri, 9AM-6PM WIB',
              },
              {
                icon: MapPin,
                title: 'Office',
                value: 'Jakarta, Indonesia',
                desc: 'Regional presence across SE Asia',
              },
            ].map((contact, idx) => {
              const Icon = contact.icon
              return (
                <div
                  key={idx}
                  className="bg-card/50 border border-foreground/15 rounded-xl p-8 text-center hover:border-primary/50 transition-colors"
                >
                  <div className="inline-flex items-center justify-center h-14 w-14 rounded-lg bg-primary/10 mb-4">
                    <Icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-bold mb-2 text-foreground">{contact.title}</h3>
                  <p className="text-foreground/80 font-semibold mb-1 text-sm">
                    {contact.value}
                  </p>
                  <p className="text-sm text-foreground/60">{contact.desc}</p>
                </div>
              )
            })}
          </div>

          {/* Contact Form */}
          <div className="max-w-2xl mx-auto bg-card/50 border border-foreground/15 rounded-2xl p-8 md:p-12">
            <form className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <input
                  type="text"
                  placeholder="Full Name"
                  className="px-4 py-3 rounded-lg bg-background/30 border border-foreground/20 focus:border-primary/50 focus:outline-none text-foreground placeholder-foreground/50"
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  className="px-4 py-3 rounded-lg bg-background/30 border border-foreground/20 focus:border-primary/50 focus:outline-none text-foreground placeholder-foreground/50"
                />
              </div>
              <input
                type="text"
                placeholder="Company Name"
                className="w-full px-4 py-3 rounded-lg bg-background/30 border border-foreground/20 focus:border-primary/50 focus:outline-none text-foreground placeholder-foreground/50"
              />
              <textarea
                placeholder="Describe your energy requirements and business type..."
                rows={4}
                className="w-full px-4 py-3 rounded-lg bg-background/30 border border-foreground/20 focus:border-primary/50 focus:outline-none text-foreground placeholder-foreground/50 resize-none"
              />
              <Button className="w-full bg-primary hover:bg-primary/90 text-white rounded-lg font-semibold">
                Submit Inquiry
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card/50 border-t border-foreground/15 py-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Footer Grid */}
          <div className="grid md:grid-cols-5 gap-8 mb-12">
            {/* Company Info */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-foreground">Solar Nusantara</span>
              </div>
              <p className="text-sm text-foreground/60">
                Enterprise renewable energy solutions across Southeast Asia.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                {['About', 'Careers', 'Blog', 'Press'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-foreground/60 hover:text-foreground transition">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Products */}
            <div>
              <h4 className="font-bold mb-4">Products</h4>
              <ul className="space-y-2 text-sm">
                {['Solar Panels', 'Inverters', 'Battery Storage', 'Monitoring'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-foreground/60 hover:text-foreground transition">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-bold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                {['Documentation', 'FAQ', 'Support', 'Contact'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-foreground/60 hover:text-foreground transition">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                {['Privacy', 'Terms', 'Cookies', 'Security'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-foreground/60 hover:text-foreground transition">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="border-t border-foreground/10 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-foreground/60">
            <p>&copy; 2024 Solar Nusantara. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              {['Twitter', 'LinkedIn', 'Facebook'].map((social) => (
                <a key={social} href="#" className="hover:text-foreground transition">
                  {social}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
