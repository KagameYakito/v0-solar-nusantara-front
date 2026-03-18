'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User, Building2, Phone, MapPin, Mail, Calendar, CheckCircle, AlertCircle, Loader2, Edit2, Save, X, Package, Gavel, History, CreditCard, FileText, ArrowLeft, ShoppingCart, Plus, Trash2, Minus, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'

interface Profile {
  id: string
  email: string | null
  full_name: string | null
  role: string | null
  company_name: string | null
  company_type: string | null
  tax_id: string | null
  company_address: string | null
  phone_number: string | null
  profile_completed: boolean | null
  created_at: string
  updated_at: string
}

interface WishlistItem {
  id: string
  product_id: string
  product_name: string
  quantity: number
  added_date: string
}

interface ProductRequest {
  id: string
  user_id: string
  items: WishlistItem[]
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function UserDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [activeTab, setActiveTab] = useState('profile')
  const [productRequests, setProductRequests] = useState<ProductRequest[]>([])
  
  // Wishlist & Modal State
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [wishlist, setWishlist] = useState<WishlistItem[]>([])
  const [submittingRequest, setSubmittingRequest] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    company_name: '',
    company_type: '',
    tax_id: '',
    company_address: '',
    phone_number: ''
  })

  // Load Wishlist from localStorage on mount
  useEffect(() => {
    const savedWishlist = localStorage.getItem('sonushub_wishlist')
    if (savedWishlist) {
      try {
        setWishlist(JSON.parse(savedWishlist))
      } catch (e) {
        console.error("Failed to parse wishlist:", e)
      }
    }
  }, [])

  // Save Wishlist to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('sonushub_wishlist', JSON.stringify(wishlist))
  }, [wishlist])

  const fetchProfile = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        window.location.href = '/auth/signin'
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error) throw error

      setProfile(data)
      setFormData({
        full_name: data.full_name || '',
        company_name: data.company_name || '',
        company_type: data.company_type || '',
        tax_id: data.tax_id || '',
        company_address: data.company_address || '',
        phone_number: data.phone_number || ''
      })
      setIsAuthorized(true)
      
    } catch (err: any) {
      console.error("Failed to fetch profile:", err)
      setError("Gagal memuat data profil: " + err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const handleSaveProfile = async () => {
    if (!profile?.id) return

    try {
      setSaving(true)

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          company_name: formData.company_name,
          company_type: formData.company_type,
          tax_id: formData.tax_id,
          company_address: formData.company_address,
          phone_number: formData.phone_number,
          profile_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)

      if (error) throw error

      setProfile(prev => prev ? { 
        ...prev, 
        ...formData, 
        profile_completed: true,
        updated_at: new Date().toISOString()
      } : null)
      setIsEditing(false)
      alert("✅ Profil berhasil diperbarui!")

    } catch (err: any) {
      alert("❌ Gagal menyimpan profil: " + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        company_name: profile.company_name || '',
        company_type: profile.company_type || '',
        tax_id: profile.tax_id || '',
        company_address: profile.company_address || '',
        phone_number: profile.phone_number || ''
      })
    }
    setIsEditing(false)
  }

  // Wishlist Functions
  const updateQuantity = (productId: string, delta: number) => {
    setWishlist(prev => prev.map(item => {
      if (item.product_id === productId) {
        const newQty = Math.max(1, item.quantity + delta)
        return { ...item, quantity: newQty }
      }
      return item
    }))
  }

  const removeItem = (productId: string) => {
    setWishlist(prev => prev.filter(item => item.product_id !== productId))
  }

  const submitRequest = async () => {
    if (wishlist.length === 0) {
      alert("❌ Wishlist kosong! Tambahkan produk dulu.")
      return
    }

    try {
      setSubmittingRequest(true)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        alert("❌ Session expired. Silakan login ulang.")
        return
      }

      // Insert request to database
      const { data, error } = await supabase
        .from('product_requests')
        .insert({
          user_id: session.user.id,
          items: wishlist,
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      // Clear wishlist after successful submission
      setWishlist([])
      setShowRequestModal(false)
      alert("✅ Permintaan produk berhasil dikirim! Tim kami akan segera memverifikasi.")

      // Refresh requests list
      fetchProductRequests(session.user.id)

    } catch (err: any) {
      console.error("Failed to submit request:", err)
      alert("❌ Gagal mengirim permintaan: " + err.message)
    } finally {
      setSubmittingRequest(false)
    }
  }

  const fetchProductRequests = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('product_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProductRequests(data || [])
    } catch (err: any) {
      console.error("Failed to fetch requests:", err)
    }
  }

  const getCompletionPercentage = () => {
    if (!profile) return 0
    const fields = [
      profile.full_name,
      profile.company_name,
      profile.company_type,
      profile.tax_id,
      profile.company_address,
      profile.phone_number
    ]
    const filled = fields.filter(f => f && f.trim() !== '').length
    return Math.round((filled / fields.length) * 100)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
        <span className="ml-2">Memuat Dashboard...</span>
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

  const completionPercentage = getCompletionPercentage()

  return (
    <div className="p-8 space-y-6 bg-slate-950 min-h-screen text-slate-100">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group">
            <div className="bg-slate-800 p-2 rounded-lg group-hover:bg-slate-700 border border-slate-700">
              <ArrowLeft className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium hidden sm:inline">Back to Home</span>
          </Link>

          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-green-500">
              <User className="h-8 w-8" />
              Dashboard User
            </h1>
            <p className="text-slate-400 mt-1">Kelola profil perusahaan dan partisipasi lelang.</p>
          </div>
        </div>

        <Badge variant="outline" className={`px-4 py-2 ${
          completionPercentage === 100 
            ? 'text-green-400 border-green-400 bg-green-900/20' 
            : 'text-orange-400 border-orange-400 bg-orange-900/20'
        }`}>
          {completionPercentage === 100 ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Profil Lengkap
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4 mr-2" />
              Profil {completionPercentage}% Lengkap
            </>
          )}
        </Badge>
      </div>

      {/* PROFILE COMPLETION ALERT */}
      {completionPercentage < 100 && (
        <Card className="bg-orange-900/20 border-orange-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-orange-400" />
              <div>
                <p className="text-orange-400 font-medium">
                  Lengkapi profil perusahaan Anda untuk mengikuti lelang
                </p>
                <p className="text-orange-300/70 text-sm">
                  Profil yang lengkap meningkatkan kepercayaan seller dan akses ke lelang eksklusif.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TABS */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-900 border border-slate-800">
          <TabsTrigger value="profile" className="data-[state=active]:bg-green-600">
            <Building2 className="h-4 w-4 mr-2" />
            Profil Perusahaan
          </TabsTrigger>
          <TabsTrigger value="auctions" className="data-[state=active]:bg-green-600">
            <Gavel className="h-4 w-4 mr-2" />
            Riwayat Lelang
          </TabsTrigger>
          <TabsTrigger value="bids" className="data-[state=active]:bg-green-600">
            <History className="h-4 w-4 mr-2" />
            Riwayat Bid
          </TabsTrigger>
          <TabsTrigger value="requests" className="data-[state=active]:bg-green-600">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Permintaan Produk
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: PROFIL PERUSAHAAN */}
        <TabsContent value="profile" className="space-y-4 mt-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-green-400" />
                  Informasi Perusahaan
                </div>
                {!isEditing ? (
                  <Button
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit Profil
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleCancelEdit}
                      variant="outline"
                      className="border-slate-600"
                      disabled={saving}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Batal
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveProfile}
                      className="bg-green-600 hover:bg-green-700"
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Menyimpan...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Simpan
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardTitle>
              <CardDescription className="text-slate-400">
                Lengkapi informasi perusahaan untuk verifikasi dan partisipasi lelang B2B.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nama Lengkap */}
                <div>
                  <label className="text-sm text-slate-400 mb-1 block flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Nama Lengkap
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                      className="w-full bg-slate-800 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-green-500"
                      placeholder="John Doe"
                    />
                  ) : (
                    <p className="text-white bg-slate-800/50 rounded px-4 py-2">
                      {profile?.full_name || '-'}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="text-sm text-slate-400 mb-1 block flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </label>
                  <p className="text-white bg-slate-800/50 rounded px-4 py-2">
                    {profile?.email || '-'}
                  </p>
                </div>

                {/* Nama Perusahaan */}
                <div>
                  <label className="text-sm text-slate-400 mb-1 block flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Nama Perusahaan
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.company_name}
                      onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                      className="w-full bg-slate-800 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-green-500"
                      placeholder="PT. Sonus Nusantara"
                    />
                  ) : (
                    <p className="text-white bg-slate-800/50 rounded px-4 py-2">
                      {profile?.company_name || '-'}
                    </p>
                  )}
                </div>

                {/* Tipe Perusahaan */}
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Tipe Perusahaan</label>
                  {isEditing ? (
                    <select
                      value={formData.company_type}
                      onChange={(e) => setFormData({...formData, company_type: e.target.value})}
                      className="w-full bg-slate-800 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-green-500"
                    >
                      <option value="">Pilih Tipe</option>
                      <option value="pt">PT (Perseroan Terbatas)</option>
                      <option value="cv">CV (Commanditaire Vennootschap)</option>
                      <option value="ud">UD (Usaha Dagang)</option>
                      <option value="koperasi">Koperasi</option>
                      <option value="perseorangan">Perseorangan</option>
                      <option value="lainnya">Lainnya</option>
                    </select>
                  ) : (
                    <p className="text-white bg-slate-800/50 rounded px-4 py-2">
                      {profile?.company_type || '-'}
                    </p>
                  )}
                </div>

                {/* NPWP / Tax ID */}
                <div>
                  <label className="text-sm text-slate-400 mb-1 block flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    NPWP / Tax ID
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.tax_id}
                      onChange={(e) => setFormData({...formData, tax_id: e.target.value})}
                      className="w-full bg-slate-800 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-green-500"
                      placeholder="00.000.000.0-000.000"
                    />
                  ) : (
                    <p className="text-white bg-slate-800/50 rounded px-4 py-2">
                      {profile?.tax_id || '-'}
                    </p>
                  )}
                </div>

                {/* Nomor Telepon */}
                <div>
                  <label className="text-sm text-slate-400 mb-1 block flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Nomor Telepon
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={formData.phone_number}
                      onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                      className="w-full bg-slate-800 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-green-500"
                      placeholder="+62 812 3456 7890"
                    />
                  ) : (
                    <p className="text-white bg-slate-800/50 rounded px-4 py-2">
                      {profile?.phone_number || '-'}
                    </p>
                  )}
                </div>
              </div>

              {/* Alamat Perusahaan */}
              <div>
                <label className="text-sm text-slate-400 mb-1 block flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Alamat Perusahaan
                </label>
                {isEditing ? (
                  <textarea
                    value={formData.company_address}
                    onChange={(e) => setFormData({...formData, company_address: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-green-500 min-h-[100px]"
                    placeholder="Jl. Contoh No. 123, Jakarta, Indonesia"
                  />
                ) : (
                  <p className="text-white bg-slate-800/50 rounded px-4 py-2">
                    {profile?.company_address || '-'}
                  </p>
                )}
              </div>

              {/* Member Since */}
              <div className="pt-4 border-t border-slate-700">
                <label className="text-sm text-slate-400 mb-1 block flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Bergabung Sejak
                </label>
                <p className="text-white bg-slate-800/50 rounded px-4 py-2">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : '-'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: RIWAYAT LELANG */}
        <TabsContent value="auctions" className="space-y-4 mt-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Gavel className="h-5 w-5 text-purple-400" />
                Partisipasi Lelang
              </CardTitle>
              <CardDescription className="text-slate-400">
                Daftar lelang yang Anda ikuti atau menangkan.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-slate-500">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium">Belum ada partisipasi lelang.</p>
                <p className="text-sm mt-2">
                  Ikuti lelang yang tersedia untuk melihat riwayat partisipasi Anda di sini.
                </p>
                <Link href="/auction">
                  <Button className="mt-4 bg-green-600 hover:bg-green-700">
                    <Gavel className="h-4 w-4 mr-2" />
                    Lihat Lelang Tersedia
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: RIWAYAT BID */}
        <TabsContent value="bids" className="space-y-4 mt-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <History className="h-5 w-5 text-blue-400" />
                Riwayat Penawaran
              </CardTitle>
              <CardDescription className="text-slate-400">
                Semua penawaran yang pernah Anda ajukan.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-slate-500">
                <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium">Belum ada riwayat penawaran.</p>
                <p className="text-sm mt-2">
                  Ajukan penawaran pada lelang yang tersedia untuk melihat riwayat bid Anda di sini.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: PERMINTAAN PRODUK (RFQ) */}
        <TabsContent value="requests" className="space-y-4 mt-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-orange-400" />
                  Permintaan Produk (RFQ)
                </div>
                <Button 
                  size="sm" 
                  onClick={() => setShowRequestModal(true)}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Buat Permintaan
                </Button>
              </CardTitle>
              <CardDescription className="text-slate-400">
                Ajukan permintaan produk yang Anda butuhkan. Tim kami akan mencarikan supplier terbaik.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {productRequests.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium">Belum ada permintaan produk.</p>
                  <p className="text-sm mt-2">
                    Buat permintaan produk yang Anda butuhkan, dan tim SonusHUB akan membantu mencarikannya.
                  </p>
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                    <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                      <FileText className="h-6 w-6 text-orange-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-300">1. Ajukan Produk</p>
                      <p className="text-xs text-slate-500 mt-1">Pilih produk dari wishlist</p>
                    </div>
                    <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                      <CheckCircle className="h-6 w-6 text-green-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-300">2. Verifikasi</p>
                      <p className="text-xs text-slate-500 mt-1">Tim kami verifikasi permintaan</p>
                    </div>
                    <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                      <Package className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-300">3. Penawaran</p>
                      <p className="text-xs text-slate-500 mt-1">Dapatkan penawaran dari supplier</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {productRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                      <div>
                        <p className="text-white font-medium">
                          {request.items?.length || 0} Produk Diminta
                        </p>
                        <p className="text-slate-400 text-sm">
                          {new Date(request.created_at).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                      <Badge className={
                        request.status === 'pending' ? 'bg-orange-600' :
                        request.status === 'approved' ? 'bg-green-600' : 'bg-red-600'
                      }>
                        {request.status === 'pending' ? 'Pending' :
                         request.status === 'approved' ? 'Approved' : 'Rejected'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* MODAL WISHLIST & REQUEST */}
      <Dialog open={showRequestModal} onOpenChange={setShowRequestModal}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-orange-400" />
              Buat Permintaan Produk
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Review produk di wishlist Anda dan ajukan permintaan.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {wishlist.length === 0 ? (
              // EMPTY STATE - WISHLIST KOSONG
              <div className="text-center py-12">
                <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-slate-600" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  Belum ada wishlist?
                </h3>
                <p className="text-slate-400 mb-6">
                  Yuk pilih produk dari katalog kami dan tambahkan ke wishlist!
                </p>
                <div className="flex gap-3 justify-center">
                  <Link href="/catalog">
                    <Button className="bg-green-600 hover:bg-green-700">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Buka Katalog Produk
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              // WISHLIST ITEMS
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {wishlist.map((item) => (
                  <div key={item.product_id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div className="flex-1">
                      <p className="text-white font-medium">{item.product_name}</p>
                      <p className="text-slate-400 text-xs">
                        Ditambahkan: {new Date(item.added_date).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.product_id, -1)}
                          className="h-8 w-8 p-0 border-slate-600"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-white font-mono w-12 text-center">
                          {item.quantity}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.product_id, 1)}
                          className="h-8 w-8 p-0 border-slate-600"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeItem(item.product_id)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {wishlist.length > 0 && (
            <DialogFooter className="border-t border-slate-700 pt-4">
              <div className="flex justify-between w-full">
                <Button
                  variant="outline"
                  onClick={() => setShowRequestModal(false)}
                  className="border-slate-600"
                  disabled={submittingRequest}
                >
                  Batal
                </Button>
                <div className="flex gap-2">
                  <Link href="/catalog">
                    <Button
                      variant="outline"
                      className="border-green-600 text-green-400"
                      disabled={submittingRequest}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Tambah Produk
                    </Button>
                  </Link>
                  <Button
                    onClick={submitRequest}
                    className="bg-orange-600 hover:bg-orange-700"
                    disabled={submittingRequest}
                  >
                    {submittingRequest ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Mengirim...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Kirim Permintaan ({wishlist.length} Produk)
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}