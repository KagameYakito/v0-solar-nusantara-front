// hooks/useProducts.ts
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  specifications: Record<string, any>;
  image_url: string | null;
}

export interface CategoryCount {
  name: string;
  count: number;
}

// --- FUNGSI GLOBAL KATEGORI (DIPERBAIKI LOGIKANYA) ---
async function fetchGlobalCategories() {
  console.log("🔄 Mengambil semua kategori dari database...");
  const { data, error } = await supabase.from('products').select('kategori');
  
  if (error) {
    console.error("❌ Gagal ambil kategori:", error);
    return [];
  }

  const map: Record<string, number> = {};
  
  for (const item of data || []) {
    if (!item.kategori) continue;
    
    // Bersihkan format: hapus kutip ganda, split koma, trim spasi
    const cleanString = item.kategori.replace(/""/g, "");
    const cats = cleanString.split(',');

    for (const cat of cats) {
      const clean = cat.trim(); // Hapus spasi depan/belakang
      if (clean) {
        map[clean] = (map[clean] || 0) + 1;
      }
    }
  }
  
  const result = Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name));
  console.log("✅ Kategori global didapat:", result.length, "kategori.");
  
  // DEBUG: Cek berapa hitungan untuk 'baterai surya'
  console.log("📊 Hitungan 'baterai surya' di sidebar:", map['baterai surya'] || 0);
  
  return result;
}

export function useProducts(page: number = 1, perPage: number = 28, searchTerm: string = '', selectedCategory: string | null = null) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const start = (page - 1) * perPage;
        const end = start + perPage - 1;

        let supabaseQuery = supabase.from('products').select('*', { count: 'exact' });

        // 2. FILTER BERDASARKAN KATEGORI
        if (selectedCategory) {
          // PASTIKAN FORMAT PENCARIAN SAMA DENGAN YANG DI HITUNG DI fetchGlobalCategories
          supabaseQuery = supabaseQuery.ilike('kategori', `%${selectedCategory}%`);
          console.log(`🔍 Filtering kategori: "${selectedCategory}"`);
        }

        // 3. FILTER BERDASARKAN SEARCH TERM
        if (searchTerm && searchTerm.trim() !== '') {
          supabaseQuery = supabaseQuery.ilike('nama_produk', `%${searchTerm.trim()}%`);
        }

        const {  data: pageData, count, error: supabaseError } = await supabaseQuery
          .range(start, end)
          .order('id', { ascending: true });

        if (supabaseError) throw supabaseError;

        if (!pageData || pageData.length === 0) {
          setProducts([]);
          setTotalCount(0);
          setLoading(false);
          return;
        }

        // Parse Data Produk
        const transformedData: Product[] = [];
        for (const item of pageData) {
          let specs: Record<string, any> = {};
          
          if (item.spesifikasi && typeof item.spesifikasi === 'string') {
            try {
              const cleanJsonString = item.spesifikasi.replace(/""/g, '"');
              const parsed = JSON.parse(cleanJsonString);
              specs = (parsed && typeof parsed === 'object') ? parsed : { "Note": "Invalid" };
            } catch (e) { specs = { "Note": "Error Parse" }; }
          } else if (item.spesifikasi) { specs = item.spesifikasi; }

          transformedData.push({
            id: item.id?.toString() || '0',
            name: item.nama_produk || 'Produk Tanpa Nama',
            price: item.harga ? Number(item.harga) : 0,
            stock: item.stok ? Number(item.stok) : 0,
            category: item.kategori || '',
            specifications: specs,
            image_url: item.gambar_url || null,
          });
        }

        setProducts(transformedData);
        setTotalCount(count || 0);
        
        if (categories.length === 0 && !selectedCategory) {
          const globalCats = await fetchGlobalCategories();
          setCategories(globalCats);
        }

        console.log(`✅ HALAMAN ${page}: Memuat ${transformedData.length} produk.`);
        console.log(`📊 TOTAL HASIL (Filtered): ${count} produk`);

        setLoading(false);

      } catch (err: any) {
        setError(err.message);
        console.error("❌ Error:", err);
        setLoading(false);
      }
    };

    fetchData();
  }, [page, perPage, searchTerm, selectedCategory]);

  return { products, categories, loading, error, totalCount };
}