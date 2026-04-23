'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation' 
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { 
  User, Building2, Phone, MapPin, Mail, Calendar, CheckCircle, AlertCircle, Loader2, 
  Edit2, Save, X, Package, Gavel, History, FileText, ArrowLeft, ShoppingCart, Plus, 
  Trash2, Minus, ExternalLink, CheckSquare, Square, Image as ImageIcon, Eye, Clock, 
  MessageSquare, Bookmark, CheckCircle2, XCircle, Lock, Check
} from 'lucide-react'
import { useLanguage } from '@/lib/language-context'

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
  first_wishlist_at: string | null 
  profile_locked_until: string | null  // ✅ TAMBAHKAN INI
  created_at: string
  updated_at: string
}

interface WishlistItem {
  product_id: string
  product_name: string
  product_image_url?: string | null
  price: number
  quantity: number
  added_date: string
}

interface RequestItem {
  id?: string
  product_id: string
  product_name: string
  product_image_url?: string | null
  unit_price: number
  quantity: number
  subtotal: number
  status: 'wishlist' | 'pending' | 'approved' | 'rejected' | 'fulfilled'
  admin_notes?: string | null
  created_at?: string
  updated_at?: string
}

interface ProductRequest {
  id: string
  request_number: string
  user_id: string
  status: 'pending' | 'reviewed' | 'approved' | 'rejected' | 'fulfilled'
  notes?: string | null
  admin_notes?: string | null
  total_items: number
  estimated_total: number
  created_at: string
  updated_at: string
  reviewed_at?: string | null
  items?: RequestItem[]
}

interface BidHistory {
  id: string
  finished_auction_id: string | null
  product_name: string
  bid_price: number
  created_at: string
  product_id: string
  current_price: number  // ✅ TAMBAH: Harga saat ini
  auction_end_time: string
  auction_active: boolean
  auction_winner_name: string | null
  current_bidder_id: string | null
  auction_end_reason: string | null
  product_sku: string | null
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function UserDashboard() {
  const router = useRouter()
  const { t } = useLanguage()
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
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [wishlist, setWishlist] = useState<WishlistItem[]>([])
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [submittingRequest, setSubmittingRequest] = useState(false)
  const [fetchingRequests, setFetchingRequests] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [selectedStatusItem, setSelectedStatusItem] = useState<RequestItem | null>(null)
  const [showProfileAlert, setShowProfileAlert] = useState(false)

  const [bidHistory, setBidHistory] = useState<BidHistory[]>([])
  const [bidsLoading, setBidsLoading] = useState(false)
  const [bidTimeRemaining, setBidTimeRemaining] = useState<Record<string, string>>({})
  const [auctionParticipation, setAuctionParticipation] = useState<any[]>([])
  const [auctionLoading, setAuctionLoading] = useState(false)

  // ✅ TAMBAHKAN STATE UNTUK CHAT (setelah state existing)
  const [showChatModal, setShowChatModal] = useState(false)
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [chatLoading, setChatLoading] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [adminInfo, setAdminInfo] = useState<{ name: string; phone?: string } | null>(null)
  const [activeRfqSession, setActiveRfqSession] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [chatSessions, setChatSessions] = useState<any[]>([])
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)

  // Ref so fetchAuctionParticipation always reads the latest profile without needing
  // to be recreated (avoids tearing down realtime subscriptions on profile changes).
  const profileRef = useRef<Profile | null>(null)

  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    company_name: '',
    company_type: '',
    tax_id: '',
    company_address: '',
    phone_number: ''
  })

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

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

  // Keep profileRef in sync so callbacks with [] deps always read the latest profile
  useEffect(() => {
    profileRef.current = profile
  }, [profile])

    const openChatForProduct = async (item: any) => {
    // Ambil Request ID dari wishlist item
    const rfqId = (item as any).request_id 
    
    // Validasi: Jika belum ada Request ID, user tidak bisa chat dulu
    if (!rfqId) {
      alert("❌ Produk ini belum memiliki Request ID (Belum diajukan ke Admin). Silakan request terlebih dahulu.")
      return
    }

    try {
      // Cek atau Buat Chat Session berdasarkan Request ID
      const { data, error: fetchError } = await supabase.rpc(
        'create_chat_session_for_rfq',
        {
          p_user_id: profile?.id,
          p_request_id: rfqId
        }
      )
      const sessionId = data

      if (fetchError) throw fetchError

      // Setelah dapat ID Session, buka tab chat
      if (sessionId) {
        setActiveTab('chat')
        setActiveSession(sessionId)
        await loadMessages(sessionId)
      }
      
    } catch (err: any) {
      console.error("Failed to open chat:", err)
      alert("❌ Gagal membuka chat: " + err.message)
    }
  }
  
  // ✅ IMPLEMENTASI LENGKAP
  const loadMessages = useCallback(async (sessionId: string) => {
    try {
      setChatLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender_profile:profiles!sender_id(full_name),
          admin_profile:admin_marketing_profiles!admin_id(admin_name)
        `)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })
      
      if (error) throw error
      setMessages(data || [])
      
      // Mark as read
      const unreadMessages = data?.filter(m => 
        m.admin_id !== null && !m.read_by_user
      ) || []
      
      if (unreadMessages.length > 0) {
        await supabase
          .from('chat_messages')
          .update({ read_by_user: true })
          .in('id', unreadMessages.map(m => m.id))
      }
    } catch (err) {
      console.error("Failed to load messages:", err)
    } finally {
      setChatLoading(false)
    }
  }, [])

  const getAdminDisplayName = (messages: any[]) => {
    // Cari pesan pertama dari admin
    const adminMessage = messages.find(m => m.admin_id !== null)
    
    if (adminMessage?.admin_profile?.admin_name) {
      return adminMessage.admin_profile.admin_name
    }
    
    // Default ke "Admin" jika belum ada balasan
    return 'Admin'
  }  

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeSession) return
    
    try {
      setSendingMessage(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      
      const { error } = await supabase.rpc('send_chat_message', {
        p_session_id: activeSession,
        p_sender_id: session.user.id,
        p_message: newMessage.trim(),
        p_sender_type: 'user'
      })
      
      if (error) throw error
      setNewMessage('')
      await loadMessages(activeSession)
    } catch (err: any) {
      alert("❌ Gagal mengirim pesan: " + err.message)
    } finally {
      setSendingMessage(false)
    }
  }

  const countUnreadMessages = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      
      const { count, error } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', activeSession)
        .eq('read_by_user', false)
        .not('admin_id', 'is', null)
      
      if (error) throw error
      setUnreadCount(count || 0)
    } catch (err) {
      console.error("Failed to count unread:", err)
    }
  }, [activeSession])

  const handlePlaceBidFromHistory = (product: BidHistory) => {
    // Redirect ke halaman auctions dengan parameter highlight
    router.push(`/auctions?highlight=${product.product_id}`)
  }

  const handleSaveProfile = async () => {
    if (!profile?.id) return
  
    try {
      setSaving(true)
  
      // ✅ HITUNG COMPLETION PERCENTAGE (5 FIELD TANPA NPWP)
      const fields = [
        formData.full_name,
        formData.company_name,
        formData.company_type,
        formData.company_address,
        formData.phone_number
      ]
      const filled = fields.filter(f => f && f.trim() !== '').length
      const completionPercentage = Math.round((filled / fields.length) * 100)
  
      // ✅ HAPUS SEMUA LOGIKA LOCK DARI SINI!
      // Lock sekarang dihandle di handleAddToWishlist
  
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          company_name: formData.company_name,
          company_type: formData.company_type,
          tax_id: formData.tax_id,
          company_address: formData.company_address,
          phone_number: formData.phone_number,
          profile_completed: completionPercentage === 100,
          // ✅ TIDAK ADA profile_locked_until DI SINI LAGI
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)
  
      if (error) throw error
  
      setProfile(prev => prev ? { 
        ...prev, 
        ...formData, 
        profile_completed: completionPercentage === 100,
        updated_at: new Date().toISOString()
      } : null)
      setIsEditing(false)
      
      // ✅ SIMPLE ALERT (TIDAK ADA ANCAMAN LOCK)
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

  const checkProfileCompletion = () => {
    if (!profile?.profile_completed) {
      setShowProfileAlert(true)
      return false
    }
    return true
  }

  const isProfileLocked = () => {
    if (!profile?.profile_locked_until) {
      return false
    }
    
    const lockUntil = new Date(profile.profile_locked_until)
    const now = new Date()
    
    return now < lockUntil
  }
  
  const getLockRemainingDays = () => {
    if (!profile?.profile_locked_until) return 0
    
    const lockUntil = new Date(profile.profile_locked_until)
    const now = new Date()
    const diffTime = lockUntil.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return Math.max(0, diffDays)
  }

  // ✅ GANTI FUNGSI removeItem DENGAN INI
  const removeItem = async (productId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        alert("❌ Session expired. Silakan login ulang.")
        return
      }

    // DELETE DARI DATABASE
    const { error } = await supabase
      .from('wishlists')
      .delete()
      .eq('user_id', session.user.id)
      .eq('product_id', productId)

    if (error) throw error

    // UPDATE LOCAL STATE
    setWishlist(prev => prev.filter(item => item.product_id !== productId))
    setSelectedItems(prev => {
      const next = new Set(prev)
      next.delete(productId)
      return next
    })

  } catch (err: any) {
    console.error("Failed to remove item:", err)
    alert("❌ Gagal menghapus item: " + err.message)
  }
}

// ✅ TAMBAHKAN FUNGSI INI
const handleStatusClick = (item: RequestItem) => {
  setSelectedStatusItem(item)
  setShowStatusModal(true)
}

// ✅ GANTI FUNGSI getStatusMessage (Hapus Emoji, Pakai Icon)
const getStatusMessage = (status: string, adminNotes?: string | null) => {
  switch (status) {
    case 'wishlist':
      return {
        title: 'Wishlist',
        message: 'Barang ini telah menjadi wishlistmu! Segera ajukan permintaan untuk mendapatkan penawaran.',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/20',
        icon: Bookmark // Icon Jarum Modern
      }
    case 'pending':
      return {
        title: 'Menunggu Review',
        message: 'Barang sedang diajukan ke admin, mohon ditunggu ya! Tim kami akan segera memverifikasi ketersediaan.',
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-500/20',
        icon: Clock // Icon Jam
      }
    case 'approved':
    case 'accepted':
      return {
        title: 'Disetujui',
        message: adminNotes || 'Barang tersedia ya kak dengan budget yang telah disepakati.',
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/20',
        icon: CheckCircle2 // Icon Centang Modern
      }
    case 'rejected':
    case 'declined':
      return {
        title: 'Ditolak',
        message: adminNotes || 'Mohon maaf ya, untuk produk ini sedang tidak tersedia.',
        color: 'text-red-400',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/20',
        icon: XCircle // Icon Silang Modern
      }
    default:
      return {
        title: 'Status',
        message: 'Status tidak dikenali.',
        color: 'text-slate-400',
        bgColor: 'bg-slate-500/10',
        borderColor: 'border-slate-500/20',
        icon: Clock
      }
  }
}

useEffect(() => {
  if (bidHistory.length === 0) return

  const updateCountdown = () => {
    const now = new Date().getTime()
    const newTimeRemaining: Record<string, string> = {}

    bidHistory.forEach(bid => {
      if (bid.auction_end_time) {
        const auctionEnd = new Date(bid.auction_end_time).getTime()
        const distance = auctionEnd - now

        if (distance > 0) {
          const days = Math.floor(distance / (1000 * 60 * 60 * 24))
          const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
          const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
          const seconds = Math.floor((distance % (1000 * 60)) / 1000)
          newTimeRemaining[bid.id] = `${days}h ${hours}j ${minutes}m ${seconds}d`
        } else {
          newTimeRemaining[bid.id] = '0h 0j 0m 0s' 
        }
      }
    })

    setBidTimeRemaining(newTimeRemaining)
  }

  updateCountdown()
  const interval = setInterval(updateCountdown, 1000)
  return () => clearInterval(interval)
}, [bidHistory])

// ✅ REALTIME CHAT SUBSCRIPTION
useEffect(() => {
  if (!activeSession) return
  
  const channel = supabase
    .channel(`chat:${activeSession}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `session_id=eq.${activeSession}`
      },
      (payload) => {
        setMessages(prev => [...prev, payload.new])
        countUnreadMessages()
      }
    )
    .subscribe()
  
  return () => {
    supabase.removeChannel(channel)
  }
}, [activeSession, countUnreadMessages])

// ✅ FUNGSI UNTUK LOAD CHAT SESSIONS
const fetchChatSessions = useCallback(async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', session.user.id)
      .order('last_message_at', { ascending: false })
    
    if (error) throw error
    setChatSessions(data || [])
  } catch (err) {
    console.error("Failed to fetch chat sessions:", err)
  }
}, [])

// ✅ LOAD CHAT SESSIONS SAAT COMPONENT MOUNT
useEffect(() => {
  if (activeTab === 'chat') {
    fetchChatSessions()
  }
}, [activeTab, fetchChatSessions])

// ✅ UPDATE getStatusBadgeColor (Lebih Halus & Modern)
const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case 'wishlist':
      return 'bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20'
    case 'pending':
    case 'requested':
      return 'bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20'
    case 'approved':
    case 'accepted':
      return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
    case 'rejected':
    case 'declined':
      return 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
    case 'fulfilled':
      return 'bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20'
    case 'deal':
      return 'bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20'
    default:
      return 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
  }
}

// Returns a stable key that uniquely identifies one auction session for a product.
// Finished sessions are identified by finished_auction_id; the active session uses 'active'.
const getAuctionSessionKey = (productId: string, finishedAuctionId: string | null) =>
  finishedAuctionId ? `${productId}-${finishedAuctionId}` : `${productId}-active`

// Finds the auction_history entry that corresponds to a specific bid.
// Uses two strategies so that the result is consistent with the Admin Marketing Dashboard:
//
// Strategy 1 — direct ID match:
//   If the product currently holds a finished_auction_id (set by the admin when they ended
//   the latest auction session), we look it up directly in history.  This is the most
//   reliable path for a product that has been auctioned exactly once and is now done.
//
// Strategy 2 — time-range match:
//   Used when the product has been re-auctioned (finished_auction_id is reset to null for
//   the new session) so we need to identify which past session this bid belongs to.
//   When auction_start_time is available we use a precise window.  When it is null the
//   fallback only triggers if the product has exactly ONE history entry, preventing an
//   incorrect match when multiple sessions exist.
const findMatchingHistory = (
  bid: { product_id: string; created_at: string },
  product: { finished_auction_id?: string | null } | undefined | null,
  historyData: Array<{
    product_id: string
    finished_auction_id: string | null
    auction_start_time: string | null
    auction_end_time: string
    winner_id: string | null
    winner_name: string | null
    final_price: number | null
    auction_end_reason: string | null
  }> | null | undefined
) => {
  if (!historyData) return null

  const productHistory = historyData.filter(h => h.product_id === bid.product_id)

  // Strategy 1
  if (product?.finished_auction_id) {
    const direct = productHistory.find(
      h => h.finished_auction_id === product.finished_auction_id
    )
    if (direct) return direct
  }

  // Strategy 2
  return productHistory
    .filter(h => {
      if (h.auction_start_time !== null) {
        return new Date(bid.created_at) >= new Date(h.auction_start_time) &&
               new Date(bid.created_at) <= new Date(h.auction_end_time)
      }
      // Null start-time fallback: only safe when there is a single history entry for
      // this product so we cannot accidentally match the wrong re-auction session.
      return productHistory.length === 1 &&
             new Date(bid.created_at) <= new Date(h.auction_end_time)
    })
    .sort((a, b) => new Date(b.auction_end_time).getTime() - new Date(a.auction_end_time).getTime())[0] ?? null
}

// ✅ FUNGSI FETCH PARTISIPASI LELANG
const fetchAuctionParticipation = useCallback(async () => {
  try {
    setAuctionLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    // Fetch semua bid user ini
    const { data: bidsData } = await supabase
      .from('auction_bids')
      .select(`
        product_id,
        bid_price,
        created_at
      `)
      .eq('bidder_id', session.user.id)
      .order('created_at', { ascending: false })

    if (!bidsData || bidsData.length === 0) {
      setAuctionParticipation([])
      setAuctionLoading(false)
      return
    }

    // Ambil unique product_ids
    const productIds = [...new Set(bidsData.map(b => b.product_id))]
    
    // Fetch product info — termasuk finished_auction_id & auction_end_reason agar sinkron
    // dengan data yang ditampilkan di Admin Marketing Dashboard
    const { data: productsData } = await supabase
      .from('products')
      .select(`
        id,
        nama_produk,
        auction_active,
        auction_end_time,
        current_bid_price,
        auction_winner_name,
        current_bidder_id,
        sku,
        finished_auction_id,
        auction_end_reason,
        auction_started_at
      `)
      .in('id', productIds)

    // Fetch auction_history untuk mendeteksi pemenang dengan tepat
    // (khususnya ketika produk sudah di-lelang ulang sehingga data produk berubah)
    const { data: historyData } = await supabase
      .from('auction_history')
      .select('product_id, winner_id, winner_name, final_price, auction_start_time, auction_end_time, auction_end_reason, finished_auction_id')
      .in('product_id', productIds)

    // Gabungkan data
    const participation = bidsData.map(bid => {
      const product = productsData?.find(p => p.id === bid.product_id)

      const matchingHistory = findMatchingHistory(bid, product, historyData)

      // Gunakan profileRef.current agar selalu membaca profil terbaru
      const currentProfile = profileRef.current

      // Cek apakah user menang dari history (akurat untuk produk yang dilelang ulang)
      const isWinnerFromHistory = !!matchingHistory && (
        matchingHistory.winner_id === session.user.id ||
        (matchingHistory.winner_name && (
          matchingHistory.winner_name === session.user?.email ||
          matchingHistory.winner_name === (currentProfile?.full_name || '') ||
          matchingHistory.winner_name.toLowerCase() === session.user?.email?.toLowerCase() ||
          matchingHistory.winner_name.toLowerCase() === (currentProfile?.full_name || '').toLowerCase()
        ))
      )

      // Fallback: cek dari products table jika produk belum dilelang ulang
      const isAuctionDone = !product?.auction_active || !!product?.finished_auction_id
      const isWinnerFromProduct = isAuctionDone && !matchingHistory && (
        (product?.auction_winner_name && (
          product.auction_winner_name === session.user?.email || 
          product.auction_winner_name === (currentProfile?.full_name || '') ||
          product.auction_winner_name.toLowerCase() === session.user?.email?.toLowerCase() ||
          product.auction_winner_name.toLowerCase() === (currentProfile?.full_name || '').toLowerCase()
        )) ||
        product?.current_bidder_id === session.user.id ||
        (!product?.current_bidder_id && !product?.auction_winner_name &&
          bid.bid_price > 0 && bid.bid_price === product?.current_bid_price)
      )

      const isWinner = isWinnerFromHistory || !!isWinnerFromProduct

      // Tentukan final price: dari history jika match, dari produk jika tidak
      const finalPrice = matchingHistory?.final_price || product?.current_bid_price || bid.bid_price

      // Lelang aktif hanya jika: product masih aktif DAN tidak ada finished_auction_id
      // DAN tidak ada history yang cocok — sinkron dengan logika Admin Marketing Dashboard
      const isSessionActive = !matchingHistory && !product?.finished_auction_id && !!product?.auction_active

      // Tentukan apakah lelang ini sudah selesai
      const isFinished = !isSessionActive

      // Gunakan finished_auction_id dari history (paling akurat), lalu dari produk sebagai fallback
      const finishedAuctionId = matchingHistory?.finished_auction_id ?? product?.finished_auction_id ?? null

      // Gunakan auction_end_reason dari history, lalu dari produk, lalu fallback default
      const endReason = matchingHistory?.auction_end_reason ??
        product?.auction_end_reason ??
        (isAuctionDone ? 'completed' : null)
      
      return {
        ...bid,
        product_name: product?.nama_produk || 'Unknown',
        auction_active: isSessionActive,
        auction_end_time: matchingHistory?.auction_end_time || product?.auction_end_time,
        final_price: finalPrice,
        is_winner: isWinner,
        is_finished: isFinished,
        auction_end_reason: endReason,
        finished_auction_id: finishedAuctionId,
        product_sku: product?.sku || null
      }
    })

    // Deduplicate by auction session (product_id + finished_auction_id).
    // If user bid multiple times on the same auction session, keep only the
    // entry with the highest bid price so each session appears exactly once.
    const sessionMap = new Map<string, typeof participation[0]>()
    participation.forEach(item => {
      const sessionKey = getAuctionSessionKey(item.product_id, item.finished_auction_id)
      const existing = sessionMap.get(sessionKey)
      if (!existing || item.bid_price > existing.bid_price) {
        sessionMap.set(sessionKey, item)
      }
    })

    const deduplicatedParticipation = Array.from(sessionMap.values())
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    setAuctionParticipation(deduplicatedParticipation)
  } catch (err) {
    console.error("Failed to fetch auction participation:", err)
  } finally {
    setAuctionLoading(false)
  }
}, [])

// ✅ LOAD SAAT TAB AUCTIONS AKTIF
useEffect(() => {
  if (activeTab === 'auctions') {
    fetchAuctionParticipation()
  }
}, [activeTab, fetchAuctionParticipation])

// ✅ UPDATE QUANTITY JUGA HARUS SYNC KE DATABASE
const updateQuantity = async (productId: string, delta: number) => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    // Find current item
    const currentItem = wishlist.find(item => item.product_id === productId)
    if (!currentItem) return

    const newQty = Math.max(1, currentItem.quantity + delta)

    // UPDATE DATABASE
    const { error } = await supabase
      .from('wishlists')
      .update({ 
        quantity: newQty,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', session.user.id)
      .eq('product_id', productId)

    if (error) throw error

    // UPDATE LOCAL STATE
    setWishlist(prev => prev.map(item => {
      if (item.product_id === productId) {
        return { ...item, quantity: newQty }
      }
      return item
    }))

  } catch (err: any) {
    console.error("Failed to update quantity:", err)
    alert("❌ Gagal update quantity: " + err.message)
  }
}

  // Toggle item selection
  const toggleItemSelection = (productId: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev)
      if (next.has(productId)) {
        next.delete(productId)
      } else {
        next.add(productId)
      }
      return next
    })
  }

  // Select all items
  const selectAllItems = () => {
    if (selectedItems.size === wishlist.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(wishlist.map(item => item.product_id)))
    }
  }

  // Calculate selected items total
  const getSelectedItemsTotal = () => {
    return wishlist
      .filter(item => selectedItems.has(item.product_id))
      .reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }

  const getSelectedItemsCount = () => {
    return wishlist.filter(item => selectedItems.has(item.product_id)).length
  }

  const getTotalQuantity = () => {
    return wishlist
      .filter(item => selectedItems.has(item.product_id))
      .reduce((sum, item) => sum + item.quantity, 0)
  }

  const getStatusBadgeText = (status: string) => {
    switch (status) {
      case 'wishlist':
        return 'Wishlist'
      case 'pending':
        return 'Menunggu Review'
      case 'requested':
        return 'Diajukan'
      case 'approved':
      case 'accepted':
        return 'Disetujui'
      case 'rejected':
      case 'declined':
        return 'Ditolak'
      case 'fulfilled':
        return 'Terpenuhi'
      case 'deal':
        return 'Deal'
      default:
        return status
    }
  }

  const submitRequest = async () => {
    if (!profile?.profile_completed) {
      alert("❌ Profil harus lengkap 100% sebelum melakukan request! Silakan lengkapi profil terlebih dahulu.")
      setActiveTab('profile')
      return
    }

    if (selectedItems.size === 0) {
      alert("❌ Pilih item yang mau di-request!")
      return
    }

    // Show confirmation modal first
    setShowConfirmModal(true)
  }

// HAPUS useEffect localStorage yang lama
// GANTI dengan fetch dari database + realtime subscription

const fetchWishlist = useCallback(async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    // 1. Fetch wishlist dulu (include request_id)
    const { data: wishlistData, error } = await supabase
      .from('wishlists')
      .select('*, request_id')  // ✅ TAMBAH request_id
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    if (!wishlistData || wishlistData.length === 0) {
      setWishlist([])
      return
    }

    // 2. Fetch products untuk dapat harga terbaru
    const productIds = [...new Set(wishlistData.map(w => w.product_id))]
    const { data: productsData } = await supabase
      .from('products')
      .select('id, nama_produk, harga, gambar_url')
      .in('id', productIds)

    // 3. Gabungkan data dengan harga terbaru dari products
    const enrichedWishlist = wishlistData.map(item => {
      const latestProduct = productsData?.find(p => p.id.toString() === item.product_id.toString())
      
      return {
        ...item,
        // ✅ PRIORITASKAN DATA DARI PRODUCTS TABLE
        product_name: latestProduct?.nama_produk || item.product_name,  // ✅ SYNC NAMA
        product_image_url: latestProduct?.gambar_url || item.product_image_url,  // ✅ SYNC GAMBAR
        price: latestProduct?.harga || item.price || 0  // ✅ SYNC HARGA
      }
    })

    setWishlist(enrichedWishlist)
  } catch (err: any) {
    console.error("Failed to fetch wishlist:", err)
  }
}, [])

// Load wishlist saat component mount
useEffect(() => {
  fetchWishlist()
}, [fetchWishlist])

const fetchBidHistory = useCallback(async () => {
  try {
    setBidsLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) return

    // Fetch bids user ini - ambil yang terbaru per produk
    const { data: bidsData, error } = await supabase
      .from('auction_bids')
      .select(`
        id,
        bid_price,
        created_at,
        product_id
      `)
      .eq('bidder_id', session.user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    if (!bidsData || bidsData.length === 0) {
      setBidHistory([])
      return
    }

    // Fetch nama produk dan info lelang — termasuk finished_auction_id & auction_end_reason
    // agar sinkron dengan data yang ditampilkan di Admin Marketing Dashboard
    const productIds = [...new Set(bidsData.map(b => b.product_id))]
    const { data: productsData } = await supabase
      .from('products')
      .select('id, nama_produk, current_bid_price, auction_end_time, auction_active, auction_winner_name, current_bidder_id, auction_started_at, sku, finished_auction_id, auction_end_reason')
      .in('id', productIds)

    // Fetch auction_history agar status tetap akurat setelah produk dilelang ulang
    const { data: auctionHistoryData } = await supabase
      .from('auction_history')
      .select('product_id, winner_id, winner_name, final_price, auction_start_time, auction_end_time, auction_end_reason, finished_auction_id')
      .in('product_id', productIds)

    // Gabungkan data - map semua bid dulu, deduplication by session dilakukan sesudahnya
    const allMappedBids = bidsData.map(bid => {
      const product = productsData?.find(p => p.id === bid.product_id)

      const matchingHistory = findMatchingHistory(bid, product, auctionHistoryData)

      // Lelang aktif hanya jika: product masih aktif DAN tidak ada finished_auction_id
      // DAN tidak ada history yang cocok — sinkron dengan logika Admin Marketing Dashboard
      const isAuctionActive = !matchingHistory && !product?.finished_auction_id && !!product?.auction_active

      // Gunakan finished_auction_id dari history, lalu dari produk sebagai fallback
      const finishedAuctionId = matchingHistory?.finished_auction_id ?? product?.finished_auction_id ?? null

      // Gunakan auction_end_reason dari history, lalu dari produk, lalu fallback default
      const isAuctionDone = !product?.auction_active || !!product?.finished_auction_id
      const endReason = matchingHistory?.auction_end_reason ??
        product?.auction_end_reason ??
        (isAuctionDone ? 'completed' : null)

      return {
        ...bid,
        product_name: product?.nama_produk || 'Produk Tidak Diketahui',
        // Gunakan nullish coalescing agar final_price = 0 (lelang tanpa bid) tetap ditampilkan
        current_price: matchingHistory != null
          ? (matchingHistory.final_price ?? product?.current_bid_price ?? bid.bid_price)
          : (product?.current_bid_price ?? bid.bid_price),
        auction_end_time: matchingHistory?.auction_end_time ?? product?.auction_end_time ?? '',
        auction_active: isAuctionActive,
        // Bila matchingHistory ada, gunakan nilai dari history saja (termasuk null = tidak ada pemenang)
        auction_winner_name: matchingHistory != null
          ? matchingHistory.winner_name
          : (product?.auction_winner_name ?? null),
        current_bidder_id: matchingHistory != null
          ? matchingHistory.winner_id
          : (product?.current_bidder_id ?? null),
        auction_end_reason: endReason,
        finished_auction_id: finishedAuctionId,
        product_sku: product?.sku ?? null,
        _sessionKey: getAuctionSessionKey(bid.product_id, finishedAuctionId)
      }
    })

    // Deduplicate by auction session (product_id + finished_auction_id).
    // For each session, keep the user's highest bid so every auction appears exactly once.
    const sessionMap = new Map<string, typeof allMappedBids[0]>()
    allMappedBids.forEach(item => {
      const existing = sessionMap.get(item._sessionKey)
      if (!existing || item.bid_price > existing.bid_price) {
        sessionMap.set(item._sessionKey, item)
      }
    })

    const historyWithProducts = Array.from(sessionMap.values())
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      // Remove internal helper key before storing in state
      .map(({ _sessionKey, ...rest }) => rest)

    setBidHistory(historyWithProducts)
  } catch (err: any) {
    console.error("Failed to fetch bid history:", err)
  } finally {
    setBidsLoading(false)
  }
}, [])

// ✅ LOAD BID HISTORY SAAT TAB BIDS AKTIF
useEffect(() => {
  if (activeTab === 'bids') {
    fetchBidHistory()
  }
}, [activeTab, fetchBidHistory])

// ✅ FORMAT TANGGAL INDONESIA
const formatDateIndonesian = (dateString: string) => {
  const date = new Date(dateString)
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]
  
  const day = date.getDate()
  const month = months[date.getMonth()]
  const year = date.getFullYear()
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  
  return `${day} ${month} ${year}, ${hours}:${minutes}`
}

// ✅ STATUS LELANG SELESAI - sinkron dengan Admin Marketing Dashboard
const getAuctionEndReasonBadge = (reason: string | null | undefined) => {
  switch (reason) {
    case 'cancelled':
      return { label: 'Dibatalkan', className: 'bg-red-500/20 text-red-400 border border-red-500/30' }
    case 'force_stop':
      return { label: 'Dihentikan', className: 'bg-orange-500/20 text-orange-400 border border-orange-500/30' }
    case 'no_bids':
      return { label: 'Tidak Ada Bid', className: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' }
    default:
      return { label: 'Selesai', className: 'bg-green-500/20 text-green-400 border border-green-500/30' }
  }
}

// ✅ REALTIME SUBSCRIPTION - Auto refresh saat ada perubahan
// ✅ GANTI BAGIAN INI (line 437-450)
// ✅ GANTI useEffect INI (line 428-450)
useEffect(() => {
  const fetchSessionAndSubscribe = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const channel = supabase
      .channel('wishlist-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wishlists',
          filter: `user_id=eq.${session.user.id}`
        },
        () => {
          fetchWishlist()
        }
      )
      .subscribe()

    // ✅ TAMBAHKAN TYPE ANNOTATION DI CLEANUP
    return () => {
      supabase.removeChannel(channel)
    }
  }

  fetchSessionAndSubscribe()
}, [])

// ✅ LISTEN untuk event dari ProductDetailModal (jika masih pakai localStorage fallback)
useEffect(() => {
  const handleWishlistUpdated = () => {
    fetchWishlist()
  }

  window.addEventListener('wishlist-updated', handleWishlistUpdated)
  return () => window.removeEventListener('wishlist-updated', handleWishlistUpdated)
}, [])

// ✅ REALTIME SUBSCRIPTION - Sinkronkan data lelang secara real-time
useEffect(() => {
  let isMounted = true
  let bidsChannel: ReturnType<typeof supabase.channel> | null = null
  let productsChannel: ReturnType<typeof supabase.channel> | null = null
  let historyChannel: ReturnType<typeof supabase.channel> | null = null
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  const debouncedRefresh = () => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      if (!isMounted) return
      fetchBidHistory()
      fetchAuctionParticipation()
    }, 500)
  }

  const setupAuctionRealtime = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session || !isMounted) return

    // Listen untuk semua bid baru pada auction_bids (termasuk dari pengguna lain)
    // sehingga harga terkini selalu ter-update di dashboard
    bidsChannel = supabase
      .channel('dashboard-auction-bids-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'auction_bids'
        },
        () => {
          debouncedRefresh()
        }
      )
      .subscribe()

    // Listen untuk perubahan produk lelang (current_bid_price, auction_active, current_bidder_id, dst.)
    productsChannel = supabase
      .channel('dashboard-products-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'products'
        },
        (payload: any) => {
          // Hanya refresh jika produk yang berubah adalah produk lelang
          if (payload?.new?.is_auction) {
            debouncedRefresh()
          }
        }
      )
      .subscribe()

    // Listen untuk lelang yang selesai/dibatalkan oleh admin
    // (auction_history INSERT terjadi sebelum products UPDATE, sehingga data sudah
    //  tersedia di DB saat debouncedRefresh membaca ulang)
    historyChannel = supabase
      .channel('dashboard-auction-history-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'auction_history'
        },
        () => {
          debouncedRefresh()
        }
      )
      .subscribe()
  }

  setupAuctionRealtime()

  return () => {
    isMounted = false
    if (debounceTimer) clearTimeout(debounceTimer)
    if (bidsChannel) supabase.removeChannel(bidsChannel)
    if (productsChannel) supabase.removeChannel(productsChannel)
    if (historyChannel) supabase.removeChannel(historyChannel)
  }
}, [fetchBidHistory, fetchAuctionParticipation])

const confirmSubmitRequest = async () => {
  if (selectedItems.size === 0) {
    alert("❌ Pilih item yang mau di-request!")
    return
  }

  try {
    setSubmittingRequest(true)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      alert("❌ Session expired. Silakan login ulang.")
      return
    }

    // ✅ 1. Get ONLY selected items from wishlist
    const selectedWishlistItems: WishlistItem[] = wishlist.filter(
      (item: WishlistItem) => selectedItems.has(item.product_id)
    )

    // ✅ 2. Calculate totals dengan harga terbaru
    const productIds: string[] = selectedWishlistItems.map(
      (item: WishlistItem) => item.product_id
    )
    
    const { data: latestProducts } = await supabase
      .from('products')
      .select('id, harga')
      .in('id', productIds)

    const totalItems: number = selectedWishlistItems.length
    const estimatedTotal: number = selectedWishlistItems.reduce(
      (sum: number, item: WishlistItem) => {
        const latestPrice = latestProducts?.find(
          (p: any) => p.id.toString() === item.product_id.toString()
        )?.harga || item.price
        return sum + (latestPrice * item.quantity)
      },
      0
    )

    // ✅ 3. CEK DULU: Apakah user sudah punya RFQ yang masih aktif?
    const { data: existingRFQs, error: checkError } = await supabase
    .from('wishlists')
    .select('request_id')
    .eq('user_id', session.user.id)
    .in('status', ['requested', 'accepted'])
    .order('created_at', { ascending: false })
    .limit(1)

    let newRequestId: number

    if (existingRFQs && existingRFQs.length > 0 && existingRFQs[0].request_id) {
      // ✅ PAKAI REQUEST_ID YANG SUDAH ADA (MERGE)
      newRequestId = existingRFQs[0].request_id
      console.log("✅ Merge ke RFQ existing:", newRequestId)
    } else {
      // ✅ GENERATE REQUEST_ID BARU
      const { data: sequenceData, error: seqError } = await supabase.rpc('nextval', {
        sequence_name: 'request_id_seq'
      })

      if (seqError || !sequenceData) {
        console.error("Gagal ambil sequence, pakai timestamp:", seqError)
        newRequestId = parseInt(Date.now().toString().slice(-8)) // Ambil 8 digit terakhir
      } else {
        newRequestId = sequenceData
      }
      console.log("✅ Buat RFQ baru dengan ID:", newRequestId)
    }

    // ✅ 4. UPDATE WISHLISTS
    const { error: updateError } = await supabase
      .from('wishlists')
      .update({
        status: 'requested',
        request_id: newRequestId, // ✅ PAKAI ID YANG SUDAH DITENTUKAN
        updated_at: new Date().toISOString()
      })
      .eq('user_id', session.user.id)
      .in('product_id', Array.from(selectedItems))

    if (updateError) throw updateError

    // ✅ 5. Refresh wishlist
    await fetchWishlist()

    // ✅ 6. Clear selection
    setSelectedItems(new Set())
    setShowConfirmModal(false)
    setShowRequestModal(false)

    alert("✅ Permintaan produk berhasil dikirim! Tim kami akan segera memverifikasi.")

  } catch (err: any) {
    console.error("Failed to submit request:", err)
    alert("❌ Gagal mengirim permintaan: " + err.message)
  } finally {
    setSubmittingRequest(false)
  }
}

  const getCompletionPercentage = () => {
    if (!profile) return 0
    const fields = [
      profile.full_name,
      profile.company_name,
      profile.company_type,
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
        <span className="ml-2">{t.dashboard.loading}</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-4">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">{t.dashboard.errorTitle}</h2>
        <p className="text-slate-400 mb-4 max-w-md text-center">{error}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition">
          {t.dashboard.retryBtn}
        </button>
      </div>
    )
  }

  if (!isAuthorized) return null

  const completionPercentage = getCompletionPercentage()
  const selectedTotal = getSelectedItemsTotal()
  const selectedCount = getSelectedItemsCount()
  const totalQuantity = getTotalQuantity()

  return (
    <div className="p-8 space-y-6 bg-slate-950 min-h-screen text-slate-100">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group">
            <div className="bg-slate-800 p-2 rounded-lg group-hover:bg-slate-700 border border-slate-700">
              <ArrowLeft className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium hidden sm:inline">{t.dashboard.backHome}</span>
          </Link>
          {/* ... header content ... */}
        </div>
        {/* ✅ TAMBAHKAN TOMBOL KE KATALOG */}
        <div className="flex items-center gap-2">
          <Link href="/catalog">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <ExternalLink className="h-4 w-4 mr-2" />
              {t.dashboard.toCatalog}
            </Button>
          </Link>
          <Badge variant="outline" className={`px-4 py-2 ${
            completionPercentage === 100 
              ? 'text-green-400 border-green-400 bg-green-900/20' 
              : 'text-orange-400 border-orange-400 bg-orange-900/20'
          }`}>
            {completionPercentage === 100 ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                {t.dashboard.profileComplete}
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 mr-2" />
                {t.dashboard.profileIncomplete} {completionPercentage}{t.dashboard.profileCompleteSuffix}
              </>
            )}
          </Badge>
        </div>
      </div>
      {/* PROFILE COMPLETION ALERT */}
      {completionPercentage < 100 && (
        <Card className="bg-orange-900/20 border-orange-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-orange-400" />
              <div>
                <p className="text-orange-400 font-medium">
                  {t.dashboard.profileIncompleteAlert}
                </p>
                <p className="text-orange-300/70 text-sm">
                  {t.dashboard.profileIncompleteAlertDesc}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TABS */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-slate-900 border border-slate-800">
          <TabsTrigger value="profile" className="data-[state=active]:bg-green-600">
            <Building2 className="h-4 w-4 mr-2" />
            {t.dashboard.tabs.profile}
          </TabsTrigger>
          <TabsTrigger 
            value="auctions" 
            className="data-[state=active]:bg-green-600"
            onClick={(e) => {
              if (!checkProfileCompletion()) {
                e.preventDefault()
              }
            }}
          >
            <Gavel className="h-4 w-4 mr-2" />
            {t.dashboard.tabs.auctions}
          </TabsTrigger>
          <TabsTrigger 
            value="bids" 
            className="data-[state=active]:bg-green-600"
            onClick={(e) => {
              if (!checkProfileCompletion()) {
                e.preventDefault()
              }
            }}
          >
            <History className="h-4 w-4 mr-2" />
            {t.dashboard.tabs.bids}
          </TabsTrigger>
          <TabsTrigger 
            value="requests" 
            className="data-[state=active]:bg-green-600"
            onClick={(e) => {
              if (!checkProfileCompletion()) {
                e.preventDefault()
              }
            }}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {t.dashboard.tabs.requests}
          </TabsTrigger>
          <TabsTrigger
            value="chat"
            className="data-[state=active]:bg-green-600 relative"
            onClick={(e) => {
              if (!checkProfileCompletion()) {
                e.preventDefault()
                return
              }
              // Check if user has any RFQ
              const hasRFQ = wishlist.some((item: any) => 
                (item as any).status === 'requested' || 
                (item as any).status === 'accepted' ||
                (item as any).status === 'deal'
              )
              if (!hasRFQ) {
                e.preventDefault()
                alert("ℹ️ Belum ada RFQ yang diajukan")
              }
            }}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Chat Admin
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ✅ TAMBAHKAN DIALOG ALERT INI (sebelum closing </div> terakhir) */}
        <Dialog 
          open={showProfileAlert} 
          onOpenChange={(open) => {
            // ✅ PREVENT CLOSING - User HARUS interact dengan modal
            if (!open) {
              setShowProfileAlert(true) // Force keep open
              return
            }
            setShowProfileAlert(open)
          }}
        >
          <DialogContent 
            className="bg-slate-900 border-red-700 text-white max-w-md"
            onInteractOutside={(e) => e.preventDefault()} // ✅ Block klik luar
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-400">
                <AlertCircle className="h-5 w-5" />
                {t.dashboard.profileModal.title}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                {t.dashboard.profileModal.desc}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                onClick={() => {
                  setShowProfileAlert(false)
                  setActiveTab('profile')
                }}
                className="bg-green-600 hover:bg-green-700 w-full"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                {t.dashboard.profileModal.fillNow}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* TAB 1: PROFIL PERUSAHAAN */}
        <TabsContent value="profile" className="space-y-4 mt-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-green-400" />
                  {t.dashboard.profileCard.title}
                </div>
                {!isEditing ? (
                  <Button
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    disabled={isProfileLocked()}
                    className={`bg-blue-600 hover:bg-blue-700 ${
                      isProfileLocked() ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    {isProfileLocked() ? `${t.dashboard.profileCard.locked} (${getLockRemainingDays()} ${t.dashboard.profileCard.lockedDays})` : t.dashboard.profileCard.editProfile}
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
                      {t.dashboard.profileCard.cancel}
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
                          {t.dashboard.profileCard.saving}
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          {t.dashboard.profileCard.save}
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardTitle>
              {isProfileLocked() && (
                <div className="bg-amber-900/20 border border-amber-700 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 text-amber-400">
                    <Lock className="h-5 w-5" />
                    <p className="font-medium">
                      {t.dashboard.profileCard.lockedNotice} {getLockRemainingDays()} {t.dashboard.profileCard.lockedDays}
                    </p>
                  </div>
                  <p className="text-amber-300/70 text-sm mt-2">
                    {t.dashboard.profileCard.lockedNoticeDesc}
                  </p>
                </div>
              )}
              <CardDescription className="text-slate-400">
                {t.dashboard.profileCard.cardDesc}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nama Lengkap */}
                <div>
                  <label className="text-sm text-slate-400 mb-1 block flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {t.dashboard.profileCard.fullName}
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
                    {t.dashboard.profileCard.email}
                  </label>
                  <p className="text-white bg-slate-800/50 rounded px-4 py-2">
                    {profile?.email || '-'}
                  </p>
                </div>

                {/* Nama Perusahaan */}
                <div>
                  <label className="text-sm text-slate-400 mb-1 block flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {t.dashboard.profileCard.companyName}
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
                  <label className="text-sm text-slate-400 mb-1 block">{t.dashboard.profileCard.companyType}</label>
                  {isEditing ? (
                    <select
                      value={formData.company_type}
                      onChange={(e) => setFormData({...formData, company_type: e.target.value})}
                      className="w-full bg-slate-800 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-green-500"
                    >
                      <option value="">{t.dashboard.profileCard.selectType}</option>
                      <option value="PT">PT (Perseroan Terbatas)</option>
                      <option value="CV">CV (Commanditaire Vennootschap)</option>
                      <option value="UD">UD (Usaha Dagang)</option>
                      <option value="Koperasi">Koperasi</option>
                      <option value="Perseorangan">Perseorangan</option>
                      <option value="Lainnya">Lainnya</option>
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
                    {t.dashboard.profileCard.taxId}
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
                    {t.dashboard.profileCard.phone}
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
                  {t.dashboard.profileCard.companyAddress}
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

        {/* TAB 2: RIWAYAT LELANG - UPDATED */}
        <TabsContent value="auctions" className="space-y-4 mt-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <Gavel className="h-5 w-5 text-purple-400" />
                  Partisipasi Lelang
                </div>
                <Badge className="bg-green-500/10 text-green-400 border border-green-500/30 text-xs animate-pulse">
                  ● Live
                </Badge>
              </CardTitle>
              <CardDescription className="text-slate-400">
                Daftar lelang yang Anda ikuti atau menangkan. Data diperbarui secara real-time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {auctionLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                  <span className="ml-2 text-slate-400">Memuat riwayat lelang...</span>
                </div>
              ) : auctionParticipation.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium">Belum ada partisipasi lelang.</p>
                  <p className="text-sm mt-2">
                    Ikuti lelang yang tersedia untuk melihat riwayat partisipasi Anda di sini.
                  </p>
                  <Link href="/auctions">
                    <Button className="mt-4 bg-green-600 hover:bg-green-700">
                      <Gavel className="h-4 w-4 mr-2" />
                      Lihat Lelang Tersedia
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {auctionParticipation.map((item, index) => (
                    <div 
                      key={`${item.product_id}-${index}`}
                      className="bg-slate-800/50 rounded-lg p-4 border border-slate-700"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                        {/* No */}
                        <div className="text-slate-400">{index + 1}</div>
                        
                        {/* ID Transaksi */}
                        <Badge className="bg-pink-600/20 text-pink-400 font-mono">
                          {item.finished_auction_id || item.product_sku || (item.auction_active ? 'Berlangsung' : 'N/A')}
                        </Badge>
                        
                        {/* Nama Produk */}
                        <div className="text-white font-medium">{item.product_name}</div>
                        
                        {/* Harga */}
                        <div className="text-orange-400 font-mono">
                          {formatPrice(item.final_price)}
                        </div>
                        
                        {/* Status */}
                        <div>
                          {item.is_winner ? (
                            <Badge className="bg-green-600/20 text-green-400 border border-green-600/30">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Menang
                            </Badge>
                          ) : item.auction_active ? (
                            <Badge className="bg-purple-600/20 text-purple-400 border border-purple-600/30">
                              <Gavel className="h-3 w-3 mr-1" />
                              Berlangsung
                            </Badge>
                          ) : (
                            <Badge className={getAuctionEndReasonBadge(item.auction_end_reason).className}>
                              {getAuctionEndReasonBadge(item.auction_end_reason).label}
                            </Badge>
                          )}
                        </div>
                        
                        {/* Tanggal */}
                        <div className="text-xs text-slate-500">
                          {formatDateIndonesian(item.created_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: RIWAYAT BID */}
        <TabsContent value="bids" className="space-y-4 mt-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5 text-blue-400" />
                  Riwayat Penawaran Terakhir
                </div>
                <Badge className="bg-green-500/10 text-green-400 border border-green-500/30 text-xs animate-pulse">
                  ● Live
                </Badge>
              </CardTitle>
              <CardDescription className="text-slate-400">
                Penawaran terakhir Anda untuk setiap produk lelang. Harga diperbarui secara real-time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {bidsLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  <span className="ml-2 text-slate-400">Memuat riwayat...</span>
                </div>
              ) : bidHistory.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium">Belum ada riwayat penawaran.</p>
                  <p className="text-sm mt-2">
                    Ajukan penawaran pada lelang yang tersedia.
                  </p>
                  <Link href="/auctions">
                    <Button className="mt-4 bg-green-600 hover:bg-green-700">
                      <Gavel className="h-4 w-4 mr-2" />
                      Lihat Lelang Tersedia
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {bidHistory.map((bid, index) => (
                    <div 
                      key={bid.id} 
                      className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition-colors"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                        {/* No */}
                        <div className="text-slate-400 font-medium">
                          {index + 1}
                        </div>

                        {/* ID Transaksi */}
                        <div>
                          <Badge className="bg-pink-600/20 text-pink-400 border border-pink-600/30 font-mono">
                            {bid.finished_auction_id || bid.product_sku || (bid.auction_active ? 'Berlangsung' : 'N/A')}
                          </Badge>
                        </div>

                        {/* Nama Produk */}
                        <div className="text-white font-medium">
                          {bid.product_name}
                        </div>

                        {/* Harga Bid & Current Price */}
                        <div className="space-y-1">
                          <div className="text-xs text-slate-400">
                            Bid Anda: <span className="text-green-400 font-mono font-bold">{formatPrice(bid.bid_price)}</span>
                          </div>
                          <div className="text-xs text-slate-400">
                            Harga Sekarang: <span className="text-orange-400 font-mono font-bold">{formatPrice(bid.current_price)}</span>
                          </div>
                        </div>

                        {/* Sisa Waktu */}
                        <div>
                          {bid.auction_active === false ? (
                            <Badge className={`${getAuctionEndReasonBadge(bid.auction_end_reason).className} text-xs`}>
                              {getAuctionEndReasonBadge(bid.auction_end_reason).label}
                            </Badge>
                          ) : (
                            <div className="flex items-center gap-1 text-orange-400 text-xs font-mono">
                              <Clock className="h-3 w-3" />
                              <span>{bidTimeRemaining[bid.id] || 'Loading...'}</span>
                            </div>
                          )}
                          <div className="text-xs text-slate-500 mt-1">
                            {formatDateIndonesian(bid.created_at)}
                          </div>
                        </div>

                        {/* Aksi - Place Bid Button */}
                        <div>
                          {bid.auction_active === false ? (
                            <Button
                              size="sm"
                              disabled
                              className="w-full bg-slate-700 text-slate-400 cursor-not-allowed text-xs"
                            >
                              <Lock className="h-3 w-3 mr-1" />
                              Selesai
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handlePlaceBidFromHistory(bid)}
                              className="w-full bg-green-600 hover:bg-green-700 text-xs"
                            >
                              <Gavel className="h-3 w-3 mr-1" />
                              Place Bid
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: PERMINTAAN PRODUK (RFQ) - FIXED TO SHOW WISHLIST */}
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
                  onClick={submitRequest}
                  className="bg-orange-600 hover:bg-orange-700"
                  disabled={wishlist.length === 0 || submittingRequest}
                >
                  {submittingRequest ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Kirim Permintaan ({wishlist.length} Item)
                    </>
                  )}
                </Button>
              </CardTitle>
              <CardDescription className="text-slate-400">
                Review produk di wishlist Anda sebelum mengajukan permintaan ke tim kami.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {wishlist.length === 0 ? (
                // EMPTY STATE - WISHLIST KOSONG
                <div className="text-center py-12 text-slate-500">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium">Belum ada produk di wishlist.</p>
                  <p className="text-sm mt-2">
                    Tambahkan produk dari katalog untuk membuat permintaan.
                  </p>
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                    <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                      <FileText className="h-6 w-6 text-orange-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-300">1. Pilih Produk</p>
                      <p className="text-xs text-slate-500 mt-1">Dari katalog kami</p>
                    </div>
                    <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                      <ShoppingCart className="h-6 w-6 text-green-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-300">2. Masukkan Wishlist</p>
                      <p className="text-xs text-slate-500 mt-1">Klik "Request Item"</p>
                    </div>
                    <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                      <CheckCircle className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-300">3. Kirim Permintaan</p>
                      <p className="text-xs text-slate-500 mt-1">Tim kami akan verifikasi</p>
                    </div>
                  </div>
                  <Link href="/catalog" className="mt-6 inline-block">
                    <Button className="bg-green-600 hover:bg-green-700">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Buka Katalog Produk
                    </Button>
                  </Link>
                </div>
              ) : (
                // WISHLIST ITEMS TABLE
                <div className="space-y-4">
                  {/* Table Header with Select All */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-800 text-slate-300">
                        <tr>
                          <th className="px-4 py-3 w-12">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={selectAllItems}
                              className="h-8 w-8 p-0 hover:bg-slate-700"
                            >
                              {selectedItems.size === wishlist.length ? (
                                <CheckCircle className="h-4 w-4 text-green-400" />
                              ) : (
                                <div className="h-4 w-4 border-2 border-slate-500 rounded" />
                              )}
                            </Button>
                          </th>
                          <th className="px-4 py-3 w-16">Gambar</th>
                          <th className="px-4 py-3">Nama Produk</th>
                          <th className="px-4 py-3 text-right">Harga Satuan</th>
                          <th className="px-4 py-3 text-center">Jumlah</th>
                          <th className="px-4 py-3 text-right">Subtotal</th>
                          <th className="px-4 py-3 text-center">Status</th>
                          <th className="px-4 py-3 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {wishlist.map((item) => (
                          <tr key={item.product_id} className="hover:bg-slate-800/30">
                            {/* 1. Checkbox */}
                            <td className="px-4 py-3">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleItemSelection(item.product_id)}
                                className="h-8 w-8 p-0 hover:bg-slate-700"
                              >
                                {selectedItems.has(item.product_id) ? (
                                  <CheckCircle className="h-4 w-4 text-green-400" />
                                ) : (
                                  <div className="h-4 w-4 border-2 border-slate-500 rounded" />
                                )}
                              </Button>
                            </td>

                            {/* 2. Gambar */}
                            <td className="px-4 py-3">
                              {item.product_image_url ? (
                                <img 
                                  src={item.product_image_url} 
                                  alt={item.product_name}
                                  className="w-12 h-12 object-cover rounded-lg border border-slate-600"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center border border-slate-600">
                                  <ImageIcon className="h-5 w-5 text-slate-500" />
                                </div>
                              )}
                            </td>

                            {/* 3. Nama Produk */}
                            <td className="px-4 py-3 text-white font-medium">
                              {item.product_name}
                            </td>

                            {/* 4. Harga Satuan */}
                            <td className="px-4 py-3 text-right text-slate-300 font-mono">
                              {formatPrice(item.price)}
                            </td>

                            {/* 5. Jumlah */}
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-2">
                                {/* ✅ DISABLE BUTTON JIKA STATUS BUKAN WISHLIST */}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateQuantity(item.product_id, -1)}
                                  disabled={(item as any).status !== 'wishlist'}
                                  className={`h-8 w-8 p-0 border-slate-600 ${
                                    (item as any).status !== 'wishlist' 
                                      ? 'opacity-50 cursor-not-allowed' 
                                      : 'hover:bg-slate-700'
                                  }`}
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
                                  disabled={(item as any).status !== 'wishlist'}
                                  className={`h-8 w-8 p-0 border-slate-600 ${
                                    (item as any).status !== 'wishlist' 
                                      ? 'opacity-50 cursor-not-allowed' 
                                      : 'hover:bg-slate-700'
                                  }`}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              {/* ✅ TAMPILKAN PESAN SESUAI STATUS */}
                              {((item as any).status === 'requested' || (item as any).status === 'pending') && (
                                <p className="text-xs text-amber-400 text-center mt-1">
                                  ⚠️ Menunggu review admin
                                </p>
                              )}
                              {((item as any).status === 'accepted' || (item as any).status === 'approved') && (
                                <p className="text-xs text-emerald-400 text-center mt-1">
                                  ✅ Disetujui admin
                                </p>
                              )}
                              {((item as any).status === 'declined' || (item as any).status === 'rejected') && (
                                <p className="text-xs text-red-400 text-center mt-1">
                                  ❌ Ditolak admin
                                </p>
                              )}
                              {(item as any).status === 'deal' && (
                                <p className="text-xs text-green-400 text-center mt-1">
                                  🤝 Deal selesai
                                </p>
                              )}
                            </td>

                            {/* 6. Subtotal */}
                            <td className="px-4 py-3 text-right text-orange-400 font-bold font-mono">
                              {formatPrice(item.price * item.quantity)}
                            </td>

                            {/* 7. STATUS BADGE (INI YANG KURANG!) */}
                            <td className="px-4 py-3 text-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusClick(item as any)}
                                className={`h-8 px-3 border-slate-600 ${getStatusBadgeColor((item as any).status || 'wishlist')}`}
                              >
                                {getStatusBadgeText((item as any).status || 'wishlist')}
                              </Button>
                            </td>

                            {/* 8. Aksi (Delete atau Chat Button) */}
                            <td className="px-4 py-3 text-center">
                              {(item as any).status === 'wishlist' ? (
                                // Tombol trash HANYA untuk wishlist
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => removeItem(item.product_id)}
                                  className="h-8 w-8 p-0"
                                  title="Hapus dari wishlist"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              ) : (
                                // ✅ TOMBOL CHAT untuk produk requested/accepted/deal
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    // Open chat for this specific product
                                    const rfqId = (item as any).request_id
                                    if (rfqId) {
                                      openChatForProduct(item)
                                    } else {
                                      alert("❌ Produk ini belum memiliki request ID")
                                    }
                                  }}
                                  className="h-8 px-3 bg-blue-600 hover:bg-blue-700 relative"
                                  title="Chat dengan admin tentang produk ini"
                                >
                                  <MessageSquare className="h-4 w-4 mr-1" />
                                  Chat
                                  {/* Unread badge untuk produk ini */}
                                  {((item as any).unread_count || 0) > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                                      {(item as any).unread_count}
                                    </span>
                                  )}
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary Footer */}
                  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                    <div className="flex justify-between items-center flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                        <div>
                          <span className="text-slate-400 text-sm">Item Dipilih:</span>
                          <p className="text-white font-bold text-lg">{selectedCount} dari {wishlist.length} produk</p>
                        </div>
                        <div>
                          <span className="text-slate-400 text-sm">Total Quantity:</span>
                          <p className="text-white font-bold text-lg">{totalQuantity} unit</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 text-sm">Estimasi Harga Total:</span>
                        <p className="text-orange-400 font-bold text-2xl">{formatPrice(selectedTotal)}</p>
                      </div>
                    </div>
                    {selectedCount === 0 && wishlist.length > 0 && (
                      <p className="text-orange-400 text-sm mt-2 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Pilih minimal 1 item untuk mengirim permintaan
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* RIWAYAT PERMINTAAN YANG SUDAH DISUBMIT */}
          {productRequests.length > 0 && (
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <History className="h-5 w-5 text-blue-400" />
                  Riwayat Permintaan
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Daftar permintaan yang sudah dikirim ke tim kami.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {productRequests.map((request) => (
                    <div key={request.id} className="border border-slate-700 rounded-lg overflow-hidden">
                      <div className="bg-slate-800/50 p-4 flex items-center justify-between border-b border-slate-700">
                        <div>
                          <p className="text-white font-bold">{request.request_number || `RFQ-${request.id.slice(0, 8)}`}</p>
                          <p className="text-slate-400 text-sm">
                            {new Date(request.created_at).toLocaleDateString('id-ID', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-slate-400 text-xs">Total Item</p>
                            <p className="text-white font-mono">{request.total_items} produk</p>
                          </div>
                          <div className="text-right">
                            <p className="text-slate-400 text-xs">Estimasi Total</p>
                            <p className="text-orange-400 font-bold">{formatPrice(request.estimated_total)}</p>
                          </div>
                          <Badge className={`${getStatusBadgeColor(request.status)} text-white px-4 py-2`}>
                            {getStatusBadgeText(request.status)}
                          </Badge>
                        </div>
                      </div>
                      {request.items && request.items.length > 0 && (
                        <div className="p-4 space-y-2">
                          {request.items.slice(0, 3).map((item) => (
                            <div key={item.id} className="flex items-center justify-between text-sm">
                              <span className="text-white">{item.product_name}</span>
                              <span className="text-slate-400">×{item.quantity}</span>
                              <Badge className={`${getStatusBadgeColor(item.status)} text-xs`}>
                                {getStatusBadgeText(item.status)}
                              </Badge>
                            </div>
                          ))}
                          {request.items.length > 3 && (
                            <p className="text-slate-500 text-xs text-center">
                              +{request.items.length - 3} produk lainnya
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* TAB 5: CHAT ADMIN - UPDATED WITH SIDEBAR */}
        <TabsContent value="chat" className="space-y-4 mt-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-400" />
                  Chat dengan Admin
                </div>
              </CardTitle>
              <CardDescription className="text-slate-400">
                Komunikasi dengan admin untuk RFQ dan pertanyaan lainnya.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {chatSessions.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium">Belum ada percakapan.</p>
                  <p className="text-sm mt-2">
                    Ajukan RFQ untuk memulai percakapan dengan admin.
                  </p>
                </div>
              ) : (
                // TWO COLUMN LAYOUT
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
                  {/* LEFT SIDEBAR - HISTORY CHAT */}
                  <div className="bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-700 bg-slate-800">
                      <h3 className="text-white font-semibold flex items-center gap-2">
                        <History className="h-4 w-4 text-blue-400" />
                        History Chat
                      </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                      {chatSessions.map((sessionItem) => (
                        <button
                          key={sessionItem.id}
                          onClick={() => {
                            setActiveSession(sessionItem.id)
                            loadMessages(sessionItem.id)
                          }}
                          className={`w-full p-3 rounded-lg text-left transition-colors ${
                            activeSession === sessionItem.id
                              ? 'bg-blue-600/20 border border-blue-500'
                              : 'bg-slate-700/50 border border-slate-600 hover:bg-slate-700'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-mono text-sm font-medium truncate">
                                RFQ-{sessionItem.request_id || sessionItem.id.slice(0, 6)}
                              </p>
                              <p className="text-xs text-slate-400 truncate mt-1">
                                {sessionItem.admin_name || 'Admin'}
                              </p>
                              <p className="text-[10px] text-slate-500 mt-1">
                                {new Date(sessionItem.last_message_at).toLocaleDateString('id-ID', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </p>
                            </div>
                            {activeSession === sessionItem.id && (
                              <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 mt-1" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* RIGHT SIDE - CHAT INTERFACE */}
                  <div className="md:col-span-2 bg-slate-800/30 rounded-lg border border-slate-700 overflow-hidden flex flex-col">
                    {!activeSession ? (
                      <div className="flex-1 flex items-center justify-center text-slate-500">
                        <div className="text-center">
                          <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-30" />
                          <p className="text-lg">Pilih percakapan untuk memulai</p>
                          <p className="text-sm mt-2">Klik salah satu RFQ di sidebar kiri</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* CHAT HEADER */}
                        <div className="p-4 border-b border-slate-700 bg-slate-800/50 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                              <MessageSquare className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <p className="text-white font-medium">
                                {getAdminDisplayName(messages)}
                              </p>
                              <p className="text-xs text-green-400">Online</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setActiveSession(null)}
                            className="border-slate-600 hover:bg-slate-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* MESSAGES AREA */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-900/50">
                          {chatLoading ? (
                            <div className="flex justify-center items-center h-full">
                              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                            </div>
                          ) : messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-500">
                              <MessageSquare className="h-12 w-12 mb-2 opacity-30" />
                              <p className="text-sm">Belum ada pesan</p>
                              <p className="text-xs mt-1">Kirim pesan pertama Anda</p>
                            </div>
                          ) : (
                            messages.map((msg) => {
                              const isUser = msg.sender_type === 'user'
                              return (
                                <div
                                  key={msg.id}
                                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                                >
                                  <div
                                    className={`max-w-[75%] rounded-lg p-3 ${
                                      isUser
                                        ? 'bg-blue-600 text-white rounded-br-none'
                                        : 'bg-slate-700 text-slate-100 rounded-bl-none'
                                    }`}
                                  >
                                    <p className="text-sm">{msg.message}</p>
                                    <p className={`text-[10px] mt-1 ${
                                      isUser ? 'text-blue-200' : 'text-slate-400'
                                    }`}>
                                      {new Date(msg.created_at).toLocaleTimeString('id-ID', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </p>
                                  </div>
                                </div>
                              )
                            })
                          )}
                          <div ref={messagesEndRef} />
                        </div>

                        {/* INPUT AREA */}
                        <div className="p-4 border-t border-slate-700 bg-slate-800/50">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                              placeholder="Ketik pesan..."
                              className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                              disabled={sendingMessage}
                            />
                            <Button
                              onClick={sendMessage}
                              disabled={!newMessage.trim() || sendingMessage}
                              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                            >
                              {sendingMessage ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* MODAL WISHLIST & REQUEST - UPDATED WITH CHECKBOX TABLE */}
      <Dialog open={showRequestModal} onOpenChange={setShowRequestModal}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-orange-400" />
              Buat Permintaan Produk
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Pilih produk dari wishlist Anda dan ajukan permintaan.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 flex-1 overflow-y-auto">
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
              // WISHLIST ITEMS TABLE WITH CHECKBOXES
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-800 text-slate-300 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 w-12">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={selectAllItems}
                          className="h-8 w-8 p-0 hover:bg-slate-700"
                        >
                          {selectedItems.size === wishlist.length ? (
                            <CheckCircle className="h-4 w-4 text-green-400" />
                          ) : (
                            <div className="h-4 w-4 border-2 border-slate-500 rounded" />
                          )}
                        </Button>
                      </th>
                      <th className="px-4 py-3 w-16">Gambar</th>
                      <th className="px-4 py-3">Nama Produk</th>
                      <th className="px-4 py-3 text-right">Harga Satuan</th>
                      <th className="px-4 py-3 text-center">Jumlah</th>
                      <th className="px-4 py-3 text-right">Subtotal</th>
                      <th className="px-4 py-3 text-center">Status</th> 
                      <th className="px-4 py-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  {/* GANTI SELURUH <tbody> DI DALAM DIALOG showRequestModal DENGAN INI */}
                  <tbody className="divide-y divide-slate-800">
                    {wishlist.map((item) => (
                      <tr key={item.product_id} className="hover:bg-slate-800/30">
                        {/* 1. Checkbox */}
                        <td className="px-4 py-3">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleItemSelection(item.product_id)}
                            className="h-8 w-8 p-0 hover:bg-slate-700"
                          >
                            {selectedItems.has(item.product_id) ? (
                              <CheckCircle className="h-4 w-4 text-green-400" />
                            ) : (
                              <div className="h-4 w-4 border-2 border-slate-500 rounded" />
                            )}
                          </Button>
                        </td>

                        {/* 2. Gambar */}
                        <td className="px-4 py-3">
                          {item.product_image_url ? (
                            <img 
                              src={item.product_image_url} 
                              alt={item.product_name}
                              className="w-12 h-12 object-cover rounded-lg border border-slate-600"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center border border-slate-600">
                              <ImageIcon className="h-5 w-5 text-slate-500" />
                            </div>
                          )}
                        </td>

                        {/* 3. Nama Produk */}
                        <td className="px-4 py-3 text-white font-medium">
                          {item.product_name}
                        </td>

                        {/* 4. Harga Satuan */}
                        <td className="px-4 py-3 text-right text-slate-300 font-mono">
                          {formatPrice(item.price)}
                        </td>

                        {/* 5. Jumlah */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
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
                        </td>

                        {/* 6. Subtotal */}
                        <td className="px-4 py-3 text-right text-orange-400 font-bold font-mono">
                          {formatPrice(item.price * item.quantity)}
                        </td>

                        {/* 7. Status Badge (PINDAHKAN KE SINI) */}
                        {/* 7. STATUS BADGE (MODERN STYLE) */}
                        <td className="px-4 py-3 text-center">
                          <Button
                            size="sm"
                            variant="ghost" // Ganti variant jadi ghost agar lebih clean
                            onClick={() => handleStatusClick(item as any)}
                            className={`h-8 px-3 gap-2 font-medium ${getStatusBadgeColor((item as any).status || 'wishlist')}`}
                          >
                            {/* Render Icon Dinamis */}
                            {(() => {
                              const statusInfo = getStatusMessage((item as any).status || 'wishlist');
                              const IconComponent = statusInfo.icon;
                              return <IconComponent className="h-4 w-4" />;
                            })()}
                            
                            {getStatusBadgeText((item as any).status || 'wishlist')}
                          </Button>
                        </td>

                        {/* 8. Aksi (Delete Button) */}
                        <td className="px-4 py-3 text-center">
                          {(item as any).status === 'wishlist' ? (
                            // Tombol trash untuk wishlist
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => removeItem(item.product_id)}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          ) : (
                            // ✅ TOMBOL CHAT untuk produk requested/accepted/deal
                            <Button
                              size="sm"
                              onClick={() => openChatForProduct(item)}
                              className="h-8 w-8 p-0 bg-blue-600 hover:bg-blue-700 relative"
                            >
                              <MessageSquare className="h-4 w-4" />
                              {/* Unread badge untuk produk ini */}
                              {((item as any).unread_count || 0) > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                                  {(item as any).unread_count}
                                </span>
                              )}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {wishlist.length > 0 && (
            <div className="border-t border-slate-700 pt-4 flex-shrink-0">
              {/* SELECTED ITEMS INFO & TOTAL ESTIMATE */}
              <div className="mb-4 bg-slate-800/50 rounded-lg p-4">
                <div className="flex justify-between items-center flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-slate-400 text-sm">Item Dipilih:</span>
                      <p className="text-white font-bold text-lg">{selectedCount} dari {wishlist.length} produk</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-sm">Total Quantity:</span>
                      <p className="text-white font-bold text-lg">{totalQuantity} unit</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-sm">Estimasi Harga Total:</span>
                    <p className="text-orange-400 font-bold text-2xl">{formatPrice(selectedTotal)}</p>
                  </div>
                </div>
                {selectedCount === 0 && (
                  <p className="text-orange-400 text-sm mt-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Pilih minimal 1 item untuk melanjutkan
                  </p>
                )}
              </div>

              <DialogFooter className="gap-2">
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
                    disabled={submittingRequest || selectedCount === 0}
                  >
                    {submittingRequest ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Lanjut ke Konfirmasi ({selectedCount} Item)
                      </>
                    )}
                  </Button>
                </div>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL KONFIRMASI SEBELUM KIRIM */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-400">
              <CheckCircle className="h-6 w-6" />
              Konfirmasi Permintaan
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Review kembali permintaan Anda sebelum dikirim ke tim kami.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <p className="text-slate-400 text-sm">Total Produk</p>
                <p className="text-white font-bold text-2xl">{selectedCount}</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <p className="text-slate-400 text-sm">Total Quantity</p>
                <p className="text-white font-bold text-2xl">{totalQuantity}</p>
              </div>
            </div>

            {/* Selected Items List */}
            <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700 max-h-60 overflow-y-auto">
              <p className="text-slate-400 text-sm mb-3 font-medium">Produk yang Dipilih:</p>
              <div className="space-y-2">
                {wishlist
                  .filter(item => selectedItems.has(item.product_id))
                  .map((item) => (
                    <div key={item.product_id} className="flex justify-between items-center text-sm gap-2">
                      {/* Nama Produk - Truncate dengan Ellipsis */}
                      <div className="flex-1 min-w-0">
                        <p className="text-white truncate" title={item.product_name}>
                          {item.product_name.length > 40 
                            ? `${item.product_name.substring(0, 40)}...` 
                            : item.product_name}
                        </p>
                      </div>
                      {/* Quantity */}
                      <span className="text-slate-400 text-xs whitespace-nowrap">
                        ×{item.quantity}
                      </span>
                      {/* Harga */}
                      <span className="text-orange-400 font-mono text-xs whitespace-nowrap">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Total Estimate */}
            <div className="bg-orange-900/20 rounded-lg p-4 border border-orange-700">
              <div className="flex justify-between items-center">
                <span className="text-orange-300 font-medium">Estimasi Total Harga:</span>
                <span className="text-orange-400 font-bold text-2xl">{formatPrice(selectedTotal)}</span>
              </div>
              <p className="text-orange-300/60 text-xs mt-2">
                *Harga dapat berubah sesuai penawaran dari supplier
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowConfirmModal(false)}
              className="border-slate-600"
              disabled={submittingRequest}
            >
              Batal
            </Button>
            <Button
              onClick={confirmSubmitRequest}
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
                  Kirim Permintaan
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-3 text-lg ${
              selectedStatusItem ? getStatusMessage((selectedStatusItem as any).status || 'wishlist').color : 'text-slate-400'
            }`}>
              {/* Icon Besar di Header */}
              {selectedStatusItem && (() => {
                const IconComp = getStatusMessage((selectedStatusItem as any).status || 'wishlist').icon;
                return <IconComp className="h-6 w-6" />;
              })()}
              
              {selectedStatusItem && getStatusMessage((selectedStatusItem as any).status || 'wishlist').title}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            {selectedStatusItem && (
              <>
                {/* Info Produk */}
                <div className="bg-slate-800/50 rounded-lg p-4 mb-4 border border-slate-700 flex gap-4">
                  {/* ... (kode gambar produk tetap sama) ... */}
                  <div className="flex-1">
                      <p className="text-white font-medium">{selectedStatusItem.product_name}</p>
                      <p className="text-slate-400 text-sm">Qty: {selectedStatusItem.quantity}</p>
                      <p className="text-orange-400 font-bold">{formatPrice((selectedStatusItem as any).price)}</p>
                  </div>
                </div>

                {/* Pesan Status dengan Background Baru */}
                <div className={`rounded-lg p-4 border ${
                  getStatusMessage((selectedStatusItem as any).status || 'wishlist').bgColor
                } ${
                  getStatusMessage((selectedStatusItem as any).status || 'wishlist').borderColor
                }`}>
                  <p className={`text-sm leading-relaxed ${
                    getStatusMessage((selectedStatusItem as any).status || 'wishlist').color
                  }`}>
                    {getStatusMessage((selectedStatusItem as any).status || 'wishlist', (selectedStatusItem as any).admin_notes).message}
                  </p>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setShowStatusModal(false)} className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-600">
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}