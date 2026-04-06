'use client'

import Image from 'next/image'
import { X, Upload, Save, Loader2, Edit2, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Product {
  id: string
  nama_produk: string | null
  sku: string | null
  gambar_url: string | null
  stok: number | null
  spesifikasi: any
  updated_at: string | null
}

interface ProductEditModalProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

interface EditableField {
  name: boolean
  stock: boolean
  specifications: boolean
  image: boolean
}

export function ProductEditModal({ product, isOpen, onClose, onSave }: ProductEditModalProps) {
  const [editedProduct, setEditedProduct] = useState<Product | null>(null)
  const [editableFields, setEditableFields] = useState<EditableField>({
    name: false,
    stock: false,
    specifications: false,
    image: false
  })
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [specText, setSpecText] = useState('')

  useEffect(() => {
    if (product) {
      setEditedProduct({ ...product })
      setImagePreview(product.gambar_url)
      
      if (product.spesifikasi) {
        const specs = typeof product.spesifikasi === 'string' 
          ? JSON.parse(product.spesifikasi)
          : product.spesifikasi
        setSpecText(JSON.stringify(specs, null, 2))
      }
    }
  }, [product])

  const enableEdit = (field: keyof EditableField) => {
    setEditableFields(prev => ({ ...prev, [field]: true }))
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('❌ Hanya file gambar yang diperbolehkan!')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('❌ Ukuran file maksimal 10MB!')
      return
    }

    setImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
    setEditableFields(prev => ({ ...prev, image: true }))
  }

  const uploadImage = async (productId: string): Promise<string | null> => {
    if (!imageFile) return null

    try {
      setUploadingImage(true)
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${productId}-${Date.now()}.${fileExt}`
      const filePath = `product-images/${fileName}`

      const { error } = await supabase.storage
        .from('product-images')
        .upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: true
        })

      if (error) throw error

      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

      if (product?.gambar_url) {
        const oldPath = product.gambar_url.split('/').pop()
        if (oldPath) {
          await supabase.storage
            .from('product-images')
            .remove([`product-images/${oldPath}`])
        }
      }

      return urlData.publicUrl
    } catch (err: any) {
      console.error("Upload error:", err)
      alert('❌ Gagal upload gambar: ' + err.message)
      return null
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSave = async () => {
    if (!editedProduct || !product) return

    try {
      setSaving(true)

      // ✅ Cek session dulu
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        alert('⚠️ Sesi login habis. Silakan login ulang.')
        window.location.href = '/auth/signin'
        return
      }

      let imageUrl = editedProduct.gambar_url
      let specs = editedProduct.spesifikasi

      if (imageFile && editableFields.image) {
        const uploadedUrl = await uploadImage(product.id)
        if (uploadedUrl) {
          imageUrl = uploadedUrl
        }
      }

      if (editableFields.specifications) {
        try {
          specs = JSON.parse(specText)
        } catch (err) {
          alert('❌ Format spesifikasi JSON tidak valid!')
          return
        }
      }

      const updateData: any = {
        nama_produk: editedProduct.nama_produk,
        stok: editedProduct.stok,
        spesifikasi: specs,
        gambar_url: imageUrl,
        updated_at: new Date().toISOString()
      }

      // ✅ 1. Update tabel products
      const { error: updateError } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', product.id)

      if (updateError) throw updateError

      // ✅ 2. Insert ke latest_updates (FIXED: tidak pakai parseInt)
      await supabase
        .from('latest_updates')
        .insert({
          product_id: product.id, // ✅ UUID langsung, tidak perlu parseInt
          updated_by: session.user.id,
          updated_at: new Date().toISOString()
        })

      alert('✅ Data produk berhasil diupdate!')
      onSave()
      handleClose()
    } catch (err: any) {
      console.error("Save error:", err)
      alert('❌ Gagal update produk: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    setEditedProduct(null)
    setImageFile(null)
    setImagePreview(null)
    setEditableFields({
      name: false,
      stock: false,
      specifications: false,
      image: false
    })
    onClose()
  }

  if (!editedProduct || !product) return null

  const specs = typeof editedProduct.spesifikasi === 'string'
    ? JSON.parse(editedProduct.spesifikasi || '{}')
    : editedProduct.spesifikasi || {}

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="text-xl font-bold text-green-400">Edit Data Produk</span>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Product Image */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-400">Gambar Produk</label>
              {!editableFields.image && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => enableEdit('image')}
                  className="h-6 text-xs text-blue-400 hover:text-blue-300"
                >
                  <Edit2 className="h-3 w-3 mr-1" />
                  Ubah Gambar
                </Button>
              )}
            </div>
            <div className="border-2 border-dashed border-slate-700 rounded-lg p-4">
              {imagePreview ? (
                <div className="relative">
                  <Image
                    src={imagePreview}
                    alt="Product"
                    width={400}
                    height={300}
                    className="w-full h-64 object-cover rounded-lg"
                    unoptimized
                  />
                  {editableFields.image && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                        id="edit-image-upload"
                      />
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById('edit-image-upload')?.click()}
                        disabled={uploadingImage}
                        className="bg-white text-slate-900 hover:bg-slate-100"
                      >
                        {uploadingImage ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Update Gambar
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ImageIcon className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                  {editableFields.image && (
                    <>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                        id="edit-image-upload-empty"
                      />
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById('edit-image-upload-empty')?.click()}
                        disabled={uploadingImage}
                        className="border-slate-600 mt-2"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Gambar
                      </Button>
                    </>
                  )}
                  <p className="text-sm text-slate-500 mt-2">
                    {editableFields.image ? 'Pilih gambar untuk upload' : 'Belum ada gambar'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Product Name */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-400">Nama Produk</label>
              {!editableFields.name && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => enableEdit('name')}
                  className="h-6 text-xs text-blue-400 hover:text-blue-300"
                >
                  <Edit2 className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              )}
            </div>
            {editableFields.name ? (
              <input
                type="text"
                value={editedProduct.nama_produk || ''}
                onChange={(e) => setEditedProduct({ ...editedProduct, nama_produk: e.target.value })}
                className="w-full bg-slate-800 border border-blue-500 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            ) : (
              <div className="bg-slate-800/50 rounded-lg px-4 py-3 text-white">
                {editedProduct.nama_produk || '-'}
              </div>
            )}
          </div>

          {/* Stock */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-400">Stok</label>
              {!editableFields.stock && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => enableEdit('stock')}
                  className="h-6 text-xs text-blue-400 hover:text-blue-300"
                >
                  <Edit2 className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              )}
            </div>
            {editableFields.stock ? (
              <input
                type="number"
                value={editedProduct.stok || 0}
                onChange={(e) => setEditedProduct({ ...editedProduct, stok: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-800 border border-blue-500 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <div className="bg-slate-800/50 rounded-lg px-4 py-3 text-white">
                {editedProduct.stok || 0} Unit
              </div>
            )}
          </div>

          {/* Specifications */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-400">Spesifikasi</label>
              {!editableFields.specifications && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => enableEdit('specifications')}
                  className="h-6 text-xs text-blue-400 hover:text-blue-300"
                >
                  <Edit2 className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              )}
            </div>
            {editableFields.specifications ? (
              <textarea
                value={specText}
                onChange={(e) => setSpecText(e.target.value)}
                className="w-full bg-slate-800 border border-blue-500 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[200px]"
                placeholder='{"Merk": "Goodwe", "Tipe": "Battery", ...}'
              />
            ) : (
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="space-y-2">
                  {Object.entries(specs).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm border-b border-slate-700 pb-2 last:border-0">
                      <span className="text-slate-400">{key}</span>
                      <span className="text-white font-medium">{value as string}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-3 pt-4 border-t border-slate-700">
          <Button
            variant="outline"
            onClick={handleClose}
            className="border-slate-600 flex-1"
            disabled={saving || uploadingImage}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-green-600 hover:bg-green-700 flex-1"
            disabled={saving || uploadingImage}
          >
            {saving || uploadingImage ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Ubah Data
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}