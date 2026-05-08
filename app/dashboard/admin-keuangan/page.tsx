'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { 
  ArrowLeft, AlertCircle, Loader2, Banknote, CheckCircle, Clock, 
  DollarSign, TrendingUp, RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface PaymentRecord {
  rfq_code: string
  user_name: string
  company_name: string
  payment_date: string
  total_payment: number
  status: 'lunas' | 'menunggu'
}

const formatRupiah = (amount: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)

export default function AdminKeuanganDashboard() {
  const [loading, setLoading] = useState(true)
  const [dataLoading, setDataLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [payments, setPayments] = useState<PaymentRecord[]>([])

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
            rfq_code: `RFQ-${item.request_id}`,
            user_name: profile?.full_name || 'Unknown',
            company_name: profile?.company_name || '-',
            payment_date: item.created_at,
            total_payment: itemTotal,
            status: item.status === 'deal' ? 'lunas' : 'menunggu',
          })
        } else {
          const existing = groupedMap.get(key)!
          existing.total_payment += itemTotal
          // If any item is still 'accepted', mark group as menunggu
          if (item.status === 'accepted') existing.status = 'menunggu'
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
        await fetchPayments()
      } catch (err: any) {
        if (isMounted) setError(err.message)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    checkAuth()
    return () => { isMounted = false }
  }, [fetchPayments])

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

      {/* PAYMENT TABLE */}
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
                  <th className="px-4 py-3">Tanggal</th>
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
                      {new Date(payment.payment_date).toLocaleDateString('id-ID', {
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
    </div>
  )
}
