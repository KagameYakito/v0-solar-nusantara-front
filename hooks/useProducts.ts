// hooks/useProducts.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabaseClient';

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category_id: number | null;
  sub_category_id: number | null;  // ✅ TAMBAHKAN INI
  specifications: Record<string, any>;
  image_url: string | null;
}

export interface CategoryCount {
  id: number;
  name: string;
  count: number;
  is_default?: boolean;
}

interface UseProductsReturn {
  products: Product[];
  categories: CategoryCount[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  globalTotalCount: number;
}

export function useProducts(
  page: number = 1, 
  perPage: number = 28, 
  searchTerm: string = '', 
  selectedCategoryId: number | null = null,
  selectedSubCategoryId: number | null = null  // ✅ TAMBAHKAN PARAMETER INI
): UseProductsReturn {
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [globalTotalCount, setGlobalTotalCount] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. GLOBAL TOTAL (Untuk tombol "Semua Produk")
        const { count: globalCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true });
        setGlobalTotalCount(globalCount || 0);

        // 2. AMBIL KATEGORI
        const { data: catData, error: catError } = await supabase
          .from('categories')
          .select('id, name, slug, is_default')
          .order('name', { ascending: true });

        if (catError) {
          console.error('Category fetch error:', catError);
          throw catError;
        }

        // Hitung jumlah produk per kategori
        if (catData) {
          const categoriesWithCount = await Promise.all(
            catData.map(async (cat) => {
              const { count } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true })
                .eq('category_id', cat.id);
              
              return { 
                id: cat.id, 
                name: cat.name, 
                count: count || 0,
                is_default: cat.is_default || false
              };
            })
          );
          setCategories(categoriesWithCount);
        }

        // 3. QUERY PRODUK
        console.log('📊 Filter params:', { selectedSubCategoryId, selectedCategoryId });

        let query = supabase.from('products').select('*', { count: 'exact' });

        // ✅ FILTER BY SUB-CATEGORY (Lebih Prioritas)
        if (selectedSubCategoryId !== null) {
          console.log('🎯 Filtering by sub_category_id:', selectedSubCategoryId);
          query = query.eq('sub_category_id', selectedSubCategoryId);
        }
        // Filter by category (jika tidak ada sub-category)
        else if (selectedCategoryId !== null) {
          console.log('🎯 Filtering by category_id:', selectedCategoryId);
          query = query.eq('category_id', selectedCategoryId);
        }

        // Filter by search term
        if (searchTerm && searchTerm.trim() !== '') {
          query = query.ilike('nama_produk', `%${searchTerm.trim()}%`);
        }

        // Pagination
        const start = (page - 1) * perPage;
        const end = start + perPage - 1;

        const { data: pageData, count, error: prodError } = await query
          .range(start, end)
          .order('id', { ascending: true });

        if (prodError) {
          console.error('Product fetch error:', prodError);
          throw prodError;
        }

        // Transformasi Data Produk
        const transformedData: Product[] = (pageData || []).map((item: any) => {
          let specs: Record<string, any> = {};
          
          if (item.spesifikasi) {
            if (typeof item.spesifikasi === 'string') {
              try {
                specs = JSON.parse(item.spesifikasi);
              } catch (e) {
                specs = { "Note": "Parse Error" };
              }
            } else {
              specs = item.spesifikasi;
            }
          }

          return {
            id: item.id?.toString() || '0',
            name: item.nama_produk || 'Produk Tanpa Nama',
            price: item.harga ? Number(item.harga) : 0,
            stock: item.stok ? Number(item.stok) : 0,
            category_id: item.category_id,
            sub_category_id: item.sub_category_id,  // ✅ TAMBAHKAN INI
            specifications: specs,
            image_url: item.gambar_url || null,
          };
        });

        setProducts(transformedData);
        setTotalCount(count || 0);
        setLoading(false);

      } catch (err: any) {
        console.error("❌ Error fetching data:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [page, perPage, searchTerm, selectedCategoryId, selectedSubCategoryId]);  // ✅ TAMBAHKAN selectedSubCategoryId ke dependency

  return { products, categories, loading, error, totalCount, globalTotalCount };
}