'use client'

import { Mail, Phone, MapPin, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/language-context'

const contactIcons = [Mail, Phone, MapPin]

export function ContactFooter() {
  const { t } = useLanguage()
  const { contact } = t
  const { footer } = contact

  return (
    <>
      {/* Contact Section */}
      <section
        id="contact"
        className="relative py-28 px-4 md:px-8"
      >
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              {contact.sectionTitle}
            </h2>
            <p className="text-foreground/70 text-lg max-w-2xl mx-auto font-medium">
              {contact.sectionDesc}
            </p>
          </div>

          {/* Contact Methods */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {contact.methods.map((c, idx) => {
              const Icon = contactIcons[idx]
              return (
                <div
                  key={idx}
                  className="bg-card/60 border-2 border-border hover:border-primary/40 rounded-2xl p-8 text-center hover:shadow-lg hover:shadow-primary/10 transition-all duration-300"
                >
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-xl bg-gradient-to-br from-primary to-accent mb-5 shadow-md">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-bold mb-3 text-foreground text-lg">{c.title}</h3>
                  <p className="text-foreground/80 font-semibold mb-2 text-sm">
                    {c.value}
                  </p>
                  <p className="text-sm text-foreground/60">{c.desc}</p>
                </div>
              )
            })}
          </div>

          {/* Contact Form */}
          <div className="max-w-2xl mx-auto bg-gradient-to-br from-card/80 to-card/60 border-2 border-border rounded-3xl p-8 md:p-12 shadow-xl">
            <form className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <input
                  type="text"
                  placeholder={contact.form.fullName}
                  className="px-5 py-4 rounded-xl bg-background/50 border-2 border-border focus:border-primary/50 focus:outline-none text-foreground placeholder-foreground/50 transition-all duration-200"
                />
                <input
                  type="email"
                  placeholder={contact.form.email}
                  className="px-5 py-4 rounded-xl bg-background/50 border-2 border-border focus:border-primary/50 focus:outline-none text-foreground placeholder-foreground/50 transition-all duration-200"
                />
              </div>
              <input
                type="text"
                placeholder={contact.form.company}
                className="w-full px-5 py-4 rounded-xl bg-background/50 border-2 border-border focus:border-primary/50 focus:outline-none text-foreground placeholder-foreground/50 transition-all duration-200"
              />
              <textarea
                placeholder={contact.form.message}
                rows={4}
                className="w-full px-5 py-4 rounded-xl bg-background/50 border-2 border-border focus:border-primary/50 focus:outline-none text-foreground placeholder-foreground/50 resize-none transition-all duration-200"
              />
              <Button className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white rounded-xl font-semibold py-4 shadow-lg">
                {contact.form.submit}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-b from-background to-muted/20 border-t-2 border-border py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Footer Grid */}
          <div className="grid md:grid-cols-5 gap-8 mb-12">
            {/* Company Info */}
            <div>
              <div className="flex items-center space-x-3 mb-5">
                <img 
                  src="/solar-nusantara-logo.svg" 
                  alt="Solar Nusantara" 
                  className="h-10 w-auto"
                />
              </div>
              <p className="text-sm text-foreground/60 leading-relaxed">
                {footer.tagline}
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-bold mb-5 text-foreground">{footer.company}</h4>
              <ul className="space-y-3 text-sm">
                {footer.companyLinks.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-foreground/60 hover:text-primary transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Products */}
            <div>
              <h4 className="font-bold mb-5 text-foreground">{footer.products}</h4>
              <ul className="space-y-3 text-sm">
                {footer.productLinks.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-foreground/60 hover:text-secondary transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-bold mb-5 text-foreground">{footer.resources}</h4>
              <ul className="space-y-3 text-sm">
                {footer.resourceLinks.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-foreground/60 hover:text-accent transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-bold mb-5 text-foreground">{footer.legal}</h4>
              <ul className="space-y-3 text-sm">
                {footer.legalLinks.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-foreground/60 hover:text-foreground transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="border-t-2 border-border pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-foreground/60">
            <p>{footer.copyright}</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              {['Twitter', 'LinkedIn', 'Facebook'].map((social) => (
                <a key={social} href="#" className="hover:text-primary transition-colors font-medium">
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
