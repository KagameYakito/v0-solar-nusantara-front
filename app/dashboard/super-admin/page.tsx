'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Users, Shield, AlertCircle, Loader2, ArrowLeft, CheckCircle, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button' // ✅ Tambah import Button

interface UserProfile {
  id: string
  email: string | null
  role: string
  created_at: string
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ✅ Opsi role yang tersedia (biar gampang update nanti)
const ROLE_OPTIONS = [
  { value: 'user', label: 'User Biasa', color: 'bg-slate-600' },
  { value: 'admin_logistik', label: 'Admin Logistik', color: 'bg-orange-600' },
  { value: 'admin_marketing', label: 'Admin Marketing', color: 'bg-green-600' },
  { value: 'admin_data', label: 'Admin Data', color: 'bg-purple-600' },
  { value: 'admin_keuangan', label: 'Admin Keuangan', color: 'bg-yellow-600' },
  { value: 'super_admin', label: 'Super Admin', color: 'bg-blue-600' },
]

export default function SuperAdminDashboard() {
  const router = useRouter()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthorized, setIsAuthorized] = useState(false)
  
  // ✅ Tambah state untuk tracking role yang sedang diubah
  const [changingRole, setChangingRole] = useState<string | null>(null)
  const [roleChangeResult, setRoleChangeResult] = useState<{id: string, success: boolean} | null>(null)

  const fetchUsers = useCallback(async () => {
    try {
      const response = await supabase
        .from('profiles')
        .select('id, email, role, created_at')
        .order('created_at', { ascending: false })
      
      if (response.error) throw response.error
      setUsers(response.data || [])
    } catch (err: any) {
      console.error("Failed to fetch users:", err)
      setError("Gagal memuat data dari database: " + err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    let timeoutId: NodeJS.Timeout | null = null

    const checkAuthAndLoad = async () => {
      try {
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Session check timeout')), 5000)
        })

        const sessionResponse: any = await Promise.race([
          supabase.auth.getSession(),
          timeoutPromise
        ])

        if (timeoutId) clearTimeout(timeoutId)
        if (!isMounted) return
        
        if (sessionResponse.error || !sessionResponse.data.session) {
          window.location.href = '/auth/signin'
          return
        }

        const session = sessionResponse.data.session
        const profileResponse = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()

        if (!isMounted) return
        if (profileResponse.error) {
          window.location.href = '/'
          return
        }

        const profile = profileResponse.data
        if (!profile || profile.role !== 'super_admin') {
          window.location.href = '/'
          return
        }

        if (isMounted) {
          setIsAuthorized(true)
          await fetchUsers()
        }
      } catch (err: any) {
        console.error("Critical Auth Error:", err.message)
        if (isMounted) {
          setLoading(false)
          window.location.href = '/auth/signin'
        }
      }
    }

    checkAuthAndLoad()

    return () => {
      isMounted = false
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [fetchUsers])

  // ✅ FUNGSI GANTI ROLE - LEBIH ROBUST
  const handleRoleChange = async (userId: string, newRole: string) => {
    const user = users.find(u => u.id === userId)
    if (!confirm(`Yakin ingin mengubah role ${user?.email || 'user ini'} dari "${user?.role}" menjadi "${newRole}"?`)) {
      // Reset dropdown ke role lama jika user cancel
      fetchUsers()
      return
    }

    setChangingRole(userId)
    setRoleChangeResult(null)

    try {
      const response = await supabase
        .from('profiles')
        .update({ 
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (response.error) throw response.error

      setRoleChangeResult({ id: userId, success: true })
      
      // ✅ Refresh data setelah berhasil
      await fetchUsers()
      
      // ✅ Clear notification setelah 3 detik
      setTimeout(() => setRoleChangeResult(null), 3000)
      
    } catch (err: any) {
      console.error("Failed to update role:", err)
      setRoleChangeResult({ id: userId, success: false })
      alert("❌ Gagal mengubah role: " + err.message)
      
      // Reset dropdown ke role lama jika gagal
      setTimeout(() => fetchUsers(), 1000)
      
    } finally {
      setChangingRole(null)
    }
  }

  // ✅ HELPER: Dapatkan warna badge berdasarkan role
  const getRoleBadgeColor = (role: string) => {
    const roleOption = ROLE_OPTIONS.find(r => r.value === role)
    return roleOption?.color || 'bg-slate-600'
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

          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-blue-500">
              <Shield className="h-8 w-8" />
              Super Admin Control Panel
            </h1>
            <p className="text-slate-400 mt-1">Kelola akses dan role seluruh pengguna sistem.</p>
          </div>
        </div>

        <Badge variant="outline" className="text-blue-400 border-blue-400 px-4 py-2 bg-blue-900/20 hidden md:flex">
          Logged in as: SUPER_ADMIN
        </Badge>
      </div>

      {/* NOTIFIKASI HASIL GANTI ROLE */}
      {roleChangeResult && roleChangeResult.success && (
        <div className="bg-green-900/30 border border-green-700 text-green-400 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          <span>Role berhasil diubah!</span>
        </div>
      )}
      
      {roleChangeResult && !roleChangeResult.success && (
        <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-lg flex items-center gap-2">
          <XCircle className="h-5 w-5" />
          <span>Gagal mengubah role. Silakan coba lagi.</span>
        </div>
      )}

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
                        <Badge className={getRoleBadgeColor(user.role)}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {new Date(user.created_at).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          disabled={changingRole === user.id || user.role === 'super_admin'}
                          className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1 focus:outline-none focus:border-blue-500 disabled:opacity-50 cursor-pointer hover:bg-slate-700 transition-colors"
                        >
                          {ROLE_OPTIONS
                            .filter(role => role.value !== 'super_admin') // User lain tidak bisa jadi super_admin dari dropdown
                            .map(role => (
                              <option key={role.value} value={role.value}>
                                {role.label}
                              </option>
                            ))
                          }
                        </select>
                        {changingRole === user.id && (
                          <Loader2 className="h-3 w-3 animate-spin text-blue-500 inline-block ml-2" />
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