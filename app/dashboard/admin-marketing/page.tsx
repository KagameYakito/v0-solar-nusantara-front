'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Package, ArrowLeft, AlertCircle, Loader2, Edit2, X, Check, Gavel, 
  MessageSquare, Clock, DollarSign, TrendingUp, FileText, Timer, Eye, 
  EyeOff, Image as ImageIcon, Upload, Trash2, Save, Search, Bookmark, 
  CheckCircle2, CheckCircle, XCircle, Hourglass, CreditCard, FileCheck, Lock, Plus, Circle, CircleDot
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'

interface Product {
  id: string
  nama_produk: string | null
  harga: number | null
  sku: string | null
  gambar_url: string | null
  created_at: string
  harga_updated_at: string | null  // ✅ TAMBAHKAN INI
  auction_started_at: string | null // ✅ TAMBAHKAN INI
  is_auction: boolean
  is_request: boolean
  auction_start_price: number | null
  auction_increment: number | null
  auction_end_time: string | null
  auction_duration_days: number | null
  bid_deadline_duration: number | null
  bid_deadline_time: string | null
  auction_active: boolean
  auction_description: string | null
  auction_gallery_urls: string[] | null
  current_bid_price: number | null
  current_bidder_id: string | null
  finished_auction_id: string | null
  auction_winner_name: string | null
  auction_ended_at: string | null
  auction_end_reason: string | null
}

interface GroupedWishlistItem {
  wishlist_id: number
  request_id: number | null
  user_id: string
  user_name: string
  company_name: string
  product_sku: string
  total_quantity: number
  total_price: number
  status: string
  created_at: string
  items: any[]
  product_count: number // Array of individual items
}

// ✅ INTERFACE KHUSUS ADMIN MARKETING (TERPISAH)
interface AdminMarketingProfile {
  id: string
  admin_id: string
  admin_name: string
  admin_phone: string
  profile_completed: boolean
}

// ✅ INTERFACE UNTUK ASSIGNMENT TRACKING
interface ClientAssignment {
  id: string
  admin_id: string
  user_id: string
  assigned_at: string
  last_contact_at: string | null
  notes: string | null
  status: 'active' | 'inactive'
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const ITEMS_PER_PAGE = 100
const REALTIME_DEBOUNCE_MS = 500

/** Generate a short collision-resistant finished-auction ID, e.g. #A3F59C2B */
const generateFinishedAuctionId = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let suffix = ''
  for (let i = 0; i < 8; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `#${suffix}`
}

export default function AdminMarketingDashboard() {
  const router = useRouter()
  
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedTerm, setDebouncedTerm] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  // ✅ UPDATED: Include 'wishlist' in filterView
  const [filterView, setFilterView] = useState<'all' | 'auction' | 'request' | 'wishlist' | 'finished'>('all')

  const [auctionHistory, setAuctionHistory] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  
  const [showEditPriceModal, setShowEditPriceModal] = useState(false)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [editingPrice, setEditingPrice] = useState('')
  const [priceSaving, setPriceSaving] = useState(false)
  
  const [showAuctionModal, setShowAuctionModal] = useState(false)
  const [isEditingAuction, setIsEditingAuction] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [auctionConfig, setAuctionConfig] = useState({
    startPrice: '',
    increment: '',
    durationDays: '14',
    bidDeadlineDays: '3',
    description: ''
  })
  const [auctionLoading, setAuctionLoading] = useState(false)
  
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [existingGalleryUrls, setExistingGalleryUrls] = useState<string[]>([])
  
  const [showBidDeadline, setShowBidDeadline] = useState<Record<string, boolean>>({})
  
  // ✅ WISHLIST ANALYTICS STATE
  const [wishlistItems, setWishlistItems] = useState<GroupedWishlistItem[]>([])
  const [wishlistTotal, setWishlistTotal] = useState(0)
  const [wishlistLoading, setWishlistLoading] = useState(false)
  const [wishlistFilter, setWishlistFilter] = useState<'all' | 'deal' | 'pending' | 'requested' | 'wishlist' | 'declined'>('all')
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [selectedWishlistItem, setSelectedWishlistItem] = useState<any>(null)
  const [adminNote, setAdminNote] = useState('')
  const [noteSaving, setNoteSaving] = useState(false)
  const [showProductDetailModal, setShowProductDetailModal] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<any[]>([])

  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false)
  const [cancellingProductId, setCancellingProductId] = useState<string | null>(null)
  const [cancellingProductName, setCancellingProductName] = useState<string>('')
  const [descriptionLength, setDescriptionLength] = useState(0)

  const [showProfileModal, setShowProfileModal] = useState(false)
  const [adminProfile, setAdminProfile] = useState<AdminMarketingProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileData, setProfileData] = useState({
    admin_name: '',
    admin_phone: ''
  })
  const [blockingFeature, setBlockingFeature] = useState<string | null>(null)
  const [userAssignments, setUserAssignments] = useState<Map<string, ClientAssignment>>(new Map())
  const [isEditingProfile, setIsEditingProfile] = useState(false)

  const [otherAdmins, setOtherAdmins] = useState<any[]>([])
  const [adminMessages, setAdminMessages] = useState<any[]>([])
  // ✅ STATE UNTUK CHAT FUNCTIONALITY
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [showChatModal, setShowChatModal] = useState(false)
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const adminMessagesEndRef = useRef<HTMLDivElement>(null)

  // ✅ CHAT MODAL STATES
  const [selectedChatSession, setSelectedChatSession] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [selectedAdminForTakeover, setSelectedAdminForTakeover] = useState('');
  const [chatInput, setChatInput] = useState('')

  const STATUS_PRIORITY: Record<string, number> = {
    'deal': 1,
    'pending': 2,
    'requested': 3,
    'wishlist': 4,
    'declined': 5
  }

  const fetchWishlistItems = useCallback(async () => {
    try {
      setWishlistLoading(true)
      
      // 1. Fetch wishlist dengan wishlist_id
      let query = supabase
        .from('wishlists')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
      
      if (wishlistFilter !== 'all') {
        query = query.eq('status', wishlistFilter)
      }
      
      const { data: wishlistData, error: wishlistError, count } = await query
      
      if (wishlistError) throw wishlistError
      if (!wishlistData || wishlistData.length === 0) {
        setWishlistItems([])
        setWishlistTotal(count || 0)
        return
      }
      
      // 2. Fetch profiles user
      const userIds = [...new Set(wishlistData.map(w => w.user_id))]
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, company_name, email')
        .in('id', userIds)
      
      // 3. Fetch products (include SKU!)
      const productIds = [...new Set(wishlistData.map(w => w.product_id))]
      const { data: productsData } = await supabase
        .from('products')
        .select('id, nama_produk, harga, gambar_url, sku')
        .in('id', productIds)
      
      // 4. GROUP BY USER + STATUS (BUKAN USER SAJA!)
      const groupedMap = new Map<string, GroupedWishlistItem>()
      
      wishlistData.forEach(item => {
        const profile = profilesData?.find(p => p.id === item.user_id)
        const product = productsData?.find(p => p.id.toString() === item.product_id.toString())
        
        // ✅ SYNC DATA PRODUK TERBARU
        const syncedItem = {
          ...item,
          product_name: product?.nama_produk || item.product_name,  // ✅ SYNC NAMA
          product_image_url: product?.gambar_url || item.product_image_url,  // ✅ SYNC GAMBAR
          price: product?.harga || item.price || 0  // ✅ SYNC HARGA
        }
        
        // ✅ KEY BARU: user_id + status (jadi requested & wishlist terpisah!)
        const groupKey = `${item.user_id}-${item.status}`
        
        if (!groupedMap.has(groupKey)) {
          groupedMap.set(groupKey, {
            wishlist_id: item.wishlist_id || 0,
            request_id: item.request_id || null,
            user_id: item.user_id,
            user_name: profile?.full_name || 'Anonymous',
            company_name: profile?.company_name || '-',
            product_sku: product?.sku || `SKU-${item.product_id}`,
            total_quantity: item.quantity,
            total_price: (product?.harga || item.price || 0) * item.quantity,
            status: item.status,
            created_at: item.created_at,
            items: [syncedItem],  // ✅ PAKAI DATA YANG SUDAH DI-SYNC
            product_count: 1
          })
        } else {
          const group = groupedMap.get(groupKey)!
          group.total_quantity += item.quantity
          group.total_price += (product?.harga || item.price || 0) * item.quantity
          group.items.push(syncedItem)  // ✅ PAKAI DATA YANG SUDAH DI-SYNC
          group.product_count += 1
          
          // Gunakan wishlist_id terkecil
          if (item.wishlist_id && item.wishlist_id < group.wishlist_id) {
            group.wishlist_id = item.wishlist_id
          }
          
          // Gunakan request_id jika ada
          if (item.request_id && !group.request_id) {
            group.request_id = item.request_id
          }
        }
      })
      
      // 5. Convert to array & sort
      const groupedData = Array.from(groupedMap.values())
      const sortedData = groupedData.sort((a, b) => {
        return (STATUS_PRIORITY[a.status] || 99) - (STATUS_PRIORITY[b.status] || 99)
      })
      
      setWishlistItems(sortedData)
      setWishlistTotal(count || 0)
    } catch (err: any) {
      console.error("Failed to fetch wishlist:", err)
    } finally {
      setWishlistLoading(false)
    }
  }, [wishlistFilter])

  useEffect(() => {
    if (isAuthorized) {
      fetchWishlistItems()
    }
  }, [isAuthorized, wishlistFilter])

  const fetchOtherAdmins = async () => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        
        // Assuming you have an admin_marketing_profiles table
        const { data } = await supabase
            .from('admin_marketing_profiles')
            .select('id, admin_name')
            .neq('admin_id', session.user.id); // Exclude current admin
        
        setOtherAdmins(data || []);
    } catch (err) {
        console.error("Error fetching admins:", err);
    }
  };

  const loadMessagesForAdmin = async (sessionId: string) => {
    try {
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
      
      // ✅ PERBAIKAN TIPE: Casting ke any[] agar tidak error ParserError
      const messages = (data as any[]) || []
      setChatMessages(messages)
      
      // Fitur Auto Read: Tandai pesan dari user sebagai terbaca
      const unreadUserMessages = messages.filter(m => m.sender_type === 'user' && !m.is_read)
      if (unreadUserMessages.length > 0) {
        await supabase
          .from('chat_messages')
          .update({ is_read: true })
          .in('id', unreadUserMessages.map(m => m.id))
      }
    } catch (err) {
      console.error("Error fetching chat messages:", err)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeSession) return
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      
      const { error } = await supabase.rpc('send_chat_message', {
        p_session_id: activeSession,
        p_sender_id: session.user.id,
        p_message: newMessage.trim(),
        p_sender_type: 'admin'
      })
      
      if (error) throw error
      setNewMessage('')
      await loadAdminChatMessages(activeSession)
    } catch (err) {
      alert("Gagal mengirim pesan")
    }
  }

const handleOpenChatForRequest = (request: any) => {
  setSelectedChatSession(request);
  loadMessagesForAdmin(request.id);
  fetchOtherAdmins();
};
  
  // Handle take over
  const handleTakeOver = async () => {
    if (!selectedAdminForTakeover || !selectedChatSession) return;
    
    try {
        // Update chat session admin_id
        const { error } = await supabase
            .from('chat_sessions')
            .update({ admin_id: selectedAdminForTakeover })
            .eq('id', selectedChatSession.id);
            
        if (error) throw error;
        
        alert("Chat diambil alih!");
        setSelectedChatSession(null); // Close modal or refresh
    } catch (err) {
        alert("Gagal mengambil alih chat");
    }
};

  // ✅ REALTIME CHAT SUBSCRIPTION - PERBAIKI
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
          setChatMessages((prev: any) => [...prev, payload.new])
        }
      )
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeSession])
  
  // Load chat messages untuk admin
  const loadAdminChatMessages = async (sessionId: string) => {
    try {
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
      setChatMessages(data || [])
    } catch (err) {
      console.error("Error loading messages:", err)
    }
  }

  const getAdminDisplayName = (session: any) => {
    // ✅ GUNAKAN chatMessages, BUKAN messages
    // Pastikan kamu punya state: const [chatMessages, setChatMessages] = useState([])
    const adminHasReplied = chatMessages?.some(
      (msg: any) => msg.sender_type === 'admin'
    )
    
    if (adminHasReplied && session.admin_name) {
      return session.admin_name 
    }
    return 'Admin' 
  }

  const fetchAuctionHistory = useCallback(async () => {
    try {
      setHistoryLoading(true)
      const { data, error } = await supabase
        .from('auction_history')
        .select('*')
        .order('auction_end_time', { ascending: false })
      
      if (error) throw error
      setAuctionHistory(data || [])
    } catch (err: any) {
      console.error("Failed to fetch auction history:", err)
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
  if (isAuthorized) {
    fetchProducts()
    if (filterView === 'finished') {
      fetchAuctionHistory() // ✅ Fetch dari auction_history
    }
  }
}, [isAuthorized, filterView])

// ✅ LOAD PROFIL DARI TABEL TERPISAH
const loadAdminMarketingProfile = useCallback(async (adminId: string) => {
  try {
    setProfileLoading(true)
    
    // ✅ QUERY DARI TABEL admin_marketing_profiles (BUKAN profiles!)
    const { data, error } = await supabase
      .from('admin_marketing_profiles')
      .select('*')
      .eq('admin_id', adminId)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error // PGRST116 = not found
    
    setAdminProfile(data)
    
    // ✅ JIKA BELUM ADA PROFIL ATAU BELUM LENGKAP
    if (!data || !data.profile_completed) {
      setShowProfileModal(true)
      if (data) {
        setProfileData({
          admin_name: data.admin_name || '',
          admin_phone: data.admin_phone || ''
        })
      }
    }
  } catch (err) {
    console.error("Failed to load admin marketing profile:", err)
    // Jika belum ada profil sama sekali, tampilkan modal
    setShowProfileModal(true)
  } finally {
    setProfileLoading(false)
  }
}, [])

// ✅ LOAD USER ASSIGNMENTS (untuk tracking client)
const loadUserAssignments = useCallback(async (adminId: string) => {
  try {
    const { data, error } = await supabase
      .from('admin_client_assignments')
      .select('*')
      .eq('admin_id', adminId)
      .eq('status', 'active')
    
    if (error) throw error
    
    const assignmentsMap = new Map<string, ClientAssignment>()
    data?.forEach(assignment => {
      assignmentsMap.set(assignment.user_id, assignment)
    })
    
    setUserAssignments(assignmentsMap)
  } catch (err) {
    console.error("Failed to load user assignments:", err)
  }
}, [])

// ✅ BUKA MODAL EDIT PROFIL DARI HEADER
const openEditProfileModal = () => {
  if (adminProfile) {
    setProfileData({
      admin_name: adminProfile.admin_name || '',
      admin_phone: adminProfile.admin_phone || ''
    })
  }
  setIsEditingProfile(true)
  setShowProfileModal(true)
}

// Ganti fungsi fetchChatMessages yang lama dengan ini:
const fetchChatMessages = async (sessionId: string) => {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        sender_profile:profiles!sender_id(full_name),
        admin_profile:admin_marketing_profiles!sender_id(admin_name)
      `)  // ← Hapus comment di dalam string
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    setChatMessages(data || []);

    // FITUR AUTO READ: Tandai pesan dari user sebagai terbaca
    const unreadUserMessages = data?.filter(m => m.sender_type === 'user' && !m.is_read) || [];
    if (unreadUserMessages.length > 0) {
      await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .in('id', unreadUserMessages.map(m => m.id));
    }
  } catch (err) {
    console.error("Error fetching chat messages:", err);
  }
};

// Ganti fungsi sendChatMessage yang lama dengan ini:
const sendChatMessage = async (sessionId: string, message: string) => {
  if (!message.trim()) return;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase.rpc('send_chat_message', {
      p_session_id: sessionId, // Kirim UUID
      p_sender_id: session.user.id,
      p_message: message.trim(),
      p_sender_type: 'admin'
    });

    if (error) throw error;

    setChatInput('');
    // Refresh pesan agar pesan baru muncul langsung
    await fetchChatMessages(sessionId);
    
  } catch (err) {
    console.error("Error sending message:", err);
    alert("Gagal mengirim pesan: " + (err as Error).message);
  }
};

// Perbaiki fungsi openChatWithClient
const openChatWithClient = async (item: any) => {
  console.log("Opening chat for item:", item);
  const requestId = item.request_id;
  
  if (!requestId) {
  alert("❌ Item ini tidak memiliki request_id");
  return;
  }
  
  try {
  // Set session ID dengan format yang benar
  const sessionId = `rfq-${requestId}`;
  
  // ✅ LANGSUNG BUKA CHAT TANPA VALIDASI
  // Load messages (kalau ada)
  await fetchChatMessages(requestId);
  
  // Set active session
  setActiveSession(sessionId);
  setSelectedClient(item);
  
  // Setup realtime subscription
  setupChatRealtimeSubscription(sessionId);
  
  // ✅ OPSIONAL: Jika chat session belum ada, buat otomatis
  const { data: existingSession } = await supabase
  .from('chat_sessions')
  .select('id')
  .eq('session_id', sessionId)
  .single();
  
  if (!existingSession) {
  // Buat chat session baru jika belum ada
  await supabase
  .from('chat_sessions')
  .insert({
  session_id: sessionId,
  request_id: requestId,
  user_id: item.user_id,
  admin_id: adminProfile?.admin_id, // ID admin yang sedang login
  status: 'active',
  created_at: new Date().toISOString()
  });
  }
  
  } catch (err) {
  console.error("Error opening chat:", err);
  alert("❌ Gagal membuka chat. Silakan coba lagi.");
  }
  }

// Tambahkan fungsi realtime subscription
const setupChatRealtimeSubscription = (sessionId: string) => {
  const channel = supabase
    .channel(`chat:${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `session_id=eq.${sessionId}`
      },
      (payload) => {
        console.log('🔵 New message received:', payload.new);
        setChatMessages((prev: any) => [...prev, payload.new]);
      }
    )
    .subscribe();
    
  return () => {
    supabase.removeChannel(channel);
  };
}

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'deal':
        return { label: 'Deal', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CreditCard }
      case 'pending':
        return { label: 'Pending', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: Hourglass }
      case 'accepted':
        return { label: 'Menunggu Bayar', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: Hourglass }
      case 'requested':
        return { label: 'Requested', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: FileCheck }
      case 'wishlist':
        return { label: 'Wishlist', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20', icon: Bookmark }
      case 'declined':
        return { label: 'Declined', color: 'bg-red-500/10 text-red-400 border-red-500/20', icon: XCircle }
      default:
        return { label: status, color: 'bg-slate-500/10 text-slate-400 border-slate-500/20', icon: Clock }
    }
  }

  const handleSaveNote = async () => {
    if (!selectedWishlistItem) return
    
    try {
      setNoteSaving(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      const { error } = await supabase
        .from('wishlists')
        .update({
          admin_notes: adminNote,
          admin_id: session?.user.id,
          status_updated_at: new Date().toISOString()
        })
        .eq('id', selectedWishlistItem.id)
      
      if (error) throw error
      
      await fetchWishlistItems()
      setShowNoteModal(false)
      setSelectedWishlistItem(null)
      setAdminNote('')
      alert("✅ Note berhasil disimpan!")
    } catch (err: any) {
      alert("❌ Gagal menyimpan note: " + err.message)
    } finally {
      setNoteSaving(false)
    }
  }

  const updateWishlistStatus = async (itemId: string, action: 'accept' | 'decline' | 'mark_deal') => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      let finalStatus = ''
      let message = ''
  
      if (action === 'accept') {
        finalStatus = 'accepted' // User lihat "Accepted", Admin lihat "Menunggu Bayar"
        message = 'Accept'
      } else if (action === 'decline') {
        finalStatus = 'declined'
        message = 'Decline'
      } else if (action === 'mark_deal') {
        finalStatus = 'deal'
        message = 'Deal Closed'
      }
  
      if (!finalStatus) return
  
      const { error } = await supabase
        .from('wishlists')
        .update({
          status: finalStatus,
          admin_id: session?.user.id,
          status_updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
      
      if (error) throw error
      
      await fetchWishlistItems()
      alert(`✅ Item berhasil di-${message}!`)
    } catch (err: any) {
      alert("❌ Gagal update status: " + err.message)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm)
      setCurrentPage(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
      
      if (debouncedTerm) {
        query = query.ilike('nama_produk', `%${debouncedTerm}%`)
      }
      
      if (filterView === 'auction') {
        query = query.eq('is_auction', true).eq('auction_active', true)
      } else if (filterView === 'finished') {
        // ✅ TAMPILKAN LELANG YANG SUDAH SELESAI/DIBATALKAN
        query = query.eq('is_auction', true).eq('auction_active', false)
      } else if (filterView === 'request') {
        query = query.eq('is_request', true)
      }
      
      const start = (currentPage - 1) * ITEMS_PER_PAGE
      const end = start + ITEMS_PER_PAGE - 1
      query = query.range(start, end)
      
      const { data, error, count } = await query
      
      if (error) throw error
      
      setProducts(data || [])
      setTotalProducts(count || 0)
    } catch (err: any) {
      console.error("Failed to fetch products:", err)
      setError("Gagal memuat data produk: " + err.message)
    } finally {
      setLoading(false)
    }
  }, [currentPage, debouncedTerm, filterView])

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
        
        // ✅ CHECK ROLE DARI TABLE profiles (user biasa)
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
        
        if (!profile || (profile.role !== 'admin_marketing' && profile.role !== 'super_admin')) {
          window.location.href = '/'
          return
        }
        
        // ✅ AUTHORIZED - LOAD ADMIN PROFILE DARI TABEL TERPISAH
        if (isMounted) {
          setIsAuthorized(true)
          
          // ✅ LOAD PROFIL ADMIN MARKETING
          await loadAdminMarketingProfile(session.user.id)
          
          // ✅ LOAD USER ASSIGNMENTS
          await loadUserAssignments(session.user.id)
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
  }, [loadAdminMarketingProfile, loadUserAssignments])

// ✅ SAVE PROFIL KE TABEL TERPISAH
const handleSaveProfile = async () => {
  // ✅ VALIDASI: TIDAK BOLEH KOSONG
  const trimmedName = profileData.admin_name.trim()
  const trimmedPhone = profileData.admin_phone.trim()
  
  if (!trimmedName || !trimmedPhone) {
    alert("❌ Nama dan nomor telepon wajib diisi!")
    return
  }

  // ✅ VALIDASI NOMOR TELEPON
  const phoneRegex = /^(?:\+62|62|0)8[1-9][0-9]{6,11}$/
  const normalizedPhone = trimmedPhone.replace(/\s+/g, '')
  
  if (!phoneRegex.test(normalizedPhone)) {
    alert("❌ Format nomor telepon tidak valid!\nContoh: 081234567890")
    return
  }

  try {
    setProfileLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user.id) throw new Error("No session")
    
    // ✅ CHECK APAKAH SUDAH ADA RECORD
    const { data: existing } = await supabase
      .from('admin_marketing_profiles')
      .select('id')
      .eq('admin_id', session.user.id)
      .single()
    
    let error
    
    if (existing) {
      // ✅ UPDATE
      const { error: updateError } = await supabase
        .from('admin_marketing_profiles')
        .update({
          admin_name: trimmedName,
          admin_phone: normalizedPhone,
          profile_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('admin_id', session.user.id)
      error = updateError
    } else {
      // ✅ INSERT BARU
      const { error: insertError } = await supabase
        .from('admin_marketing_profiles')
        .insert({
          admin_id: session.user.id,
          admin_name: trimmedName,
          admin_phone: normalizedPhone,
          profile_completed: true
        })
      error = insertError
    }
    
    if (error) throw error
    
    // ✅ RELOAD PROFILE
    await loadAdminMarketingProfile(session.user.id)
    setShowProfileModal(false)
    setIsEditingProfile(false)
    alert("✅ Profil berhasil diupdate!")
    
    // ✅ UNBLOCK FITUR
    if (blockingFeature) {
      const feature = blockingFeature
      setBlockingFeature(null)
      if (feature === 'wishlist') setFilterView('wishlist')
      else if (feature === 'request') setFilterView('request')
    }
  } catch (err: any) {
    alert("❌ Gagal menyimpan profil: " + err.message)
  } finally {
    setProfileLoading(false)
  }
}

// ✅ CEK PROFIL SEBELUM AKSES FITUR
const checkProfileBeforeAccess = (feature: 'wishlist' | 'request'): boolean => {
  if (!adminProfile?.profile_completed || !adminProfile?.admin_name || !adminProfile?.admin_phone) {
    setBlockingFeature(feature)
    setShowProfileModal(true)
    return false
  }
  return true
}

// ✅ ASSIGN CLIENT KE ADMIN (untuk tracking)
const assignClientToAdmin = async (userId: string, userName: string) => {
  if (!adminProfile) return
  
  try {
    // Cek apakah sudah assigned
    if (userAssignments.has(userId)) {
      console.log(`User ${userName} sudah di-handle oleh admin lain`)
      return
    }
    
    // Create assignment
    const { error } = await supabase.rpc('create_admin_assignment', {
      p_admin_id: adminProfile.admin_id,
      p_user_id: userId
    })
    
    if (error) throw error
    
    // Reload assignments
    await loadUserAssignments(adminProfile.admin_id)
    
    alert(`✅ Client ${userName} berhasil di-assign ke Anda!`)
  } catch (err: any) {
    console.error("Failed to assign client:", err)
  }
}

  useEffect(() => {
    if (isAuthorized) {
      fetchProducts()
    }
  }, [isAuthorized, fetchProducts])

  // ✅ REALTIME SUBSCRIPTION - Sinkronkan admin dashboard dengan database lelang
  // Ketika user melakukan bid atau admin lain mengakhiri lelang, tampilan diperbarui otomatis
  useEffect(() => {
    if (!isAuthorized) return

    let isMounted = true
    let productsChannel: ReturnType<typeof supabase.channel> | null = null
    let historyChannel: ReturnType<typeof supabase.channel> | null = null
    let debounceTimer: ReturnType<typeof setTimeout> | null = null

    const debouncedRefreshProducts = () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        if (!isMounted) return
        fetchProducts()
      }, REALTIME_DEBOUNCE_MS)
    }

    // Saat user melakukan bid, products.current_bid_price / current_bidder_id / bid_deadline_time diperbarui
    productsChannel = supabase
      .channel('admin-products-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'products'
        },
        (payload: any) => {
          // Refresh jika ada perubahan pada produk lelang
          if (payload?.new?.is_auction) {
            debouncedRefreshProducts()
          }
        }
      )
      .subscribe()

    // Saat lelang diselesaikan (dari admin lain atau dari halaman auctions),
    // perbarui juga tabel history agar filterView === 'finished' langsung ter-update
    historyChannel = supabase
      .channel('admin-auction-history-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'auction_history'
        },
        () => {
          if (!isMounted) return
          // Refresh produk dan history sekaligus
          fetchProducts()
          fetchAuctionHistory()
        }
      )
      .subscribe()

    return () => {
      isMounted = false
      if (debounceTimer) clearTimeout(debounceTimer)
      if (productsChannel) supabase.removeChannel(productsChannel)
      if (historyChannel) supabase.removeChannel(historyChannel)
    }
  }, [isAuthorized, fetchProducts, fetchAuctionHistory])

  const openEditPriceModal = (productId: string, currentPrice: number | null) => {
    setEditingProductId(productId)
    setEditingPrice((currentPrice || 0).toString())
    setShowEditPriceModal(true)
  }

  const handleSavePrice = async () => {
    if (!editingProductId) return
    
    const newPrice = parseInt(editingPrice)
    
    if (isNaN(newPrice) || newPrice <= 0) {
      alert("❌ Harga harus valid dan lebih dari 0!")
      return
    }
    
    try {
      setPriceSaving(true)
      
      const { error } = await supabase
        .from('products')
        .update({ harga: newPrice })
        .eq('id', editingProductId)
      
      if (error) throw error
      
      await fetchProducts()
      
      setShowEditPriceModal(false)
      setEditingProductId(null)
      setEditingPrice('')
      
      alert("✅ Harga produk berhasil diupdate di database!")
    } catch (err: any) {
      console.error("Failed to update price:", err)
      alert("❌ Gagal update harga: " + err.message)
    } finally {
      setPriceSaving(false)
    }
  }

  // ✅ Check bid deadline dan auto-end auction
  useEffect(() => {
    const checkBidDeadlines = async () => {
      const now = new Date().getTime()
      
      for (const product of products) {
        if (product.auction_active && 
            product.bid_deadline_time && 
            product.current_bid_price && 
            product.current_bid_price > 0) {
          
          const bidDeadline = new Date(product.bid_deadline_time).getTime()
          
          if (bidDeadline < now) {
            try {
              // 1. Lookup winner name before ending
              let winnerName: string | null = null
              if (product.current_bidder_id) {
                const { data: profileData } = await supabase
                  .from('profiles')
                  .select('full_name')
                  .eq('id', product.current_bidder_id)
                  .single()
                winnerName = profileData?.full_name || null
              }

              const endReason = product.current_bid_price && product.current_bid_price > 0 
                ? 'completed' 
                : 'no_bids'

              // 2. Get bid count before any changes
              const { count: bidCount } = await supabase
                .from('auction_bids')
                .select('*', { count: 'exact', head: true })
                .eq('product_id', product.id)

              // 3. Insert to auction_history (including image fields for persistent display)
              const finishedId = generateFinishedAuctionId()
              await supabase.from('auction_history').insert({
                product_id: product.id,
                product_name: product.nama_produk,
                start_price: product.auction_start_price || 0,
                final_price: product.current_bid_price || product.auction_start_price || 0,
                winner_id: product.current_bidder_id,
                winner_name: winnerName,
                finished_auction_id: finishedId,
                auction_start_time: product.auction_started_at,
                auction_end_time: new Date().toISOString(),
                auction_end_reason: endReason,
                total_bids: bidCount || 0,
                gambar_url: product.gambar_url,
                auction_gallery_urls: product.auction_gallery_urls,
                auction_description: product.auction_description
              })

              // 4. Update product — preserve display fields for auction page
              await supabase
                .from('products')
                .update({
                  auction_active: false,
                  is_auction: true,
                  auction_end_time: null,
                  auction_duration_days: null,
                  bid_deadline_duration: null,
                  bid_deadline_time: null,
                  finished_auction_id: finishedId,
                  auction_end_reason: endReason,
                  auction_ended_at: new Date().toISOString(),
                  auction_winner_name: winnerName
                })
                .eq('id', product.id)
              
              alert(`⏰ Lelang "${product.nama_produk}" telah berakhir!`)
              fetchProducts()
            } catch (err) {
              console.error("Failed to auto-end auction:", err)
            }
          }
        }
      }
    }
    
    const interval = setInterval(checkBidDeadlines, 10000)
    return () => clearInterval(interval)
  }, [products])

  const [timeRemaining, setTimeRemaining] = useState<Record<string, { auction: string; bidDeadline: string }>>({})
  
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime()
      const newTimeRemaining: Record<string, { auction: string; bidDeadline: string }> = {}
      
      products.forEach(product => {
        const auctionEnd = product.auction_end_time ? new Date(product.auction_end_time).getTime() : 0
        const bidDeadline = product.bid_deadline_time ? new Date(product.bid_deadline_time).getTime() : 0
        
        // ✅ CEK APAKAH LELANG MASIH AKTIF
        if (auctionEnd > 0 && product.auction_active) {
          const auctionDistance = auctionEnd - now
          if (auctionDistance > 0) {
            const days = Math.floor(auctionDistance / (1000 * 60 * 60 * 24))
            const hours = Math.floor((auctionDistance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
            const minutes = Math.floor((auctionDistance % (1000 * 60 * 60)) / (1000 * 60))
            const seconds = Math.floor((auctionDistance % (1000 * 60)) / 1000)
            newTimeRemaining[product.id] = {
              auction: `${days}h ${hours}j ${minutes}m ${seconds}d`,
              bidDeadline: ''
            }
          } else {
            newTimeRemaining[product.id] = { auction: '0h 0j 0m 0s', bidDeadline: '' }
          }
          
          // ✅ Tampilkan bid deadline jika ada dan masih aktif
          if (bidDeadline > 0 && product.auction_active) {
            const bidDistance = bidDeadline - now
            if (bidDistance > 0) {
              const days = Math.floor(bidDistance / (1000 * 60 * 60 * 24))
              const hours = Math.floor((bidDistance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
              const minutes = Math.floor((bidDistance % (1000 * 60 * 60)) / (1000 * 60))
              const seconds = Math.floor((bidDistance % (1000 * 60)) / 1000)
              newTimeRemaining[product.id].bidDeadline = `${days}h ${hours}j ${minutes}m ${seconds}d`
            } else {
              newTimeRemaining[product.id].bidDeadline = '0h 0j 0m 0s'
            }
          }
        } else {
          // ✅ LELANG SUDAH SELESAI - TAMPILKAN 0 SEMUA
          newTimeRemaining[product.id] = { 
            auction: '0h 0j 0m 0s', 
            bidDeadline: '0h 0j 0m 0s' 
          }
        }
      })
      
      setTimeRemaining(newTimeRemaining)
    }
    
    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [products])

  const toggleBidDeadlineVisibility = (productId: string) => {
    setShowBidDeadline(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }))
  }

  const openAuctionModal = (productId: string, isEdit = false) => {
    setSelectedProductId(productId)
    setIsEditingAuction(isEdit)
    const product = products.find(p => p.id === productId)
    if (product) {
      let remainingDays = 14
      if (product.auction_end_time && product.auction_active) {
        const now = new Date().getTime()
        const endTime = new Date(product.auction_end_time).getTime()
        const distance = endTime - now
        if (distance > 0) {
          remainingDays = Math.ceil(distance / (1000 * 60 * 60 * 24))
        }
      }
      setAuctionConfig({
        startPrice: (product.auction_start_price || product.harga || 0).toString(),
        increment: (product.auction_increment || 50000).toString(),
        durationDays: isEdit ? remainingDays.toString() : (product.auction_duration_days || 14).toString(),
        bidDeadlineDays: (product.bid_deadline_duration || 3).toString(),
        description: product.auction_description || ''
      })
      setDescriptionLength((product.auction_description || '').length)
      setExistingGalleryUrls(product.auction_gallery_urls || [])
      setImagePreviews([])
      setSelectedFiles([])
    }
    setShowAuctionModal(true)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    
    const totalImages = existingGalleryUrls.length + imagePreviews.length + files.length
    if (totalImages > 5) {
      alert(`❌ Maksimal 5 gambar! Kamu sudah punya ${existingGalleryUrls.length + imagePreviews.length} gambar, bisa tambah ${5 - (existingGalleryUrls.length + imagePreviews.length)} lagi.`)
      return
    }
    
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        alert('❌ Hanya file gambar yang diperbolehkan!')
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        alert('❌ Ukuran file maksimal 10MB per gambar!')
        return
      }
    }
    
    setSelectedFiles(prev => [...prev, ...files])
    
    files.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const uploadImages = async (): Promise<string[]> => {
    if (!selectedFiles.length || !selectedProductId) return existingGalleryUrls
    
    try {
      setUploadingImage(true)
      const uploadedUrls: string[] = [...existingGalleryUrls]
      
      for (const file of selectedFiles) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${selectedProductId}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${fileName}`
        
        const { data, error } = await supabase.storage
          .from('auction-images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
          })
        
        if (error) throw error
        
        const { data: urlData } = supabase.storage
          .from('auction-images')
          .getPublicUrl(filePath)
        
        uploadedUrls.push(urlData.publicUrl)
      }
      
      return uploadedUrls
    } catch (err: any) {
      console.error("Upload error:", err)
      alert('❌ Gagal upload gambar: ' + err.message)
      return existingGalleryUrls
    } finally {
      setUploadingImage(false)
    }
  }

  const removePreviewImage = (index: number) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const removeExistingImage = (index: number) => {
    setExistingGalleryUrls(prev => prev.filter((_, i) => i !== index))
  }

  const submitAuctionConfig = async () => {
    if (!selectedProductId) return
    
    // ✅ CEK APAKAH PRODUK DENGAN NAMA SAMA SEDANG DIACTION
    const product = products.find(p => p.id === selectedProductId)
    if (!product) return
    
    const duplicateActive = products.find(p => 
      p.nama_produk?.toLowerCase() === product.nama_produk?.toLowerCase() &&
      p.is_auction === true &&
      p.auction_active === true &&
      p.id !== selectedProductId // Exclude current product if editing
    )
    
    if (duplicateActive) {
      alert(`❌ Produk "${product.nama_produk}" sedang dalam lelang aktif!\n\nHanya 1 produk dengan nama yang sama yang bisa dilelang dalam 1 waktu.\n\nProduk yang sedang aktif: ${duplicateActive.nama_produk}`)
      return
    }
    
    const startPrice = parseInt(auctionConfig.startPrice)
    const increment = parseInt(auctionConfig.increment)
    const durationDays = parseInt(auctionConfig.durationDays)
    const bidDeadlineDays = parseInt(auctionConfig.bidDeadlineDays)
    
    if (isNaN(startPrice) || startPrice <= 0) {
      alert("❌ Harga awal lelang harus valid!")
      return
    }
    if (isNaN(increment) || increment <= 0) {
      alert("❌ Kelipatan bid harus valid!")
      return
    }
    if (isNaN(durationDays) || durationDays <= 0) {
      alert("❌ Durasi lelang harus valid!")
      return
    }
    if (isNaN(bidDeadlineDays) || bidDeadlineDays <= 0) {
      alert("❌ Durasi bid deadline harus valid!")
      return
    }
    if (bidDeadlineDays > durationDays) {
      alert("❌ Bid deadline tidak boleh lebih lama dari durasi lelang!")
      return
    }
    
    try {
      setAuctionLoading(true)
      
      const finalGalleryUrls = await uploadImages()

      const now = new Date()
      let newEndTime = product?.auction_end_time ? new Date(product.auction_end_time) : null
      let shouldUpdateEndTime = false
      
      if (isEditingAuction && product?.auction_end_time) {
        const remainingTime = new Date(product.auction_end_time).getTime() - now.getTime()
        const remainingDays = Math.floor(remainingTime / (1000 * 60 * 60 * 24))
        if (durationDays < remainingDays) {
          newEndTime = new Date()
          newEndTime.setDate(newEndTime.getDate() + durationDays)
          shouldUpdateEndTime = true
        } else {
          shouldUpdateEndTime = false
        }
      } else {
        newEndTime = new Date()
        newEndTime.setDate(newEndTime.getDate() + durationDays)
        shouldUpdateEndTime = true
      }
      
      const initialBidDeadline = new Date()
      initialBidDeadline.setDate(initialBidDeadline.getDate() + bidDeadlineDays)
      
      const updateData: any = {
        auction_start_price: startPrice,
        auction_increment: increment,
        auction_duration_days: durationDays,
        bid_deadline_duration: bidDeadlineDays,
        auction_description: auctionConfig.description,
        auction_gallery_urls: finalGalleryUrls,
        is_auction: true,
        auction_active: true,
        // Clear stale finished-auction fields when starting a fresh auction
        current_bid_price: null,
        current_bidder_id: null,
        auction_winner_name: null,
        auction_ended_at: null,
        auction_end_reason: null,
        finished_auction_id: null
      }
      
      if (shouldUpdateEndTime && newEndTime) {
        updateData.auction_end_time = newEndTime.toISOString()
      }
      if (!isEditingAuction || shouldUpdateEndTime) {
        updateData.bid_deadline_time = initialBidDeadline.toISOString()
      }
      
      // ✅ Set auction_started_at untuk lelang baru
      if (!isEditingAuction) {
        updateData.auction_started_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', selectedProductId)
      
      if (error) throw error
      
      setProducts(products.map(p =>
        p.id === selectedProductId ? {
          ...p,
          auction_start_price: startPrice,
          auction_increment: increment,
          auction_duration_days: durationDays,
          bid_deadline_duration: bidDeadlineDays,
          auction_description: auctionConfig.description,
          auction_gallery_urls: finalGalleryUrls,
          auction_end_time: shouldUpdateEndTime && newEndTime ? newEndTime.toISOString() : p.auction_end_time,
          bid_deadline_time: (!isEditingAuction || shouldUpdateEndTime) && initialBidDeadline ? initialBidDeadline.toISOString() : p.bid_deadline_time
        } : p
      ))
      
      setShowAuctionModal(false)
      setSelectedProductId(null)
      setIsEditingAuction(false)
      setSelectedFiles([])
      setImagePreviews([])
      setExistingGalleryUrls([])
      
      alert("✅ Lelang berhasil dijadwalkan!")
    } catch (err: any) {
      alert("❌ Gagal mengupdate lelang: " + err.message)
    } finally {
      setAuctionLoading(false)
    }
  }

  // ✅ Fungsi untuk membuka dialog konfirmasi
  const openCancelConfirmModal = (productId: string, productName: string) => {
    setCancellingProductId(productId)
    setCancellingProductName(productName)
    setShowCancelConfirmModal(true)
  }

  // ✅ Fungsi untuk membatalkan lelang (setelah konfirmasi)
  const confirmCancelAuction = async () => {
    if (!cancellingProductId) return
    
    try {
      const product = products.find(p => p.id === cancellingProductId)
      
      // 1. Generate finished auction ID
      const finishedId = generateFinishedAuctionId()
      
      // 2. Get winner info
      let winnerName: string | null = null
      if (product?.current_bidder_id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', product.current_bidder_id)
          .single()
        winnerName = profileData?.full_name || null
      }

      // 3. Get bid count before any changes
      const { count: bidCount } = await supabase
        .from('auction_bids')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', cancellingProductId)
      
      // 4. Tentukan status berdasarkan ada/tidaknya pemenang
      const endReason = winnerName && winnerName !== 'Tidak ada'
        ? 'force_stop'
        : 'cancelled'
      
      // 5. ✅ INSERT KE AUCTION_HISTORY (including image fields for persistent display)
      const { error: historyError } = await supabase
        .from('auction_history')
        .insert({
          product_id: product?.id,
          product_name: product?.nama_produk,
          start_price: product?.auction_start_price || 0,
          final_price: product?.current_bid_price || product?.auction_start_price || 0,
          winner_id: product?.current_bidder_id,
          winner_name: winnerName,
          finished_auction_id: finishedId,
          auction_start_time: product?.auction_started_at,
          auction_end_time: new Date().toISOString(),
          auction_end_reason: endReason,
          total_bids: bidCount || 0,
          gambar_url: product?.gambar_url,
          auction_gallery_urls: product?.auction_gallery_urls,
          auction_description: product?.auction_description
        })
      
      if (historyError) {
        console.error('Failed to save to history:', historyError)
        throw historyError
      }
      
      // 6. Update product — preserve key fields so auction page can display card correctly
      await supabase
        .from('products')
        .update({
          auction_active: false,
          auction_end_time: null,
          auction_duration_days: null,
          bid_deadline_duration: null,
          bid_deadline_time: null,
          finished_auction_id: finishedId,
          auction_winner_name: winnerName,
          auction_ended_at: new Date().toISOString(),
          auction_end_reason: endReason
        })
        .eq('id', cancellingProductId)
      
      await fetchProducts()
      setShowCancelConfirmModal(false)
      setCancellingProductId(null)
      setCancellingProductName('')
      
      alert(`✅ Lelang dibatalkan & disimpan ke history!\nID: ${finishedId}\nStatus: ${endReason}`)
    } catch (err: any) {
      alert("❌ Gagal: " + err.message)
    }
  }

  // ✅ Fungsi lama toggleAuctionStatus (tetap untuk fitur lain jika diperlukan)
  const toggleAuctionStatus = async (productId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus
    try {
      const { error } = await supabase
        .from('products')
        .update({
          is_auction: newStatus,
          auction_active: newStatus ? true : false
        })
        .eq('id', productId)
      
      if (error) throw error
      
      setProducts(products.map(p =>
        p.id === productId ? { ...p, is_auction: newStatus, auction_active: newStatus } : p
      ))
      
      if (newStatus) {
        alert(`⚡ Produk sekarang dalam mode LELANG!`)
      } else {
        alert(`✅ Produk sudah kembali ke status normal`)
      }
    } catch (err: any) {
      alert("❌ Gagal update status lelang: " + err.message)
    }
  }

  const simulateNewBid = async (productId: string, newBidPrice: number) => {
    const product = products.find(p => p.id === productId)
    if (!product) return
    
    try {
      const now = new Date()
      const auctionEnd = product.auction_end_time ? new Date(product.auction_end_time) : null
      
      // ✅ Hitung bid deadline baru dari sekarang + durasi bid
      const newBidDeadline = new Date()
      newBidDeadline.setDate(newBidDeadline.getDate() + (product.bid_deadline_duration || 3))
      
      // ✅ Pastikan bid deadline tidak melebihi auction end time
      let finalBidDeadline = newBidDeadline
      if (auctionEnd && newBidDeadline > auctionEnd) {
        // Jika bid deadline melebihi auction end, set ke auction end
        finalBidDeadline = auctionEnd
      }
      
      const { error } = await supabase
        .from('products')
        .update({
          current_bid_price: newBidPrice,
          bid_deadline_time: finalBidDeadline.toISOString()
        })
        .eq('id', productId)
      
      if (error) throw error
      
      setProducts(products.map(p =>
        p.id === productId ? {
          ...p,
          current_bid_price: newBidPrice,
          bid_deadline_time: finalBidDeadline.toISOString()
        } : p
      ))
      
      alert(`✅ Bid baru diterima! Bid deadline direset ke ${product.bid_deadline_duration} hari`)
    } catch (err: any) {
      alert("❌ Gagal memproses bid: " + err.message)
    }
  }

  const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE + 1
  const endIndex = Math.min(currentPage * ITEMS_PER_PAGE, totalProducts)

  const getEmptyMessage = () => {
    if (debouncedTerm) return "Tidak ada produk yang sesuai dengan pencarian."
    if (filterView === 'auction') return "Belum ada produk yang sedang dilelang."
    if (filterView === 'wishlist') return "Belum ada data."
    if (filterView === 'finished') return "Belum ada lelang yang selesai."
    if (filterView === 'request') return "Belum ada permintaan dari client."
    return "Belum ada produk."
  }

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (loading && !error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
        <span className="ml-2">Memuat Data Produk...</span>
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
          <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group">
            <div className="bg-slate-800 p-2 rounded-lg group-hover:bg-slate-700 border border-slate-700">
              <ArrowLeft className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium hidden sm:inline">Back to Home</span>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-green-500">
              <Package className="h-8 w-8" />
              Admin Marketing Dashboard
            </h1>
            <p className="text-slate-400 mt-1">Kelola harga, lelang, dan permintaan.</p>
          </div>
        </div>

        {/* GANTI BADGE DI HEADER */}
        <div className="flex items-center gap-3 hidden md:flex">
          {adminProfile?.profile_completed ? (
            <>
              <div className="text-right">
                <p className="text-sm font-medium text-white">{adminProfile.admin_name}</p>
                <p className="text-xs text-slate-400">Klik untuk edit profil</p>
              </div>
              <button
                onClick={openEditProfileModal}
                className="w-10 h-10 bg-gradient-to-br from-orange-500 to-green-500 rounded-full flex items-center justify-center text-white font-bold hover:scale-110 transition-transform cursor-pointer border-2 border-transparent hover:border-orange-400"
                title="Edit Profil"
              >
                {adminProfile.admin_name.charAt(0).toUpperCase()}
              </button>
            </>
          ) : (
            <button
              onClick={openEditProfileModal}
              className="text-orange-400 border-orange-400 px-4 py-2 bg-orange-900/20 hover:bg-orange-900/30 transition-colors cursor-pointer rounded-md border flex items-center gap-2"
              title="Lengkapi Profil"
            >
              <AlertCircle className="h-4 w-4" />
              Isi Profil
            </button>
          )}
        </div>
      </div>

      {/* SEARCH BAR & FILTERS */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="pt-6">
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Cari produk..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded pl-10 pr-4 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-green-500"
              />
            </div>
            {searchTerm && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('')
                  setDebouncedTerm('')
                  setCurrentPage(1)
                  searchInputRef.current?.focus()
                }} 
                className="border-slate-700"
              >
                Clear
              </Button>
            )}
          </div>
          
          {/* ✅ UPDATED FILTER BUTTONS - Include Wishlist Analytics */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <Button
              variant={filterView === 'all' ? 'default' : 'outline'}
              onClick={() => {
                setFilterView('all')
                setCurrentPage(1)
              }}
              className={filterView === 'all' ? 'bg-blue-600 hover:bg-blue-700' : 'border-slate-700'}
            >
              Semua Produk ({totalProducts})
            </Button>
            <Button
              variant={filterView === 'auction' ? 'default' : 'outline'}
              onClick={() => {
                setFilterView('auction')
                setCurrentPage(1)
              }}
              className={filterView === 'auction' ? 'bg-purple-600 hover:bg-purple-700' : 'border-slate-700'}
            >
              <Gavel className="h-4 w-4 mr-2" />
              Sedang Lelang
            </Button>
            <Button
              variant={filterView === 'wishlist' ? 'default' : 'outline'}
              onClick={() => {
                if (checkProfileBeforeAccess('wishlist')) {
                  setFilterView('wishlist')
                  setCurrentPage(1)
                }
              }}
              className={filterView === 'wishlist' ? 'bg-blue-600 hover:bg-blue-700' : 'border-slate-700'}
            >
              <Bookmark className="h-4 w-4 mr-2" />
              Wishlist Analytics ({wishlistTotal})
            </Button>
            <Button
              variant={filterView === 'request' ? 'default' : 'outline'}
              onClick={() => {
                if (checkProfileBeforeAccess('request')) {
                  setFilterView('request')
                  setCurrentPage(1)
                }
              }}
              className={filterView === 'request' ? 'bg-orange-600 hover:bg-orange-700' : 'border-slate-700'}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Permintaan Client
            </Button>
            <Button
              variant={filterView === 'finished' ? 'default' : 'outline'}
              onClick={() => {
                setFilterView('finished')
                setCurrentPage(1)
              }}
              className={filterView === 'finished' ? 'bg-pink-600 hover:bg-pink-700' : 'border-slate-700'}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Lelang Selesai
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ✅ WISHLIST ANALYTICS TABLE - Shows when filterView === 'wishlist' */}
      {filterView === 'wishlist' && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Bookmark className="h-5 w-5 text-blue-400" />
                Wishlist Analytics
              </div>
              <div className="flex gap-2">
                <select
                  value={wishlistFilter}
                  onChange={(e) => setWishlistFilter(e.target.value as any)}
                  className="bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="all">Semua Status</option>
                  <option value="deal">Deal</option>
                  <option value="pending">Pending</option>
                  <option value="requested">Requested</option>
                  <option value="wishlist">Wishlist</option>
                  <option value="declined">Declined</option>
                </select>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {wishlistLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : wishlistItems.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Bookmark className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Belum ada data.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800 uppercase font-medium">
                  <tr>
                    <th className="px-4 py-3 text-center">ID</th>
                    <th className="px-4 py-3">Kode Produk</th>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3 text-center">Jumlah</th>
                    <th className="px-4 py-3 text-right">Harga Total</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Tanggal</th> 
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {wishlistItems.map((item) => {
                    const statusConfig = getStatusConfig(item.status)
                    const StatusIcon = statusConfig.icon
                    
                    return (
                      <tr key={item.wishlist_id} className="hover:bg-slate-800/50">
                        {/* ID - Tampilkan Request ID atau Wishlist ID */}
                        <td className="px-4 py-3 text-center">
                          <Badge variant="outline" className={`${
                            item.status === 'requested' || item.status === 'pending' 
                              ? 'bg-blue-900/20 text-blue-400 border-blue-700' 
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          } font-mono`}>
                            {item.status === 'requested' || item.status === 'pending' || item.status === 'accepted' || item.status === 'deal'
                              ? `#RFQ-${item.request_id || item.wishlist_id}`
                              : `#WLS-${item.wishlist_id}`
                            }
                          </Badge>
                        </td>

                        <td className="px-4 py-3 font-mono text-white">
                          {item.product_count > 1 ? (
                            <div 
                              className="cursor-pointer hover:text-blue-400 transition-colors"
                              onClick={() => {
                                setSelectedProducts(item.items)
                                setShowProductDetailModal(true)
                              }}
                            >
                              <p className="text-orange-400">{item.product_sku}</p>
                              <p className="text-xs text-slate-500">
                                +{item.product_count - 1} produk lainnya (klik untuk detail)
                              </p>
                            </div>
                          ) : (
                            <p className="text-orange-400">{item.product_sku}</p>
                          )}
                        </td>
                        
                        {/* User */}
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-white font-medium">{item.user_name}</p>
                            <p className="text-xs text-slate-500">{item.company_name}</p>
                          </div>
                        </td>
                        
                        {/* Jumlah Total */}
                        <td className="px-4 py-3 text-center">
                          <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {item.total_quantity} Unit
                          </Badge>
                          <p className="text-xs text-slate-500 mt-1">
                            ({item.product_count} produk berbeda)
                          </p>
                        </td>
                        
                        {/* Harga Total */}
                        <td className="px-4 py-3 text-right">
                          <span className="text-orange-400 font-mono font-bold">
                            {formatRupiah(item.total_price)}
                          </span>
                        </td>
                        
                        {/* Status */}
                        <td className="px-4 py-3">
                          <Badge className={`${statusConfig.color} border`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </td>

                        {/* Tanggal */}
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {new Date(item.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                        
                        {/* Aksi */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2 items-center">
                            {/* ✅ DROPDOWN SELECT - HANYA AKTIF JIKA STATUS = REQUESTED */}
                            {item.status === 'requested' ? (
                              <select
                                onChange={(e) => {
                                  const action = e.target.value
                                  if (action === 'accept') {
                                    updateWishlistStatus(item.items[0].id, 'accept')
                                  } else if (action === 'decline') {
                                    updateWishlistStatus(item.items[0].id, 'decline')
                                  }
                                  e.target.value = '' // Reset dropdown
                                }}
                                className="bg-slate-800 border border-slate-600 text-white text-xs rounded px-3 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer"
                                defaultValue=""
                              >
                                <option value="" disabled>Aksi...</option>
                                <option value="accept">✅ Accept</option>
                                <option value="decline">❌ Decline</option>
                              </select>
                            ) : (
                              <Badge variant="outline" className="text-xs bg-slate-800 text-slate-500 border-slate-600">
                                <Lock className="h-3 w-3 mr-1" />
                                Tidak dapat diubah
                              </Badge>
                            )}
                            
                            {/* ✅ Tombol Chat - Sekarang bisa diklik */}
                            <button
                              onClick={() => openChatWithClient(item)}
                              className="h-8 w-8 p-0 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center transition-colors"
                              title="Chat dengan User"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ✅ VIEW KHUSUS UNTUK LELANG SELESAI - PAKAI AUCTION_HISTORY */}
      {filterView === 'finished' && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-pink-400" />
                History Lelang Selesai
              </div>
              <span className="text-sm text-slate-400">
                {auctionHistory.length} lelang
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
              </div>
            ) : auctionHistory.length === 0 ? (
              <div className="text-center py-12 text-slate-500 flex flex-col items-center">
                <CheckCircle2 className="h-12 w-12 mb-3 opacity-50" />
                <p className="text-lg font-medium">Belum ada lelang yang selesai.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-800 uppercase font-medium">
                    <tr>
                      <th className="px-4 py-3">ID Selesai</th>
                      <th className="px-4 py-3">Produk</th>
                      <th className="px-4 py-3">Harga Final</th>
                      <th className="px-4 py-3">Pemenang</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Tanggal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {auctionHistory.map((history) => (
                      <tr key={history.id} className="hover:bg-slate-800/50">
                        <td className="px-4 py-3 font-mono text-pink-400">{history.finished_auction_id}</td>
                        <td className="px-4 py-3 font-medium text-white">{history.product_name}</td>
                        <td className="px-4 py-3 text-orange-400 font-mono">{formatRupiah(history.final_price)}</td>
                        <td className="px-4 py-3 text-green-400">{history.winner_name || 'Tidak ada'}</td>
                        <td className="px-4 py-3">
                          <Badge className={`${
                            history.auction_end_reason === 'cancelled' 
                              ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                              : history.auction_end_reason === 'force_stop'
                              ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                              : history.auction_end_reason === 'no_bids'
                              ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                              : 'bg-green-500/20 text-green-400 border-green-500/30'
                          } border`}>
                            {history.auction_end_reason === 'cancelled' 
                              ? 'Cancelled' 
                              : history.auction_end_reason === 'force_stop'
                              ? 'Force Stop'
                              : history.auction_end_reason === 'no_bids'
                              ? 'No Bids'
                              : 'Completed'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {(() => {
                            const date = new Date(history.auction_end_time)
                            const day = String(date.getDate()).padStart(2, '0')
                            const month = String(date.getMonth() + 1).padStart(2, '0')
                            const year = date.getFullYear()
                            const hours = String(date.getHours()).padStart(2, '0')
                            const minutes = String(date.getMinutes()).padStart(2, '0')
                            return `${day}/${month}/${year} ${hours}:${minutes}`
                          })()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* PRODUCTS TABLE - Only shows when filterView !== 'wishlist' */}
      {filterView !== 'wishlist' && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-green-400" />
                {filterView === 'all' ? 'Daftar Produk' : filterView === 'auction' ? 'Produk Lelang' : 'Permintaan Client'}
              </div>
              <span className="text-sm text-slate-400">
                {totalProducts === 0 ? '0' : `${startIndex}-${endIndex}`} dari {totalProducts}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <div className="text-center py-12 text-slate-500 flex flex-col items-center">
                {filterView === 'auction' ? <Gavel className="h-12 w-12 mb-3 opacity-50" /> :
                filterView === 'request' ? <MessageSquare className="h-12 w-12 mb-3 opacity-50" /> :
                <Package className="h-12 w-12 mb-3 opacity-50" />}
                <p className="text-lg font-medium">{getEmptyMessage()}</p>
                {filterView !== 'all' && (
                  <Button
                    variant="link"
                    onClick={() => setFilterView('all')}
                    className="mt-2 text-blue-400"
                  >
                    Kembali ke Semua Produk
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-800 uppercase font-medium">
                    {filterView === 'auction' ? (
                      // ✅ TABEL KHUSUS UNTUK VIEW "SEDANG LELANG"
                      <tr>
                        <th className="px-4 py-3 rounded-tl-lg">No</th>
                        <th className="px-4 py-3">ID Lelang</th>
                        <th className="px-4 py-3">Gambar</th>
                        <th className="px-4 py-3">Nama Produk</th>
                        <th className="px-4 py-3">Harga Lelang</th>
                        <th className="px-4 py-3">Info Lelang</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Tanggal Mulai</th>
                        <th className="px-4 py-3 rounded-tr-lg text-right">Aksi</th>
                      </tr>
                    ) : filterView === 'finished' ? (
                      // ✅ TABEL KHUSUS UNTUK VIEW "LELANG SELESAI" - LEBIH RAPI
                      <tr>
                        <th className="px-4 py-3 rounded-tl-lg">No</th>
                        <th className="px-4 py-3">Nama Produk</th>
                        <th className="px-4 py-3">Harga Final</th>
                        <th className="px-4 py-3">ID Selesai</th>
                        <th className="px-4 py-3">Pemenang</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Tanggal Selesai</th>
                        <th className="px-4 py-3 rounded-tr-lg text-right">Aksi</th>
                      </tr>
                    ) : (
                      // ✅ TABEL UNTUK "SEMUA PRODUK" & "PERMINTAAN"
                      <tr>
                        <th className="px-4 py-3 rounded-tl-lg">No</th>
                        <th className="px-4 py-3">Nama Produk</th>
                        <th className="px-4 py-3">Harga Produk</th>
                        <th className="px-4 py-3">Info Lelang</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Tanggal</th>
                        <th className="px-4 py-3 rounded-tr-lg text-right">Aksi</th>
                      </tr>
                    )}
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {products.map((product, index) => {
                      const globalIndex = startIndex + index
                      const isBidDeadlineVisible = showBidDeadline[product.id]
                      
                      // ✅ Logic harga untuk lelang (dinamis)
                      const auctionPrice = product.current_bid_price && product.current_bid_price > 0
                        ? product.current_bid_price
                        : product.auction_start_price || 0
                      
                      // ✅ Ambil gambar untuk lelang
                      const auctionImage = product.auction_gallery_urls && product.auction_gallery_urls.length > 0
                        ? product.auction_gallery_urls[0]
                        : product.gambar_url || null
                      
                      return (
                        <tr key={product.id} className="hover:bg-slate-800/50">
                          <td className="px-4 py-3 text-slate-400">{globalIndex}</td>
                          
                          {/* ✅ KOLOM ID LELANG - Hanya untuk view "Sedang Lelang" */}
                          {filterView === 'auction' && (
                            <td className="px-4 py-3">
                              <Badge className="bg-purple-600/20 text-purple-400 border border-purple-600/30 font-mono text-xs">
                                {product.sku || '-'}
                              </Badge>
                            </td>
                          )}
                          
                          {/* ✅ KOLOM GAMBAR - Hanya untuk view "Sedang Lelang" */}
                          {filterView === 'auction' && (
                            <td className="px-4 py-3">
                              {auctionImage ? (
                                <img
                                  src={auctionImage}
                                  alt={product.nama_produk || 'Produk'}
                                  className="w-16 h-16 object-cover rounded-lg border border-slate-700"
                                  onError={(e) => {
                                    e.currentTarget.src = 'https://via.placeholder.com/64?text=No+Image'
                                  }}
                                />
                              ) : (
                                <div className="w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700">
                                  <ImageIcon className="h-8 w-8 text-slate-600" />
                                </div>
                              )}
                            </td>
                          )}
                          
                          <td className="px-4 py-3 font-medium text-white">
                            {product.nama_produk || 'Produk Tanpa Nama'}
                          </td>
                          
                          {/* ✅ HARGA - Berbeda untuk auction vs semua produk */}
                          {filterView === 'auction' ? (
                            <td className="px-4 py-3">
                              <span className="text-orange-400 font-mono font-bold">
                                {formatRupiah(auctionPrice)}
                              </span>
                              {product.current_bid_price && product.current_bid_price > 0 && (
                                <p className="text-xs text-green-400 mt-1">(Harga Bid)</p>
                              )}
                            </td>
                          ) : filterView === 'finished' ? (
                            <td className="px-4 py-3">
                              <span className="text-orange-400 font-mono font-bold">
                                {formatRupiah(product.current_bid_price || product.auction_start_price || 0)}
                              </span>
                              <p className="text-xs text-slate-500 mt-1">Harga Final</p>
                            </td>
                          ) : (
                            <td className="px-4 py-3">
                              <span className="text-white font-mono">
                                {formatRupiah(product.harga || 0)}
                              </span>
                            </td>
                          )}
                          
                          {/* ✅ INFO LELANG */}
                          <td className="px-4 py-3">
                            {filterView === 'finished' ? (
                              // ✅ HANYA TAMPILKAN ID SELESAI
                              <Badge className="bg-pink-600/20 text-pink-400 border border-pink-600/30 font-mono text-xs">
                                {product.finished_auction_id || 'N/A'}
                              </Badge>
                            ) : product.is_auction && product.auction_active && product.auction_end_time ? (
                              // ✅ TAMPILAN NORMAL UNTUK LELANG AKTIF
                              <div className="space-y-2">
                                <div className="flex items-center gap-1 text-orange-400 text-xs font-mono">
                                  <Clock className="h-3 w-3" />
                                  <span>Batas: {timeRemaining[product.id]?.auction || '...'}</span>
                                </div>

                                {product.bid_deadline_time && product.bid_deadline_duration && (
                                  <div className="flex items-center gap-1 text-yellow-400 text-xs font-mono bg-yellow-900/20 px-2 py-1 rounded border border-yellow-600/30">
                                    <Timer className="h-3 w-3" />
                                    <span>BD: {timeRemaining[product.id]?.bidDeadline || '...'}</span>
                                  </div>
                                )}
                                
                                {filterView === 'auction' && 
                                product.current_bid_price && 
                                product.current_bid_price > 0 && 
                                product.current_bid_price > (product.auction_start_price || 0) && 
                                product.bid_deadline_time && (
                                  <div className="bg-slate-800/50 rounded p-2 border border-slate-700">
                                    <div className="flex items-center justify-between mb-1">
                                      <div className="flex items-center gap-1 text-red-400 text-xs font-mono">
                                        <Timer className="h-3 w-3" />
                                        <span>Bid Deadline:</span>
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => toggleBidDeadlineVisibility(product.id)}
                                        className="h-6 p-1 text-slate-400 hover:text-white"
                                      >
                                        {isBidDeadlineVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                      </Button>
                                    </div>
                                    {isBidDeadlineVisible && timeRemaining[product.id]?.bidDeadline && timeRemaining[product.id]?.bidDeadline !== 'Loading...' ? (
                                      <div className="text-red-400 text-xs font-mono font-bold">
                                        {timeRemaining[product.id]?.bidDeadline}
                                      </div>
                                    ) : (
                                      <div className="text-slate-600 text-xs italic">[Hidden]</div>
                                    )}
                                    <div className="text-slate-500 text-xs mt-1">
                                      Current: {formatRupiah(product.current_bid_price)}
                                    </div>
                                    <div className="mt-2 flex gap-1">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => simulateNewBid(product.id, (product.current_bid_price || product.auction_start_price || 0) + (product.auction_increment || 50000))}
                                        className="h-6 text-xs border-green-600 text-green-400 hover:bg-green-900/20"
                                      >
                                        +Bid Test
                                      </Button>
                                    </div>
                                  </div>
                                )}
                                
                                <div className="flex items-center gap-1 text-purple-400 text-xs">
                                  <DollarSign className="h-3 w-3" />
                                  <span>Start: {formatRupiah(product.auction_start_price || 0)}</span>
                                </div>
                                {filterView === 'auction' && (
                                  <div className="flex items-center gap-1 text-purple-400 text-xs">
                                    <TrendingUp className="h-3 w-3" />
                                    <span>Kelipatan: {formatRupiah(product.auction_increment || 0)}</span>
                                  </div>
                                )}
                              </div>
                            ) : product.is_auction && !product.auction_active ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1 text-pink-400 text-xs font-mono">
                                  <Clock className="h-3 w-3" />
                                  <span>0h 0j 0m 0s</span>
                                </div>
                                <div className="flex items-center gap-1 text-pink-400 text-xs font-mono">
                                  <Timer className="h-3 w-3" />
                                  <span>0h 0j 0m 0s</span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-500 text-xs">-</span>
                            )}
                          </td>

                          {/* ✅ KOLOM PEMENANG - KHUSUS FINISHED VIEW */}
                          {filterView === 'finished' && (
                            <td className="px-4 py-3">
                              {product.auction_winner_name ? (
                                <p className="text-green-400 font-semibold text-sm">
                                  {product.auction_winner_name}
                                </p>
                              ) : (
                                <p className="text-slate-500 italic text-sm">Tidak ada pemenang</p>
                              )}
                            </td>
                          )}
                          
                          {/* ✅ STATUS - Tanpa "Tidak Ada Request" untuk auction */}
                          <td className="px-4 py-3">
                            <div className="flex gap-2 flex-wrap">
                            {filterView === 'finished' ? (
                              // ✅ STATUS KHUSUS UNTUK LELANG SELESAI
                              <Badge className={`${
                                product.auction_end_reason === 'cancelled' 
                                  ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                                  : product.auction_end_reason === 'force_stop'
                                  ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                                  : product.auction_end_reason === 'no_bids'
                                  ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                                  : 'bg-green-500/20 text-green-400 border-green-500/30'
                              } border`}>
                                {product.auction_end_reason === 'cancelled' 
                                  ? 'Cancelled' 
                                  : product.auction_end_reason === 'force_stop'
                                  ? 'Force Stop'
                                  : product.auction_end_reason === 'no_bids' 
                                  ? 'No Bids' 
                                  : 'Completed'}
                              </Badge>
                            ) : product.is_auction && product.auction_active ? (
                              <Badge className="bg-purple-600 text-white animate-pulse">
                                <Gavel className="h-3 w-3 mr-1" />
                                Sedang Lelang
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-slate-800">
                                Normal
                              </Badge>
                            )}
                              
                              {/* ✅ TAMPILKAN PEMENANG JIKA LELANG SELESAI */}
                              {product.is_auction && !product.auction_active && (
                                <div className="w-full mt-1 text-xs">
                                  {product.auction_winner_name ? (
                                    <span className="text-pink-400">
                                      Pemenang: {product.auction_winner_name}
                                    </span>
                                  ) : (
                                    <span className="text-slate-500">
                                      Tidak ada pemenang
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* ✅ TANGGAL - Berbeda untuk auction vs finished vs semua produk */}
                          <td className="px-4 py-3 text-xs text-slate-500">
                            {filterView === 'finished' ? (
                              // Untuk finished: tampilkan auction_ended_at
                              product.auction_ended_at ? (
                                <div>
                                  <p className="text-slate-400">Selesai:</p>
                                  <p className="text-slate-300 font-mono">
                                    {new Date(product.auction_ended_at).toLocaleDateString('id-ID', {
                                      day: '2-digit', month: 'short', year: 'numeric'
                                    })}
                                  </p>
                                  <p className="text-slate-500 text-[10px]">
                                    {new Date(product.auction_ended_at).toLocaleTimeString('id-ID', {
                                      hour: '2-digit', minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                              ) : <span className="text-slate-600">-</span>
                            ) : filterView === 'auction' ? (
                              // Untuk view auction: tampilkan auction_started_at
                              product.auction_started_at ? (
                                <div>
                                  <p className="text-slate-400">Mulai:</p>
                                  <p className="text-slate-300 font-mono">
                                    {new Date(product.auction_started_at).toLocaleDateString('id-ID', {
                                      day: '2-digit', month: 'short', year: 'numeric'
                                    })}
                                  </p>
                                  <p className="text-slate-500 text-[10px]">
                                    {new Date(product.auction_started_at).toLocaleTimeString('id-ID', {
                                      hour: '2-digit', minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                              ) : <span className="text-slate-600">-</span>
                            ) : product.auction_active && product.auction_started_at ? (
                              // Untuk semua produk yang sedang lelang
                              <div>
                                <p className="text-slate-400">Lelang:</p>
                                <p className="text-slate-300 font-mono">
                                  {new Date(product.auction_started_at).toLocaleDateString('id-ID', {
                                    day: '2-digit', month: 'short', year: 'numeric'
                                  })}
                                </p>
                                <p className="text-slate-500 text-[10px]">
                                  {new Date(product.auction_started_at).toLocaleTimeString('id-ID', {
                                    hour: '2-digit', minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            ) : product.harga_updated_at ? (
                              // Untuk produk regular: tampilkan update harga
                              <div>
                                <p className="text-slate-400">Update Harga:</p>
                                <p className="text-slate-300 font-mono">
                                  {new Date(product.harga_updated_at).toLocaleDateString('id-ID', {
                                    day: '2-digit', month: 'short', year: 'numeric'
                                  })}
                                </p>
                                <p className="text-slate-500 text-[10px]">
                                  {new Date(product.harga_updated_at).toLocaleTimeString('id-ID', {
                                    hour: '2-digit', minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            ) : (
                              // Fallback
                              <div>
                                <p className="text-slate-400">Dibuat:</p>
                                <p className="text-slate-300 font-mono">
                                  {new Date(product.created_at).toLocaleDateString('id-ID', {
                                    day: '2-digit', month: 'short', year: 'numeric'
                                  })}
                                </p>
                                <p className="text-slate-500 text-[10px]">
                                  {new Date(product.created_at).toLocaleTimeString('id-ID', {
                                    hour: '2-digit', minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            )}
                          </td>
                          
                          {/* ✅ AKSI */}
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                            {filterView === 'finished' ? (
                              // ✅ UNTUK LELANG SELESAI: Jadwalkan lelang lagi pada produk yang sama
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs border-slate-600"
                                  disabled
                                >
                                  <Lock className="h-3 w-3 mr-1" />
                                  Selesai
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => openAuctionModal(product.id, false)}
                                  className="bg-green-600 hover:bg-green-700 text-xs"
                                >
                                  <Gavel className="h-3 w-3 mr-1" />
                                  Lelang Lagi
                                </Button>
                              </div>
                            ) : filterView === 'auction' && product.auction_active ? (
                                // ✅ VIEW "SEDANG LELANG": Edit Info lelang
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => openAuctionModal(product.id, true)}
                                    className="bg-blue-600 hover:bg-blue-700 text-xs"
                                  >
                                    <Edit2 className="h-3 w-3 mr-1" />
                                    Edit Info
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => openCancelConfirmModal(product.id, product.nama_produk || 'Produk')}
                                    variant="destructive"
                                    className="text-xs"
                                  >
                                    <X className="h-3 w-3 mr-1" />
                                    Batalkan Lelang
                                  </Button>
                                </>
                              ) : (
                                // ... kode aksi untuk view lainnya tetap sama
                                // ✅ VIEW "SEMUA PRODUK" & "PERMINTAAN": Edit harga katalog
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => openEditPriceModal(product.id, product.harga)}
                                    className="bg-blue-600 hover:bg-blue-700 text-xs"
                                  >
                                    <Edit2 className="h-3 w-3 mr-1" />
                                    Edit Harga
                                  </Button>
                                  {product.auction_active ? (
                                    <Button
                                      size="sm"
                                      onClick={() => openCancelConfirmModal(product.id, product.nama_produk || 'Produk')}
                                      variant="destructive"
                                      className="text-xs"
                                    >
                                      <X className="h-3 w-3 mr-1" />
                                      Batalkan Lelang
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      onClick={() => openAuctionModal(product.id, false)}
                                      className="bg-orange-600 hover:bg-orange-700 text-xs"
                                    >
                                      <Gavel className="h-3 w-3 mr-1" />
                                      Jadwalkan Lelang
                                    </Button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* ✅ PAGINATION */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-800">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="border-slate-700 disabled:opacity-50"
                >
                  ← Prev
                </Button>
                <span className="text-slate-400 text-sm">Page {currentPage} / {totalPages}</span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="border-slate-700 disabled:opacity-50"
                >
                  Next →
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* MODAL EDIT HARGA */}
      {showEditPriceModal && (
        <Dialog open={showEditPriceModal} onOpenChange={setShowEditPriceModal}>
          <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-blue-400">
                <Edit2 className="h-5 w-5" />
                Edit Harga Produk
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Update harga produk yang akan ditampilkan di katalog.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Harga Baru (Rp)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="number"
                    value={editingPrice}
                    onChange={(e) => setEditingPrice(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded pl-10 pr-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    placeholder="1000000"
                    autoFocus
                  />
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                <p className="text-sm text-slate-400">Format: Rp {formatRupiah(parseInt(editingPrice) || 0)}</p>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditPriceModal(false)
                  setEditingProductId(null)
                  setEditingPrice('')
                }}
                className="border-slate-600"
                disabled={priceSaving}
              >
                Batal
              </Button>
              <Button
                onClick={handleSavePrice}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={priceSaving}
              >
                {priceSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Simpan Harga
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL KONFIGURASI LELANG */}
      {showAuctionModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="bg-slate-900 border-slate-700 w-full max-w-md">
            <CardHeader className="border-b border-slate-700 flex-shrink-0">
              <CardTitle className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <Gavel className="h-5 w-5 text-purple-500" />
                  {isEditingAuction ? 'Edit Detail Lelang' : 'Konfigurasi Lelang'}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowAuctionModal(false)
                    setSelectedProductId(null)
                    setIsEditingAuction(false)
                    setSelectedFiles([])
                    setImagePreviews([])
                    setExistingGalleryUrls([])
                  }}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[60vh] overflow-y-auto py-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Harga Awal Lelang (Rp)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="number"
                    value={auctionConfig.startPrice}
                    onChange={(e) => setAuctionConfig({...auctionConfig, startPrice: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-600 rounded pl-10 pr-4 py-2 text-white focus:outline-none focus:border-purple-500"
                    placeholder="500000"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Kelipatan Bid (Rp)</label>
                <div className="relative">
                  <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="number"
                    value={auctionConfig.increment}
                    onChange={(e) => setAuctionConfig({...auctionConfig, increment: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-600 rounded pl-10 pr-4 py-2 text-white focus:outline-none focus:border-purple-500"
                    placeholder="50000"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Durasi Lelang (Hari)</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="number"
                    value={auctionConfig.durationDays}
                    onChange={(e) => setAuctionConfig({...auctionConfig, durationDays: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-600 rounded pl-10 pr-4 py-2 text-white focus:outline-none focus:border-purple-500"
                    placeholder="14"
                  />
                </div>
                {isEditingAuction && (
                  <p className="text-xs text-orange-400 mt-1">⚠️ Jika lebih pendek dari sisa waktu, timer akan reset. Jika lebih panjang, diabaikan.</p>
                )}
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Bid Deadline (Hari)</label>
                <div className="relative">
                  <Timer className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="number"
                    value={auctionConfig.bidDeadlineDays}
                    onChange={(e) => setAuctionConfig({...auctionConfig, bidDeadlineDays: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-600 rounded pl-10 pr-4 py-2 text-white focus:outline-none focus:border-purple-500"
                    placeholder="3"
                  />
                </div>
              </div>
              <label className="text-sm text-slate-400 mb-1 block">Deskripsi Kondisi Barang</label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <textarea
                  value={auctionConfig.description}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value.length <= 360) {
                      setAuctionConfig({...auctionConfig, description: value})
                      setDescriptionLength(value.length)
                    }
                  }}
                  maxLength={360}  // ✅ UBAH KE 360
                  className="w-full bg-slate-800 border border-slate-600 rounded pl-10 pr-4 py-2 text-white focus:outline-none focus:border-purple-500 min-h-[100px]"
                  placeholder="Contoh: Barang display unit, ada goresan minor di sudut..."
                />

                {/* ✅ CHARACTER COUNTER */}
                <div className="flex justify-between items-center mt-1">
                  <p className={`text-xs ${
                    descriptionLength > 350 ? 'text-red-400 font-semibold' : 'text-slate-500'  // ✅ UBAH KE 350
                  }`}>
                    {descriptionLength}/360 karakter  // ✅ UBAH KE 360
                  </p>
                  {descriptionLength > 340 && (  // ✅ UBAH KE 340
                    <p className="text-xs text-orange-400">
                      ⚠️ Hampir penuh
                    </p>
                  )}
                </div>
            </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Foto Produk Lelang (Max 5 Gambar)
                </label>
                <div className="border-2 border-dashed border-slate-600 rounded-lg p-4">
                  {existingGalleryUrls.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-slate-500 mb-2">Gambar Tersimpan:</p>
                      <div className="grid grid-cols-3 gap-2">
                        {existingGalleryUrls.map((url, index) => (
                          <div key={`existing-${index}`} className="relative group">
                            <img
                              src={url}
                              alt={`Gallery ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg border border-slate-700"
                            />
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => removeExistingImage(index)}
                              className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {imagePreviews.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-slate-500 mb-2">Preview Gambar Baru:</p>
                      <div className="grid grid-cols-3 gap-2">
                        {imagePreviews.map((preview, index) => (
                          <div key={`preview-${index}`} className="relative group">
                            <img
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg border border-slate-700"
                            />
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => removePreviewImage(index)}
                              className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {(existingGalleryUrls.length + imagePreviews.length) < 5 ? (
                    <div className="text-center space-y-2">
                      <Upload className="h-8 w-8 text-slate-500 mx-auto" />
                      <p className="text-sm text-slate-400">
                        Upload {5 - (existingGalleryUrls.length + imagePreviews.length)} gambar lagi
                      </p>
                      <p className="text-xs text-slate-500">Max 10MB per gambar (JPG, PNG, WebP)</p>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                        id="image-upload"
                      />
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById('image-upload')?.click()}
                        disabled={uploadingImage}
                        className="border-slate-600"
                      >
                        {uploadingImage ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Pilih Gambar
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-green-400 text-sm">
                      ✅ Maksimum 5 gambar tercapai
                    </div>
                  )}
                </div>
                {(existingGalleryUrls.length + imagePreviews.length) > 0 && (
                  <p className="text-xs text-slate-500 mt-1">
                    Total: {existingGalleryUrls.length + imagePreviews.length}/5 gambar
                  </p>
                )}
              </div>
            </CardContent>
            <div className="border-t border-slate-700 p-4 flex gap-2 flex-shrink-0">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAuctionModal(false)
                  setSelectedProductId(null)
                  setIsEditingAuction(false)
                  setSelectedFiles([])
                  setImagePreviews([])
                  setExistingGalleryUrls([])
                  setDescriptionLength(0)
                }}
                className="flex-1 border-slate-600"
                disabled={auctionLoading || uploadingImage}
              >
                Batal
              </Button>
              <Button
                onClick={submitAuctionConfig}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
                disabled={auctionLoading || uploadingImage}
              >
                {auctionLoading || uploadingImage ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    {isEditingAuction ? 'Update Lelang' : 'Jadwalkan Lelang'}
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ✅ MODAL CHAT ADMIN - POPUP LEBAR & RESPONSIVE */}
      <Dialog open={!!activeSession} onOpenChange={(open) => {
        if (!open) {
          setActiveSession(null);
          setChatMessages([]);
          setSelectedClient(null); // ✅ TAMBAHKAN INI: Bersihkan data user saat tutup
        }
      }}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-4xl w-[90vw] h-[85vh] flex flex-col p-0 gap-0">
          {/* HEADER MODAL */}
          <DialogHeader className="px-6 py-4 border-b border-slate-700 bg-slate-800/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600/20 p-2 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold text-white">
                    {/* ✅ GANTI JUDUL MENJADI NAMA USER */}
                    {selectedClient?.user_name || 'Client'}
                  </DialogTitle>
                  <DialogDescription className="text-sm text-slate-400">
                    {/* ✅ GANTI SUBTITLE HANYA ID RFQ (TANPA "RFQ: " DI DEPAN) */}
                    {activeSession?.toUpperCase()} 
                  </DialogDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setActiveSession(null);
                  setChatMessages([]);
                }}
                className="text-slate-400 hover:text-white hover:bg-slate-700"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </DialogHeader>

          {/* CHAT MESSAGES - SCROLLABLE AREA */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-950">
            {chatMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <MessageSquare className="h-16 w-16 mb-4 opacity-30" />
                <p className="text-lg font-medium">Belum ada pesan</p>
                <p className="text-sm">Mulai percakapan dengan client</p>
              </div>
            ) : (
              chatMessages.map((msg: any, index: number) => {
                const isAdmin = msg.sender_type === 'admin'
                const isUser = msg.sender_type === 'user'
                const isSameSender = index > 0 && chatMessages[index - 1]?.sender_type === msg.sender_type
                
                // Tentukan nama pengirim
                {chatMessages.map((msg: any, index: number) => {
                  const isAdmin = msg.sender_type === 'admin';
                  const isSameSender = index > 0 && chatMessages[index - 1]?.sender_type === msg.sender_type;
                  
                  // ✅ SOLUSI FINAL: Inline conditional dengan fallback aman
                  const senderName = isAdmin 
                    ? (msg.admin_profile?.admin_name || adminProfile?.admin_name || 'Admin')
                    : (msg.sender_profile?.full_name || 'User');
                
                  return (
                    <div
                      key={msg.id || index}
                      className={`flex ${isAdmin ? 'justify-start' : 'justify-end'} ${
                        isSameSender ? 'mt-1' : 'mt-4'
                      }`}
                    >
                      <div
                        className={`max-w-[70%] ${
                          isAdmin
                            ? 'bg-slate-800 border border-slate-700 text-slate-100'
                            : 'bg-blue-600 text-white'
                        } rounded-2xl px-4 py-3 shadow-sm ${
                          isAdmin ? 'rounded-tl-none' : 'rounded-tr-none'
                        }`}
                      >
                        {/* ✅ TAMPILKAN NAMA HANYA JIKA PENGIRIM BERGANTI */}
                        {!isSameSender && (
                          <p className={`text-xs font-semibold mb-1 ${
                            isAdmin ? 'text-blue-400' : 'text-blue-200'
                          }`}>
                            {senderName}
                          </p>
                        )}
                        
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {msg.message}
                        </p>
                        
                        <p className="text-xs text-right mt-2 opacity-60">
                          {new Date(msg.created_at).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              
                return (
                  <div
                    key={msg.id || index}
                    className={`flex ${isAdmin ? 'justify-start' : 'justify-end'} ${
                      isSameSender ? 'mt-1' : 'mt-4'
                    }`}
                  >
                    <div
                      className={`max-w-[70%] ${
                        isAdmin
                          ? 'bg-slate-800 border border-slate-700 text-slate-100'
                          : 'bg-blue-600 text-white'
                      } rounded-2xl px-4 py-3 shadow-sm ${
                        isAdmin ? 'rounded-tl-none' : 'rounded-tr-none'
                      }`}
                    >
                      {/* Tampilkan Nama Pengirim jika berganti */}
                      {!isSameSender && (
                        <p className={`text-xs font-semibold mb-1 ${isAdmin ? 'text-blue-400' : 'text-blue-200'}`}>
                          {isAdmin 
                            ? (msg.admin_profile?.admin_name || adminProfile?.admin_name || 'Admin')
                            : (msg.sender_profile?.full_name || 'User')}
                        </p>
                      )}
                      
                      {/* Isi Pesan */}
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                      
                      {/* Footer: Waktu */}
                      <p className="text-xs text-right mt-2 opacity-60">
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
            {/* Dummy div untuk auto-scroll */}
            <div ref={adminMessagesEndRef} />
          </div>

          {/* CHAT INPUT - FIXED AT BOTTOM */}
          <div className="border-t border-slate-700 bg-slate-800/50 p-4">
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Ketik pesan..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && chatInput.trim() && activeSession) {
                    sendChatMessage(activeSession, chatInput);
                  }
                }}
              />
              <Button
                onClick={() => {
                  if (chatInput.trim() && activeSession) {  // ✅ Tambah check activeSession
                    sendChatMessage(activeSession, chatInput);
                  }
                }}
                disabled={!chatInput.trim() || !activeSession}  // ✅ Disable jika activeSession null
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed"
              >
                Kirim
                <MessageSquare className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ✅ MODAL CHAT KE CLIENT - ADDED AT END */}
      {showNoteModal && (
        <Dialog open={showNoteModal} onOpenChange={setShowNoteModal}>
          <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-400" />
                  <span className="text-blue-400">Chat ke Client</span>
                </div>
                <select className="bg-slate-800 border border-slate-600 text-white text-sm rounded px-3 py-1 focus:outline-none focus:border-blue-500">
                  <option>Take over</option>
                  <option>Admin 1</option>
                  <option>Admin 2</option>
                  <option>Admin 3</option>
                </select>
              </div>
              <DialogDescription className="text-slate-400">
                {selectedWishlistItem && (
                  <span>Nama Client: {selectedWishlistItem.profiles?.full_name} ({selectedWishlistItem.profiles?.company_name || '-'})</span>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              {selectedWishlistItem && (
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <div className="flex gap-4">
                    {selectedWishlistItem.products?.gambar_url ? (
                      <img
                        src={selectedWishlistItem.products.gambar_url}
                        alt={selectedWishlistItem.products.nama_produk}
                        className="w-20 h-20 object-cover rounded-lg border border-slate-600"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-600">
                        <ImageIcon className="h-8 w-8 text-slate-500" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-white font-medium">{selectedWishlistItem.products?.nama_produk}</p>
                      <p className="text-sm text-slate-400">User: {selectedWishlistItem.profiles?.full_name}</p>
                      <p className="text-sm text-slate-400">Company: {selectedWishlistItem.profiles?.company_name || '-'}</p>
                      <p className="text-blue-400 font-mono text-sm mt-1">
                        {formatRupiah((selectedWishlistItem.price || 0) * selectedWishlistItem.quantity)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Catatan Admin</label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500 min-h-[120px]"
                  placeholder="Contoh: User meminta diskon 10% untuk pembelian bulk..."
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowNoteModal(false)
                  setSelectedWishlistItem(null)
                  setAdminNote('')
                }}
                className="border-slate-600"
                disabled={noteSaving}
              >
                Batal
              </Button>
              <Button
                onClick={handleSaveNote}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={noteSaving}
              >
                {noteSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Simpan Note
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={showProductDetailModal} onOpenChange={setShowProductDetailModal}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-400">
              <Package className="h-5 w-5" />
              Detail Produk
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedProducts.length} produk dalam wishlist ini
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-3 max-h-[60vh] overflow-y-auto">
            {selectedProducts.map((product: any, index: number) => (
              <div key={index} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <div className="flex items-center gap-4">
                  {product.product_image_url ? (
                    <img
                      src={product.product_image_url}
                      alt={product.product_name}
                      className="w-16 h-16 object-cover rounded-lg border border-slate-600"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-slate-700 rounded-lg flex items-center justify-center border border-slate-600">
                      <ImageIcon className="h-8 w-8 text-slate-500" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-white font-medium">{product.product_name}</p>
                    <p className="text-xs text-slate-400 font-mono">SKU: {product.product_id}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-slate-400">Qty: <span className="text-white font-mono">{product.quantity}</span></span>
                      <span className="text-xs text-slate-400">Harga: <span className="text-orange-400 font-mono">{formatRupiah(product.price || product.current_price)}</span></span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <DialogFooter>
            <Button
              onClick={() => setShowProductDetailModal(false)}
              className="w-full bg-slate-700 hover:bg-slate-600 border border-slate-600"
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* ✅ MODAL KONFIRMASI BATALKAN LELANG */}
      {showCancelConfirmModal && (
        <Dialog open={showCancelConfirmModal} onOpenChange={setShowCancelConfirmModal}>
          <DialogContent className="bg-slate-900 border-red-700 text-white max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-500">
                <AlertCircle className="h-6 w-6" />
                Konfirmasi Batalkan Lelang
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* ✅ PERINGATAN KERAS */}
              <div className="bg-red-950/50 border-2 border-red-600 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-400 font-bold text-sm mb-2">PERINGATAN KERAS!</p>
                    <p className="text-red-300 text-sm">
                      Anda akan membatalkan lelang untuk produk:
                    </p>
                    <p className="text-white font-bold mt-1">
                      {cancellingProductName}
                    </p>
                    <p className="text-yellow-400 text-sm mt-3 font-semibold">
                      Lelang akan dihapus dari sistem dan akan dianggap selesai.
                    </p>
                    <p className="text-yellow-400 text-sm">
                      Pikirkan lagi baik-baik!
                    </p>
                  </div>
                </div>
              </div>
              
              {/* ✅ INFO TAMBAHAN */}
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                <p className="text-slate-400 text-xs">
                  Tindakan ini <span className="text-red-400 font-bold">TIDAK DAPAT</span> dibatalkan. 
                  Lelang akan dianggap selesai dan tidak dapat dilanjutkan.
                </p>
              </div>
            </div>
            
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCancelConfirmModal(false)
                  setCancellingProductId(null)
                  setCancellingProductName('')
                }}
                className="border-slate-600"
              >
                Batal
              </Button>
              <Button
                onClick={confirmCancelAuction}
                className="bg-red-600 hover:bg-red-700"
              >
                <X className="h-4 w-4 mr-2" />
                Ya, Batalkan Lelang
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ✅ MODAL PROFIL ADMIN MARKETING - 100% TERPISAH */}
      {showProfileModal && (
        <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
          <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-orange-500">
                <AlertCircle className="h-5 w-5" />
                {!adminProfile?.profile_completed ? 'Lengkapi Profil Admin' : 'Update Profil Admin'}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Profil ini terpisah dari user biasa dan hanya untuk keperluan komunikasi dengan client.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4 space-y-4">
              {!adminProfile?.profile_completed && (
                <div className="bg-orange-950/50 border border-orange-600 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-orange-300 text-sm font-semibold mb-1">
                        Profil Wajib Diisi!
                      </p>
                      <ul className="text-orange-200/80 text-xs space-y-1 list-disc list-inside">
                        <li>Agar client tahu sedang bicara dengan admin siapa</li>
                        <li>Untuk tracking komunikasi yang lebih baik</li>
                        <li>Menghindari tabrakan handle client</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm text-slate-400 mb-1 block">
                  Nama Admin <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={profileData.admin_name}
                  onChange={(e) => setProfileData({...profileData, admin_name: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-orange-500"
                  placeholder="Contoh: Andi Wijaya"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-sm text-slate-400 mb-1 block">
                  Nomor WhatsApp <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  value={profileData.admin_phone}
                  onChange={(e) => setProfileData({...profileData, admin_phone: e.target.value})}
                  className="w-full bg-slate-800 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-orange-500"
                  placeholder="081234567890"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Format: 08xx-xxxx-xxxx
                </p>
              </div>

              {profileData.admin_name && (
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <p className="text-xs text-slate-500 mb-2">Preview Profil:</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-green-500 rounded-full flex items-center justify-center text-white font-bold">
                      {profileData.admin_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{profileData.admin_name}</p>
                      <p className="text-green-400 text-xs font-mono">{profileData.admin_phone || '-'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                onClick={handleSaveProfile}
                disabled={
                  profileLoading || 
                  !profileData.admin_name.trim() || 
                  !profileData.admin_phone.trim()
                }
                className={`w-full ${
                  !profileData.admin_name.trim() || !profileData.admin_phone.trim()
                    ? 'bg-slate-700 cursor-not-allowed opacity-50'
                    : 'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                {profileLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    {!adminProfile?.profile_completed ? 'Simpan & Lanjutkan' : 'Update Profil'}
                  </>
                )}
              </Button>
              
              {/* ✅ WARNING JIKA FIELD KOSONG */}
              {(!profileData.admin_name.trim() || !profileData.admin_phone.trim()) && (
                <p className="text-xs text-red-400 text-center w-full mt-2">
                  ⚠️ Nama dan nomor telepon wajib diisi
                </p>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}