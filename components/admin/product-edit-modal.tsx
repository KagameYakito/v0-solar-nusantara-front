'use client'

import Image from 'next/image'
import { X, Upload, Save, Loader2, Edit2, Image as ImageIcon, Crop } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog'
import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import ReactCrop, { type Crop as ReactCropType, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

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
  
  // Crop states
  const [showCropModal, setShowCropModal] = useState(false)
  const [crop, setCrop] = useState<ReactCropType>()
  const [completedCrop, setCompletedCrop] = useState<ReactCropType>()
  const [imgSrc, setImgSrc] = useState<string>('')
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (product) {
      console.log(' Product received:', product)
      setEditedProduct({ ...product })
      setImagePreview(product.gambar_url)
      
      if (product.spesifikasi) {
        try {
          const specs = typeof product.spesifikasi === 'string' 
            ? JSON.parse(product.spesifikasi)
            : product.spesifikasi
          setSpecText(JSON.stringify(specs, null, 2))
        } catch (e) {
          console.error('Failed to parse specs:', e)
        }
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

    // Read file and show crop modal
    const reader = new FileReader()
    reader.onload = () => {
      setImgSrc(reader.result as string)
      setShowCropModal(true)
    }
    reader.readAsDataURL(file)
  }

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        1, // aspect ratio 1:1 (square)
        width,
        height
      ),
      width,
      height
    )
    setCrop(crop)
  }, [])

  const handleCropSave = async () => {
    if (!completedCrop || !imgRef.current) return

    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        alert('❌ Gagal memproses gambar')
        return
      }

      const pixelRatio = window.devicePixelRatio || 1
      const scaleX = imgRef.current.naturalWidth / imgRef.current.offsetWidth
      const scaleY = imgRef.current.naturalHeight / imgRef.current.offsetHeight

      canvas.width = Math.floor(completedCrop.width * scaleX * pixelRatio)
      canvas.height = Math.floor(completedCrop.height * scaleY * pixelRatio)

      ctx.scale(pixelRatio, pixelRatio)
      ctx.imageSmoothingQuality = 'high'

      const cropX = completedCrop.x * scaleX
      const cropY = completedCrop.y * scaleY

      ctx.drawImage(
        imgRef.current,
        cropX,
        cropY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        canvas.width,
        canvas.height
      )

      // Convert canvas to blob
      canvas.toBlob(async (blob) => {
        if (!blob) {
          alert('❌ Gagal memproses gambar')
          return
        }

        const file = new File([blob], `cropped-${Date.now()}.png`, {
          type: 'image/png',
        })

        setImageFile(file)
        
        // Create preview URL
        const previewUrl = URL.createObjectURL(blob)
        setImagePreview(previewUrl)
        setShowCropModal(false)
        setEditableFields(prev => ({ ...prev, image: true }))
      }, 'image/png', 0.9)

    } catch (err: any) {
      console.error("Crop error:", err)
      alert('❌ Gagal crop gambar: ' + err.message)
    }
  }

  const uploadImage = async (productId: string): Promise<string | null> => {
    if (!imageFile) return null

    try {
      setUploadingImage(true)
      console.log('📤 Uploading image to cloud storage...')
      
      const fileExt = 'png' // Always PNG after crop
      const fileName = `${productId}-${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

      console.log('✅ Image uploaded to cloud:', urlData.publicUrl)

      // Delete old image if exists
      if (product?.gambar_url) {
        const oldPath = product.gambar_url.split('/').pop()
        if (oldPath && oldPath !== 'null') {
          console.log('🗑️ Deleting old image:', oldPath)
          await supabase.storage
            .from('product-images')
            .remove([oldPath])
        }
      }

      return urlData.publicUrl
    } catch (err: any) {
      console.error("Upload error:", err)
      alert('❌ Gagal upload gambar ke cloud: ' + err.message)
      return null
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSave = async () => {
    if (!editedProduct || !product) {
      console.error('❌ No product to save')
      return
    }

    try {
      console.log('💾 Starting save process...')
      console.log('Product ID:', product.id)
      console.log('Edited Product:', editedProduct)
      console.log('Editable Fields:', editableFields)
      
      setSaving(true)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        alert('️ Sesi login habis. Silakan login ulang.')
        window.location.href = '/auth/signin'
        return
      }

      let imageUrl = editedProduct.gambar_url
      let specs = editedProduct.spesifikasi

      // Upload image if needed
      if (imageFile && editableFields.image) {
        console.log('📸 Uploading new image to cloud...')
        const uploadedUrl = await uploadImage(product.id)
        if (uploadedUrl) {
          imageUrl = uploadedUrl
        }
      }

      // Parse specifications if edited
      if (editableFields.specifications) {
        try {
          specs = JSON.parse(specText)
          console.log(' Parsed specs:', specs)
        } catch (err) {
          alert('❌ Format spesifikasi JSON tidak valid!')
          return
        }
      }

      // Build update data
      const updateData: any = {
        nama_produk: editedProduct.nama_produk,
        stok: editedProduct.stok,
        spesifikasi: specs,
        gambar_url: imageUrl,
        updated_at: new Date().toISOString()
      }

      console.log(' Data to update:', updateData)

      // Update products table
      console.log('🔄 Updating products table...')
      const { data: updateResult, error: updateError } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', product.id)
        .select()

      if (updateError) {
        console.error('❌ Update error:', updateError)
        throw updateError
      }

      console.log('✅ Update result:', updateResult)

      // Insert to latest_updates
      console.log(' Inserting to latest_updates...')
      const { error: insertError } = await supabase
        .from('latest_updates')
        .insert({
          product_id: product.id,
          updated_by: session.user.id,
          updated_at: new Date().toISOString()
        })

      if (insertError) {
        console.error('⚠️ Failed to insert to latest_updates:', insertError)
      }

      alert('✅ Data produk berhasil diupdate!')
      
      console.log('🔄 Calling onSave to refresh data...')
      onSave()
      handleClose()
      
    } catch (err: any) {
      console.error("💥 Save error:", err)
      alert('❌ Gagal update produk: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    console.log('🚪 Closing modal...')
    setEditedProduct(null)
    setImageFile(null)
    setImagePreview(null)
    setEditableFields({
      name: false,
      stock: false,
      specifications: false,
      image: false
    })
    setShowCropModal(false)
    setImgSrc('')
    onClose()
  }

  if (!editedProduct || !product) return null

  const specs = typeof editedProduct.spesifikasi === 'string'
    ? JSON.parse(editedProduct.spesifikasi || '{}')
    : editedProduct.spesifikasi || {}

  return (
    <>
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
                              <Crop className="h-4 w-4 mr-2" />
                              Crop & Update
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
                          Upload & Crop Gambar
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
                  onChange={(e) => {
                    console.log('✏️ Name changed to:', e.target.value)
                    setEditedProduct({ ...editedProduct, nama_produk: e.target.value })
                  }}
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

      {/* CROP MODAL */}
      <Dialog open={showCropModal} onOpenChange={setShowCropModal}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-400">
              <Crop className="h-5 w-5" />
              Crop Gambar Produk
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            {imgSrc && (
              <div className="relative">
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={1} // 1:1 aspect ratio (square)
                  className="max-h-[60vh]"
                >
                  <img
                    ref={imgRef}
                    src={imgSrc}
                    alt="Crop"
                    onLoad={onImageLoad}
                    className="max-w-full"
                  />
                </ReactCrop>
              </div>
            )}
            <p className="text-sm text-slate-400 mt-4 text-center">
              Drag untuk memilih area, lalu klik "Simpan Crop"
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowCropModal(false)
                setImgSrc('')
                setImageFile(null)
              }}
              className="border-slate-600"
            >
              Batal
            </Button>
            <Button
              onClick={handleCropSave}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!completedCrop}
            >
              <Save className="h-4 w-4 mr-2" />
              Simpan Crop
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}