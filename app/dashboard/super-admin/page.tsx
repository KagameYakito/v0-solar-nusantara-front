// app/dashboard/super-admin/page.tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import Link from 'next/link' // <--- IMPORT BARU DITAMBAHKAN
import { Users, Shield, AlertCircle, Loader2, ArrowLeft } from 'lucide-react' // <--- ArrowLeft ditambahkan
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface UserProfile {
  id: string
  email: string | null
  role: string
  created_at: string
}

// PINDAHKAN SUPABASE CLIENT KE LUAR KOMPONEN AGAR STABIL
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function SuperAdminDashboard() {
  const router = useRouter()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthorized, setIsAuthorized] = useState(false)

  // Fungsi untuk mengambil data user
  const fetchUsers = useCallback(async () => {
    try {
      console.log("🔍 [DEBUG] Mulai mengambil data user dari database...");
      
      const response = await supabase
        .from('profiles')
        .select('id, email, role, created_at')
        .order('created_at', { ascending: false })
      
      if (response.error) {
        console.error("❌ [DEBUG] Error dari Supabase:", response.error);
        throw response.error;
      }
      
      console.log("✅ [DEBUG] Data berhasil diambil!");
      console.log("📊 [DEBUG] Jumlah user ditemukan:", response.data?.length);
      console.log("📋 [DEBUG] Detail data user:", response.data); 
      
      setUsers(response.data || [])
    } catch (err: any) {
      console.error("❌ [DEBUG] Gagal mengambil data user:", err)
      setError("Gagal memuat data dari database: " + err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Efek utama: Cek Auth & Load Data
    useEffect(() => {
    let isMounted = true
    let timeoutId: NodeJS.Timeout | null = null

    const checkAuthAndLoad = async () => {
      try {
        // Buat promise timeout 5 detik
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Session check timeout')), 5000)
        })

        // Race antara getSession dan timeout
        const sessionResponse: any = await Promise.race([
          supabase.auth.getSession(),
          timeoutPromise
        ])

        if (timeoutId) clearTimeout(timeoutId)
        if (!isMounted) return
        
        // Jika session invalid/expired, HARD redirect ke login
        if (sessionResponse.error || !sessionResponse.data.session) {
          console.warn("⚠️ Session invalid/expired, hard redirect to login...")
          window.location.href = '/auth/signin'
          return
        }

        const session = sessionResponse.data.session

        const profileResponse = await supabase.from('profiles').select('role').eq('id', session.user.id).single()

        if (!isMounted) return

        if (profileResponse.error) {
          console.error("❌ Profile fetch failed:", profileResponse.error)
          window.location.href = '/'
          return
        }

        const profile = profileResponse.data

        if (!profile || profile.role !== 'super_admin') {
          console.warn("🚫 Access Denied: Not Super Admin")
          window.location.href = '/'
          return
        }

        if (isMounted) {
          setIsAuthorized(true)
          await fetchUsers()
        }

      } catch (err: any) {
        console.error("💥 Critical Auth Error:", err.message)
        if (isMounted) {
          setLoading(false)
          // Hard redirect ke login jika ada error kritis/timeout
          window.location.href = '/auth/signin'
        }
      }
    }

    checkAuthAndLoad()

    return () => {
      isMounted = false
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [router, fetchUsers])

  // Fungsi Ganti Role
  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!confirm(`Yakin ingin mengubah role user ini menjadi ${newRole}?`)) return;

    try {
      const response = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)

      if (response.error) throw response.error

      alert("✅ Berhasil! Role user telah diubah.")
      await fetchUsers() // Refresh data
    } catch (err: any) {
      alert("❌ Gagal mengubah role: " + err.message)
    }
  }

  // --- RENDERING ---

  if (loading && !error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2">Memverifikasi Akses & Memuat Data...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-4">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Terjadi Kesalahan</h2>
        <p className="text-slate-400 mb-4 max-w-md text-center">{error}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition">
          Coba Lagi
        </button>
      </div>
    )
  }

  if (!isAuthorized) return null

  return (
    <div className="p-8 space-y-6 bg-slate-950 min-h-screen text-slate-100">
      {/* HEADER YANG SUDAH DI-UPDATE DENGAN TOMBOL BACK */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-4">
          
          {/* TOMBOL BACK TO HOME */}
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

          {/* JUDUL DASHBOARD */}
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-blue-500">
              <Shield className="h-8 w-8" />
              Super Admin Control Panel
            </h1>
            <p className="text-slate-400 mt-1">Kelola akses dan role seluruh pengguna sistem.</p>
          </div>
        </div>

        {/* BADGE LOGIN */}
        <Badge variant="outline" className="text-blue-400 border-blue-400 px-4 py-2 bg-blue-900/20 hidden md:flex">
          Logged in as: SUPER_ADMIN
        </Badge>
      </div>

      {/* KONTEN UTAMA */}
      <Card className="bg-slate-900 border-slate-800 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Users className="h-5 w-5 text-blue-400" />
            Daftar Pengguna Terdaftar
          </CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              Belum ada pengguna terdaftar di database.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800 uppercase font-medium">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Email</th>
                    <th className="px-4 py-3">Role Saat Ini</th>
                    <th className="px-4 py-3">Terdaftar Sejak</th>
                    <th className="px-4 py-3 rounded-tr-lg text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-white">{user.email}</td>
                      <td className="px-4 py-3">
                        <Badge className={
                          user.role === 'super_admin' ? 'bg-blue-600' : 
                          user.role === 'admin_sales' ? 'bg-green-600' :
                          user.role === 'admin_logistik' ? 'bg-orange-600' :
                          user.role === 'admin_data' ? 'bg-purple-600' : 'bg-slate-600'
                        }>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          disabled={user.role === 'super_admin'} 
                          className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1 focus:outline-none focus:border-blue-500 disabled:opacity-50 cursor-pointer hover:bg-slate-700"
                        >
                          <option value="user">User Biasa</option>
                          <option value="admin_logistik">Admin Logistik</option>
                          <option value="admin_sales">Admin Sales</option>
                          <option value="admin_data">Admin Data</option>
                        </select>
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