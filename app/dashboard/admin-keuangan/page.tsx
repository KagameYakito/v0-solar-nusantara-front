'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { 
  ArrowLeft, AlertCircle, Loader2, Banknote, CheckCircle, Clock, 
  DollarSign, TrendingUp, RefreshCw, QrCode, Upload, Save, Trash2, Settings, List
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { generateDynamicQris, isValidQris } from '@/lib/qris'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface PaymentRecord {
  rfq_code: string
  user_name: string
  company_name: string
  transaction_date: string
  total_payment: number
  status: 'lunas' | 'menunggu'
}

interface QrisSettings {
  id?: string
  static_qris: string
  merchant_name: string
  is_active: boolean
}

const formatRupiah = (amount: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)

export default function AdminKeuanganDashboard() {
  const [loading, setLoading] = useState(true)
  const [dataLoading, setDataLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [payments, setPayments] = useState<PaymentRecord[]>([])

  // QRIS state
  const [qrisSettings, setQrisSettings] = useState<QrisSettings>({ static_qris: '', merchant_name: '', is_active: true })
  const [qrisSaving, setQrisSaving] = useState(false)
  const [qrisLoading, setQrisLoading] = useState(false)
  const [qrisError, setQrisError] = useState<string | null>(null)
  const [qrisSuccess, setQrisSuccess] = useState(false)
  const [qrisPreviewUrl, setQrisPreviewUrl] = useState<string | null>(null)
  const [testAmount, setTestAmount] = useState('100000')
  const [generatedQris, setGeneratedQris] = useState<string | null>(null)
  const [generatedQrUrl, setGeneratedQrUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchPayments = useCallback(async () => {
    try {
      setDataLoading(true)

      // Fetch wishlists with deal (lunas) or accepted (menunggu bayar) status
      const { data: wishlistData, error: wishlistError } = await supabase
        .from('wishlists')
        .select('user_id, request_id, price, quantity, status, created_at')
        .in('status', ['deal', 'accepted'])
        .not('request_id', 'is', null)
        .order('created_at', { ascending: false })

      if (wishlistError) throw wishlistError
      if (!wishlistData || wishlistData.length === 0) {
        setPayments([])
        return
      }

      // Fetch user profiles
      const userIds = [...new Set(wishlistData.map((w: any) => w.user_id))]
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, company_name')
        .in('id', userIds)

      // Group by request_id — sum totals per RFQ
      const groupedMap = new Map<number, PaymentRecord>()
      wishlistData.forEach((item: any) => {
        const profile = profilesData?.find((p: any) => p.id === item.user_id)
        const key: number = item.request_id
        const itemTotal = (item.price || 0) * (item.quantity || 1)

        if (!groupedMap.has(key)) {
          groupedMap.set(key, {
            rfq_code: `RFQ-${String(item.request_id).padStart(8, '0')}`,
            user_name: profile?.full_name || 'Unknown',
            company_name: profile?.company_name || '-',
            transaction_date: item.created_at,
            total_payment: itemTotal,
            // 'deal' means completed/paid; once lunas it cannot be downgraded
            status: item.status === 'deal' ? 'lunas' : 'menunggu',
          })
        } else {
          const existing = groupedMap.get(key)!
          existing.total_payment += itemTotal
          // A group is lunas only when a deal item is found; never downgrade lunas → menunggu
          if (item.status === 'deal') existing.status = 'lunas'
        }
      })

      setPayments(Array.from(groupedMap.values()))
    } catch (err: any) {
      console.error('Failed to fetch payments:', err)
      setError('Gagal memuat data pembayaran: ' + err.message)
    } finally {
      setDataLoading(false)
    }
  }, [])

  // ── QRIS functions ─────────────────────────────────────────────────────────

  const fetchQrisSettings = useCallback(async () => {
    try {
      setQrisLoading(true)
      const { data, error } = await supabase
        .from('payment_settings')
        .select('*')
        .eq('setting_type', 'qris')
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      if (data) {
        setQrisSettings({ id: data.id, static_qris: data.static_qris || '', merchant_name: data.merchant_name || '', is_active: data.is_active })
      }
    } catch (err: any) {
      console.error('Failed to fetch QRIS settings:', err)
    } finally {
      setQrisLoading(false)
    }
  }, [])

  /** Read a QR code from an uploaded image using jsQR */
  const handleQrisImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setQrisError(null)

    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        const imageData = ev.target?.result as string
        setQrisPreviewUrl(imageData)

        // Dynamically import jsQR (client-only)
        const jsQR = (await import('jsqr')).default
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext('2d')!
          ctx.drawImage(img, 0, 0)
          const imageDataObj = ctx.getImageData(0, 0, img.width, img.height)
          const code = jsQR(imageDataObj.data, imageDataObj.width, imageDataObj.height)
          if (code) {
            setQrisSettings(prev => ({ ...prev, static_qris: code.data }))
            setQrisError(null)
          } else {
            setQrisError('QR code tidak terdeteksi. Pastikan gambar jelas dan merupakan QRIS yang valid.')
          }
        }
        img.src = imageData
      } catch (err: any) {
        setQrisError('Gagal membaca QR: ' + err.message)
      }
    }
    reader.readAsDataURL(file)
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSaveQris = async () => {
    setQrisError(null)
    const trimmedQris = qrisSettings.static_qris.trim()
    if (!trimmedQris) {
      setQrisError('String QRIS tidak boleh kosong.')
      return
    }
    if (!isValidQris(trimmedQris)) {
      setQrisError('Format QRIS tidak valid. Pastikan data dimulai dengan 000201 dan mengandung tag 6304.')
      return
    }

    try {
      setQrisSaving(true)
      const payload = {
        setting_type: 'qris',
        static_qris: trimmedQris,
        merchant_name: qrisSettings.merchant_name.trim(),
        is_active: true,
        updated_at: new Date().toISOString(),
      }

      if (qrisSettings.id) {
        const { error } = await supabase
          .from('payment_settings')
          .update(payload)
          .eq('id', qrisSettings.id)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('payment_settings')
          .insert(payload)
          .select('id')
          .single()
        if (error) throw error
        setQrisSettings(prev => ({ ...prev, id: data.id }))
      }

      setQrisSuccess(true)
      setTimeout(() => setQrisSuccess(false), 3000)
    } catch (err: any) {
      setQrisError('Gagal menyimpan: ' + err.message)
    } finally {
      setQrisSaving(false)
    }
  }

  const handleDeleteQris = async () => {
    if (!qrisSettings.id) return
    if (!confirm('Hapus setting QRIS ini?')) return
    try {
      const { error } = await supabase.from('payment_settings').delete().eq('id', qrisSettings.id)
      if (error) throw error
      setQrisSettings({ static_qris: '', merchant_name: '', is_active: true })
      setQrisPreviewUrl(null)
      setGeneratedQris(null)
      setGeneratedQrUrl(null)
    } catch (err: any) {
      alert('Gagal hapus: ' + err.message)
    }
  }

  const handleGenerateTest = async () => {
    setQrisError(null)
    const trimmedQris = qrisSettings.static_qris.trim()
    if (!trimmedQris || !isValidQris(trimmedQris)) {
      setQrisError('Simpan QRIS yang valid terlebih dahulu.')
      return
    }
    const amount = parseInt(testAmount.replace(/\D/g, ''))
    if (isNaN(amount) || amount <= 0) {
      setQrisError('Masukkan jumlah yang valid.')
      return
    }
    try {
      const dynamic = generateDynamicQris(trimmedQris, amount)
      setGeneratedQris(dynamic)

      // Generate QR image
      const QRCode = (await import('qrcode')).default
      const url = await QRCode.toDataURL(dynamic, { width: 300, margin: 1, color: { dark: '#000000', light: '#ffffff' } })
      setGeneratedQrUrl(url)
    } catch (err: any) {
      setQrisError('Gagal generate QRIS: ' + err.message)
    }
  }

  // ── Auth effect ────────────────────────────────────────────────────────────

  useEffect(() => {
    let isMounted = true

    const checkAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError || !session) {
          window.location.href = '/auth/signin'
          return
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()

        if (profileError || !profile) {
          window.location.href = '/'
          return
        }

        if (!isMounted) return

        if (profile.role !== 'admin_keuangan' && profile.role !== 'super_admin') {
          window.location.href = '/'
          return
        }

        setIsAuthorized(true)
        await Promise.all([fetchPayments(), fetchQrisSettings()])
      } catch (err: any) {
        if (isMounted) setError(err.message)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    checkAuth()
    return () => { isMounted = false }
  }, [fetchPayments, fetchQrisSettings])

  const totalLunas = payments.filter(p => p.status === 'lunas').reduce((s, p) => s + p.total_payment, 0)
  const totalMenunggu = payments.filter(p => p.status === 'menunggu').reduce((s, p) => s + p.total_payment, 0)
  const countLunas = payments.filter(p => p.status === 'lunas').length
  const countMenunggu = payments.filter(p => p.status === 'menunggu').length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white">
        <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
        <span className="ml-2">Memverifikasi Akses...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-4">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Terjadi Kesalahan</h2>
        <p className="text-slate-400 mb-4 max-w-md text-center">{error}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-yellow-600 rounded hover:bg-yellow-700 transition">
          Coba Lagi
        </button>
      </div>
    )
  }

  if (!isAuthorized) return null

  return (
    <div className="p-8 space-y-6 bg-slate-950 min-h-screen text-slate-100">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
            title="Kembali ke Halaman Utama"
          >
            <div className="bg-slate-800 p-2 rounded-lg group-hover:bg-slate-700 transition-colors border border-slate-700">
              <ArrowLeft className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium hidden sm:inline">Back to Home</span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="bg-yellow-500/20 p-3 rounded-xl border border-yellow-500/30">
              <Banknote className="h-8 w-8 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-yellow-400">
                Dashboard Keuangan
              </h1>
              <p className="text-slate-400 mt-1">Kelola dan pantau data pembayaran aktif.</p>
            </div>
          </div>
        </div>

        <Badge variant="outline" className="text-yellow-400 border-yellow-400 px-4 py-2 bg-yellow-900/20 hidden md:flex">
          Admin Keuangan
        </Badge>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Transaksi</p>
                <p className="text-2xl font-bold text-white">{payments.length}</p>
              </div>
              <div className="bg-blue-500/20 p-3 rounded-xl">
                <TrendingUp className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Lunas ({countLunas})</p>
                <p className="text-xl font-bold text-green-400">{formatRupiah(totalLunas)}</p>
              </div>
              <div className="bg-green-500/20 p-3 rounded-xl">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Menunggu Bayar ({countMenunggu})</p>
                <p className="text-xl font-bold text-yellow-400">{formatRupiah(totalMenunggu)}</p>
              </div>
              <div className="bg-yellow-500/20 p-3 rounded-xl">
                <Clock className="h-6 w-6 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MAIN TABS */}
      <Tabs defaultValue="payments" className="w-full">
        <TabsList className="bg-slate-900 border border-slate-800 mb-4">
          <TabsTrigger value="payments" className="data-[state=active]:bg-yellow-600 data-[state=active]:text-white">
            <List className="h-4 w-4 mr-2" />
            Daftar Pembayaran
          </TabsTrigger>
          <TabsTrigger value="qris" className="data-[state=active]:bg-yellow-600 data-[state=active]:text-white">
            <QrCode className="h-4 w-4 mr-2" />
            Setting QRIS
          </TabsTrigger>
        </TabsList>

        {/* ── TAB: PAYMENT TABLE ─────────────────────────────────────────── */}
        <TabsContent value="payments">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <DollarSign className="h-5 w-5 text-yellow-400" />
                    Daftar Pembayaran Aktif
                  </CardTitle>
                  <CardDescription className="text-slate-400 mt-1">
                    Data pembayaran berdasarkan RFQ yang telah di-deal atau menunggu konfirmasi.
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={fetchPayments}
                  disabled={dataLoading}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${dataLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {dataLoading ? (
                <div className="flex items-center justify-center py-8 text-slate-400">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  Memuat data pembayaran...
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  Belum ada transaksi yang di-deal atau menunggu pembayaran.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-800 uppercase text-xs font-medium">
                      <tr>
                        <th className="px-4 py-3 rounded-tl-lg">Kode RFQ</th>
                        <th className="px-4 py-3">Nama User</th>
                        <th className="px-4 py-3">Nama Perusahaan</th>
                        <th className="px-4 py-3">Tanggal Transaksi</th>
                        <th className="px-4 py-3 text-right">Total Pembayaran</th>
                        <th className="px-4 py-3 rounded-tr-lg text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {payments.map((payment, index) => (
                        <tr key={index} className="hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="font-mono text-blue-400 border-blue-700 bg-blue-900/20">
                              {payment.rfq_code}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-white font-medium">{payment.user_name}</td>
                          <td className="px-4 py-3 text-slate-400">{payment.company_name}</td>
                          <td className="px-4 py-3 text-slate-400">
                            {new Date(payment.transaction_date).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-orange-400">
                            {formatRupiah(payment.total_payment)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {payment.status === 'lunas' ? (
                              <Badge className="bg-green-500/10 text-green-400 border border-green-500/20">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Lunas
                              </Badge>
                            ) : (
                              <Badge className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                                <Clock className="h-3 w-3 mr-1" />
                                Menunggu
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB: QRIS SETTINGS ─────────────────────────────────────────── */}
        <TabsContent value="qris">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Left panel: input & upload */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Settings className="h-5 w-5 text-yellow-400" />
                  Setting QRIS Pembayaran
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Upload gambar QRIS statis atau paste string QRIS untuk digunakan di invoice.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {qrisLoading ? (
                  <div className="flex items-center justify-center py-6 text-slate-400">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" /> Memuat pengaturan...
                  </div>
                ) : (
                  <>
                    {/* Merchant name */}
                    <div>
                      <label className="text-sm text-slate-400 block mb-1">Nama Merchant / Perusahaan</label>
                      <input
                        type="text"
                        value={qrisSettings.merchant_name}
                        onChange={(e) => setQrisSettings(p => ({ ...p, merchant_name: e.target.value }))}
                        placeholder="Solar Nusantara"
                        className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500"
                      />
                    </div>

                    {/* Upload QRIS image */}
                    <div>
                      <label className="text-sm text-slate-400 block mb-1">Upload Gambar QRIS Statis</label>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="border-slate-700 text-slate-300 hover:bg-slate-800"
                        >
                          <Upload className="h-4 w-4 mr-1" />
                          Pilih Gambar
                        </Button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleQrisImageUpload}
                        />
                        {qrisPreviewUrl && (
                          <img src={qrisPreviewUrl} alt="QRIS preview" className="h-10 w-10 object-contain rounded border border-slate-700" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Format: PNG, JPG, GIF. QR code akan di-scan otomatis.</p>
                    </div>

                    {/* Manual QRIS string input */}
                    <div>
                      <label className="text-sm text-slate-400 block mb-1">String QRIS (teks)</label>
                      <textarea
                        value={qrisSettings.static_qris}
                        onChange={(e) => setQrisSettings(p => ({ ...p, static_qris: e.target.value }))}
                        placeholder="00020101021126..."
                        rows={4}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-yellow-500 resize-none"
                      />
                      {qrisSettings.static_qris && (
                        <p className={`text-xs mt-1 ${isValidQris(qrisSettings.static_qris) ? 'text-green-400' : 'text-red-400'}`}>
                          {isValidQris(qrisSettings.static_qris) ? '✓ Format QRIS valid' : '⚠ Format QRIS tidak valid'}
                        </p>
                      )}
                    </div>

                    {/* Error / Success */}
                    {qrisError && (
                      <div className="bg-red-900/20 border border-red-700 text-red-400 text-sm px-3 py-2 rounded">
                        {qrisError}
                      </div>
                    )}
                    {qrisSuccess && (
                      <div className="bg-green-900/20 border border-green-700 text-green-400 text-sm px-3 py-2 rounded flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Pengaturan QRIS berhasil disimpan!
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={handleSaveQris}
                        disabled={qrisSaving}
                        className="bg-yellow-600 hover:bg-yellow-700 flex-1"
                      >
                        {qrisSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                        Simpan QRIS
                      </Button>
                      {qrisSettings.id && (
                        <Button
                          variant="outline"
                          onClick={handleDeleteQris}
                          className="border-red-700 text-red-400 hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Right panel: test & preview */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <QrCode className="h-5 w-5 text-yellow-400" />
                  Tes Generate QRIS Dinamis
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Generate QRIS dengan nominal tertentu untuk melihat hasilnya.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-slate-400 block mb-1">Nominal Tes (Rp)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={testAmount}
                      onChange={(e) => setTestAmount(e.target.value.replace(/\D/g, ''))}
                      placeholder="100000"
                      className="flex-1 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500"
                    />
                    <Button
                      onClick={handleGenerateTest}
                      className="bg-yellow-600 hover:bg-yellow-700"
                    >
                      Generate
                    </Button>
                  </div>
                </div>

                {generatedQrUrl && (
                  <div className="flex flex-col items-center gap-3 pt-2">
                    <div className="bg-white p-4 rounded-xl">
                      <img src={generatedQrUrl} alt="Generated QRIS" className="w-48 h-48 object-contain" />
                    </div>
                    <p className="text-xs text-slate-400 text-center">
                      {qrisSettings.merchant_name || 'QRIS'} — {formatRupiah(parseInt(testAmount || '0'))}
                    </p>
                    <p className="text-xs text-slate-500 font-mono break-all px-2 text-center">
                      {generatedQris?.substring(0, 60)}…
                    </p>
                  </div>
                )}

                {!generatedQrUrl && (
                  <div className="flex flex-col items-center justify-center py-8 text-slate-600">
                    <QrCode className="h-16 w-16 mb-3 opacity-30" />
                    <p className="text-sm">Simpan QRIS terlebih dahulu, lalu klik Generate</p>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
