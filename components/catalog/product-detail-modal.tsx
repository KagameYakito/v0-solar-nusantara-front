'use client'

import Image from 'next/image'
import { X, ShoppingCart, Minus, Plus, CheckCircle, Loader2, AlertCircle, Edit2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import type { Product } from '@/hooks/useProducts'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface ProductDetailModalProps {
  product: Product | null
  onClose: () => void
}

interface WishlistItem {
  product_id: string
  product_name: string
  product_image_url?: string | null
  price: number
  quantity: number
  added_date: string
}

interface UserProfile {
  profile_completed: boolean | null
  full_name: string | null
  company_name: string | null
  company_type: string | null
  company_address: string | null
  phone_number: string | null
}

export function ProductDetailModal({ product, onClose }: ProductDetailModalProps) {
  const router = useRouter()
  
  const [quantity, setQuantity] = useState(1)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [wishlist, setWishlist] = useState<WishlistItem[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [showProfileAlert, setShowProfileAlert] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

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

  if (!product) return null

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const estimatedTotal = product.price * quantity

  // ✅ FUNGSI BARU - FETCH USER PROFILE
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('profile_completed, full_name, company_name, company_type, company_address, phone_number')
        .eq('id', userId)
        .single()
      
      if (error) throw error
      setUserProfile(data)
      return data
    } catch (err: any) {
      console.error("Failed to fetch user profile:", err)
      return null
    }
  }

  // ✅ FUNGSI BARU - HITUNG COMPLETION PERCENTAGE
  const getProfileCompletion = (profile: any) => {
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

  const handleAddToWishlist = async () => {
    if (!product) return

    try {
      setIsAdding(true)
      
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        alert("❌ Silakan login dulu untuk menambahkan permintaan!")
        router.push('/auth/signin')
        return
      }

      // ✅ CEK PROFIL LENGKAP ATAU BELUM
      const profile = await fetchUserProfile(session.user.id)
      const completionPercentage = getProfileCompletion(profile)

      if (completionPercentage < 100) {
        setShowProfileAlert(true)
        setIsAdding(false)
        return
      }
  
      // ✅ 1. CEK APAKAH INI WISHLIST PERTAMA
      const { data: allUserWishlists } = await supabase
        .from('wishlists')
        .select('id')
        .eq('user_id', session.user.id)
  
      const isFirstWishlist = allUserWishlists?.length === 0

      // ✅ 2. CEK WISHLIST UNTUK PRODUK YANG SAMA
      const { data: allWishlistItems, error: fetchError } = await supabase
        .from('wishlists')
        .select('id, quantity, status')
        .eq('user_id', session.user.id)
        .eq('product_id', product.id)
  
      if (fetchError) throw fetchError

      // ✅ 3. HITUNG PENDING REQUESTS
      const pendingRequests = allWishlistItems?.filter(item => 
        item.status === 'wishlist' || 
        item.status === 'requested' || 
        item.status === 'pending' || 
        item.status === 'accepted'
      ) || []

      const pendingCount = pendingRequests.length

      // ✅ 4. CEK LIMIT 2 REQUEST AKTIF
      if (pendingCount >= 2) {
        alert("⚠️ Request terlalu banyak! Tunggu lagi setelah request sebelumnya telah direspon admin!")
        setIsAdding(false)
        return
      }
  
      // ✅ 5. JIKA WISHLIST PERTAMA, SET LOCK 7 HARI
      if (isFirstWishlist) {
        const lockDate = new Date()
        lockDate.setDate(lockDate.getDate() + 7)
        
        await supabase
          .from('profiles')
          .update({
            first_wishlist_at: new Date().toISOString(),
            profile_locked_until: lockDate.toISOString()
          })
          .eq('id', session.user.id)
        
        window.dispatchEvent(new CustomEvent('wishlist-updated'))
        
        alert("✅ Wishlist pertama ditambahkan! Profil akan terkunci selama 7 hari untuk menjaga integritas data.")
      } else {
        setShowConfirmModal(true)
      }
  
      // ✅ 6. UPDATE ATAU INSERT WISHLIST
      const existingWishlistItem = allWishlistItems?.find(item => item.status === 'wishlist')
      let error

      if (existingWishlistItem) {
        const newQty = existingWishlistItem.quantity + quantity

        ;({ error } = await supabase
          .from('wishlists')
          .update({ 
            quantity: newQty,
            status: 'wishlist',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingWishlistItem.id))
      } else {
        ;({ error } = await supabase
          .from('wishlists')
          .insert({
            user_id: session.user.id,
            product_id: product.id,
            product_name: product.name,
            product_image_url: product.image_url || null,
            price: product.price,
            quantity: quantity,
            status: 'wishlist',
            created_at: new Date().toISOString()
          }))
      }
  
      if (error) throw error

      // 7. Update Local State
      const newItem: WishlistItem = {
        product_id: product.id,
        product_name: product.name,
        product_image_url: product.image_url,
        price: product.price,
        quantity: quantity,
        added_date: new Date().toISOString()
      }
  
      const existingIndex = wishlist.findIndex(item => item.product_id === product.id)
      let newWishlist: WishlistItem[]
      
      if (existingIndex >= 0) {
        newWishlist = wishlist.map((item, index) => 
          index === existingIndex 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      } else {
        newWishlist = [...wishlist, newItem]
      }
      setWishlist(newWishlist)
      
      localStorage.setItem('sonushub_wishlist', JSON.stringify(newWishlist))
      window.dispatchEvent(new CustomEvent('wishlist-updated'))
  
    } catch (err: any) {
      console.error("Failed to add to wishlist:", err)
      alert("❌ Gagal menambahkan ke wishlist: " + err.message)
    } finally {
      setIsAdding(false)
    }
  }

  const handleCloseConfirm = () => {
    setShowConfirmModal(false)
    setQuantity(1)
    onClose()
  }

  return (
    <>
      {/* MODAL DETAIL PRODUK */}
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="absolute inset-0" onClick={onClose} role="presentation" />

        <div className="bg-card rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative z-10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-foreground/10 rounded-lg transition-colors z-10"
            aria-label="Tutup"
          >
            <X className="h-5 w-5 text-foreground/60" />
          </button>

          <div className="aspect-video bg-background/50 border-b border-foreground/15 relative overflow-hidden">
            <Image
              src={product.image_url || '/placeholder.svg'}
              alt={`${product.name}`}
              fill
              className="object-cover"
              unoptimized
            />
          </div>

          <div className="p-6 space-y-4">
            <h2 className="text-2xl font-bold text-foreground">{product.name}</h2>

            <div className="flex flex-col gap-1">
              <span className="text-sm text-foreground/60 font-medium">
                Harga dimulai dari:
              </span>
              
              <span className="text-2xl font-bold text-primary">
                {formatPrice(product.price)}
              </span>

              <span className="text-[10px] text-foreground/40 italic leading-tight">
                *Harga dapat berubah sesuai ketersediaan pasar. Hubungi kami untuk penawaran final.
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm text-foreground/60">Stok Tersedia:</span>
              <span className="text-lg font-semibold text-foreground">
                {product.stock} Unit
              </span>
            </div>

            {Object.keys(product.specifications).length > 0 && (
              <div className="mt-6 pt-6 border-t border-foreground/15">
                <h3 className="text-sm font-semibold text-foreground mb-3">
                  Spesifikasi:
                </h3>
                <ul className="space-y-2 text-xs text-foreground/70">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <li
                      key={key}
                      className="flex justify-between py-2 border-b border-foreground/10 last:border-0"
                    >
                      <span className="font-medium">{key}</span>
                      <span className="text-foreground/60 text-right">{value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-foreground/15 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Jumlah:</span>
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="h-8 w-8 p-0 border-foreground/30"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="text-lg font-mono text-foreground w-12 text-center">
                    {quantity}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setQuantity(quantity + 1)}
                    className="h-8 w-8 p-0 border-foreground/30"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between bg-primary/10 rounded-lg p-3">
                <span className="text-sm font-medium text-primary">Estimasi Total Harga:</span>
                <span className="text-xl font-bold text-primary">
                  {formatPrice(estimatedTotal)}
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-lg font-semibold"
                onClick={handleAddToWishlist}
                disabled={isAdding}
              >
                {isAdding ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Request Item
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-foreground/30 hover:bg-foreground/5 rounded-lg text-foreground"
                onClick={onClose}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ MODAL ALERT PROFIL (FLEKSIBEL) */}
      <Dialog open={showProfileAlert} onOpenChange={setShowProfileAlert}>
        <DialogContent className="bg-slate-900 border-orange-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-400">
              <AlertCircle className="h-5 w-5" />
              Profil Belum Lengkap
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Lengkapi profil perusahaan Anda terlebih dahulu sebelum melakukan request produk.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {userProfile && (
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-400 text-sm">Kelengkapan Profil:</span>
                  <span className="text-orange-400 font-bold">
                    {getProfileCompletion(userProfile)}%
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-orange-500 h-2 rounded-full transition-all"
                    style={{ width: `${getProfileCompletion(userProfile)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowProfileAlert(false)}
              className="border-slate-600"
            >
              Nanti Saja
            </Button>
            <Button
              onClick={() => {
                setShowProfileAlert(false)
                router.push('/dashboard/user')
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Isi Profil Sekarang
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL KONFIRMASI */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-400">
              <CheckCircle className="h-6 w-6" />
              Berhasil Ditambahkan!
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4 text-center">
            <p className="text-lg font-medium text-white mb-2">
              {product.name}
            </p>
            <p className="text-slate-400">
              Sudah ditambahkan ke Request Product
            </p>
            <div className="mt-4 bg-slate-800/50 rounded-lg p-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Jumlah:</span>
                <span className="text-white font-mono">{quantity} Unit</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-slate-400">Estimasi Total:</span>
                <span className="text-primary font-bold">{formatPrice(estimatedTotal)}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={handleCloseConfirm}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Lanjut Belanja
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}