'use client'

import React from "react"

import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AuthModalsProps {
  isLoginOpen: boolean
  isRegisterOpen: boolean
  onLoginClose: () => void
  onRegisterClose: () => void
  onLoginSubmit: (email: string, password: string) => void
  onRegisterSubmit: (data: RegistrationData) => void
}

export interface RegistrationData {
  companyName: string
  industryType: string
  contactName: string
  contactPhone: string
  companyAddress: string
  projectVolume: string
  email: string
}

export function AuthModals({
  isLoginOpen,
  isRegisterOpen,
  onLoginClose,
  onRegisterClose,
  onLoginSubmit,
  onRegisterSubmit,
}: AuthModalsProps) {
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState(false)

  const [registerData, setRegisterData] = useState<RegistrationData>({
    companyName: '',
    industryType: 'Manufaktur',
    contactName: '',
    contactPhone: '',
    companyAddress: '',
    projectVolume: '<1MW',
    email: '',
  })
  const [registerError, setRegisterError] = useState('')

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError(true)
    onLoginSubmit(loginEmail, loginPassword)
  }

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate all required fields
    if (
      !registerData.companyName ||
      !registerData.contactName ||
      !registerData.contactPhone ||
      !registerData.companyAddress ||
      !registerData.email
    ) {
      setRegisterError('Semua field harus diisi')
      return
    }

    setRegisterError('')
    onRegisterSubmit(registerData)
  }

  const handleRegisterChange = (
    field: keyof RegistrationData,
    value: string,
  ) => {
    setRegisterData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // Login Modal
  if (isLoginOpen) {
    return (
      <div>
        {/* Backdrop with blur - fixed to viewport */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999]"
          onClick={onLoginClose}
          role="presentation"
        />

        {/* Modal - centered on viewport using top/left/transform */}
        <div
          className="fixed top-1/2 left-1/2 bg-card border border-foreground/15 rounded-xl p-6 w-full max-w-sm shadow-2xl z-[10000]"
          style={{
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Close Button */}
          <button
            onClick={onLoginClose}
            className="absolute top-4 right-4 p-1.5 hover:bg-foreground/10 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 text-foreground/60" />
          </button>

          {/* Header */}
          <h2 className="text-2xl font-bold mb-1 text-foreground pr-8">
            Enterprise Log In
          </h2>
          <p className="text-sm text-foreground/60 mb-6 pr-8">
            Access your Solar Nusantara account
          </p>

          {/* Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="contact@company.com"
                className="w-full px-4 py-3 rounded-lg bg-background/50 border border-foreground/20 text-foreground placeholder-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 rounded-lg bg-background/50 border border-foreground/20 text-foreground placeholder-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            {/* Error Message */}
            {loginError && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
                akun tidak ada
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-white rounded-lg font-semibold py-3 mt-6"
            >
              Log In
            </Button>
          </form>

          {/* Footer */}
          <p className="text-sm text-foreground/60 text-center mt-4">
            Belum memiliki akun?{' '}
            <button
              onClick={() => {
                onLoginClose()
                setTimeout(() => { }, 100)
              }}
              className="text-primary hover:underline font-medium"
            >
              Daftar di sini
            </button>
          </p>
        </div>
      </div>
    )
  }

  // Register Modal
  if (isRegisterOpen) {
    return (
      <div>
        {/* Backdrop with blur - fixed to viewport */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999]"
          onClick={onRegisterClose}
          role="presentation"
        />

        {/* Modal - centered on viewport using top/left/transform */}
        <div
          className="fixed top-1/2 left-1/2 bg-card border border-foreground/15 rounded-xl p-6 w-full max-w-sm shadow-2xl max-h-[90vh] overflow-y-auto z-[10000]"
          style={{
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Close Button */}
          <button
            onClick={onRegisterClose}
            className="absolute top-4 right-4 p-1.5 hover:bg-foreground/10 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 text-foreground/60" />
          </button>

          {/* Header */}
          <h2 className="text-2xl font-bold mb-1 text-foreground pr-8">
            B2B Registration
          </h2>
          <p className="text-sm text-foreground/60 mb-6 pr-8">
            Daftar akun perusahaan Anda untuk mengakses solusi solar enterprise
          </p>

          {/* Form */}
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            {/* Company Name */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Nama Perusahaan *
              </label>
              <input
                type="text"
                value={registerData.companyName}
                onChange={(e) =>
                  handleRegisterChange('companyName', e.target.value)
                }
                placeholder="PT. Maju Jaya"
                className="w-full px-4 py-3 rounded-lg bg-background/50 border border-foreground/20 text-foreground placeholder-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            {/* Industry Type */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Jenis Industri *
              </label>
              <select
                value={registerData.industryType}
                onChange={(e) =>
                  handleRegisterChange('industryType', e.target.value)
                }
                className="w-full px-4 py-3 rounded-lg bg-background/50 border border-foreground/20 text-foreground focus:outline-none focus:border-primary/50 transition-colors appearance-none"
              >
                <option value="Manufaktur">Manufaktur</option>
                <option value="EPC Contractor">EPC Contractor</option>
                <option value="PLN">PLN</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            {/* Contact Name */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Kontak Utama (Nama) *
              </label>
              <input
                type="text"
                value={registerData.contactName}
                onChange={(e) => handleRegisterChange('contactName', e.target.value)}
                placeholder="Nama lengkap"
                className="w-full px-4 py-3 rounded-lg bg-background/50 border border-foreground/20 text-foreground placeholder-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            {/* Contact Phone */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Nomor WhatsApp *
              </label>
              <input
                type="tel"
                value={registerData.contactPhone}
                onChange={(e) =>
                  handleRegisterChange('contactPhone', e.target.value)
                }
                placeholder="+62 812 3456 7890"
                className="w-full px-4 py-3 rounded-lg bg-background/50 border border-foreground/20 text-foreground placeholder-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            {/* Company Address */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Alamat Perusahaan *
              </label>
              <textarea
                value={registerData.companyAddress}
                onChange={(e) =>
                  handleRegisterChange('companyAddress', e.target.value)
                }
                placeholder="Jl. Merdeka No. 123, Jakarta"
                rows={3}
                className="w-full px-4 py-3 rounded-lg bg-background/50 border border-foreground/20 text-foreground placeholder-foreground/50 focus:outline-none focus:border-primary/50 transition-colors resize-none"
              />
            </div>

            {/* Project Volume */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Volume Proyek Tahunan *
              </label>
              <select
                value={registerData.projectVolume}
                onChange={(e) =>
                  handleRegisterChange('projectVolume', e.target.value)
                }
                className="w-full px-4 py-3 rounded-lg bg-background/50 border border-foreground/20 text-foreground focus:outline-none focus:border-primary/50 transition-colors appearance-none"
              >
                <option value="<1MW">&lt;1MW</option>
                <option value="1-5MW">1-5MW</option>
                <option value=">5MW">&gt;5MW</option>
              </select>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email Perusahaan *
              </label>
              <input
                type="email"
                value={registerData.email}
                onChange={(e) => handleRegisterChange('email', e.target.value)}
                placeholder="contact@company.com"
                className="w-full px-4 py-3 rounded-lg bg-background/50 border border-foreground/20 text-foreground placeholder-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            {/* Error Message */}
            {registerError && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
                {registerError}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-white rounded-lg font-semibold py-3 mt-6"
            >
              Create Account
            </Button>
          </form>

          {/* Footer */}
          <p className="text-xs text-foreground/60 text-center mt-4">
            Dengan mendaftar, Anda menyetujui Ketentuan Layanan kami
          </p>
        </div>
      </div>
    )
  }

  return null
}
