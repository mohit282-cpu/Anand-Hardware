import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Product, Category } from '@/types';

// --------------------------------------------------------
// PUBLIC SERVER-SIDE QUERIES
// Uses stateless Supabase client without cookies() access,
// enabling ISR / SSG static generation without DYNAMIC_SERVER_USAGE errors.
// --------------------------------------------------------

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://bnbscflfrnwuigouxxfc.supabase.co';

const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_ptzvPufFtGVIA3IaK9BCdA_Hycw6wan';

function getPublicClient() {
  return createSupabaseClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });
}

/**
 * Fetch categories with product count safely.
 */
export async function getCategoriesWithCountServer(
  onlyActive = false
): Promise<(Category & { productCount: number })[]> {
  try {
    const supabase = getPublicClient();

    let query = supabase
      .from('categories')
      .select('id, name, slug, description, image_url, active, created_at, updated_at')
      .order('name', { ascending: true });

    if (onlyActive) {
      query = query.eq('active', true);
    }

    const { data: categories, error } = await query;
    if (error || !categories) return [];

    // Fetch product counts safely using category_id grouping
    const { data: products } = await supabase
      .from('products')
      .select('category_id')
      .eq('active', true);

    const countMap: Record<string, number> = {};
    (products || []).forEach((p: any) => {
      if (p.category_id) {
        countMap[p.category_id] = (countMap[p.category_id] || 0) + 1;
      }
    });

    return categories.map((c: any) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description || '',
      imageUrl: c.image_url || '',
      active: c.active,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
      productCount: countMap[c.id] || 0,
    }));
  } catch (err) {
    console.error('Error in getCategoriesWithCountServer:', err);
    return [];
  }
}

/**
 * Fetch categories (without count) for server-side rendering.
 */
export async function getCategoriesServer(onlyActive = false): Promise<Category[]> {
  try {
    const supabase = getPublicClient();

    let query = supabase
      .from('categories')
      .select('id, name, slug, description, image_url, active, created_at, updated_at')
      .order('name', { ascending: true });

    if (onlyActive) {
      query = query.eq('active', true);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    return data.map((c: any) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description || '',
      imageUrl: c.image_url || '',
      active: c.active,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    }));
  } catch (err) {
    console.error('Error in getCategoriesServer:', err);
    return [];
  }
}

/**
 * Fetch featured products for homepage cards.
 */
export async function getFeaturedProductsServer(limit = 8): Promise<Product[]> {
  try {
    const supabase = getPublicClient();

    const { data, error } = await supabase
      .from('products')
      .select('id, name, slug, sku, category_id, category_name, brand, price, unit, description, image_url, image_path, image_alt, stock, low_stock_level, featured, active, created_at, updated_at')
      .eq('active', true)
      .eq('featured', true)
      .order('name', { ascending: true })
      .limit(limit);

    if (error || !data) return [];

    return data.map((p: any) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      categoryId: p.category_id || '',
      categoryName: p.category_name || '',
      brand: p.brand || '',
      price: Number(p.price) || 0,
      unit: p.unit || 'pcs',
      description: p.description || '',
      specifications: {},
      imageUrl: p.image_url || '',
      imagePath: p.image_path || '',
      imageAlt: p.image_alt || '',
      stock: p.stock || 0,
      lowStockLevel: p.low_stock_level || 10,
      featured: p.featured || false,
      active: p.active !== false,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));
  } catch (err) {
    console.error('Error in getFeaturedProductsServer:', err);
    return [];
  }
}

/**
 * Fetch distinct brand names for the homepage brand strip.
 */
export async function getDistinctBrandsServer(): Promise<string[]> {
  try {
    const supabase = getPublicClient();

    const { data, error } = await supabase
      .from('products')
      .select('brand')
      .not('brand', 'is', null)
      .neq('brand', '');

    if (error || !data) return [];

    const brands = Array.from(new Set(data.map((p: any) => p.brand).filter(Boolean)));
    return brands.sort();
  } catch (err) {
    console.error('Error in getDistinctBrandsServer:', err);
    return [];
  }
}

/**
 * Fetch active products for the public catalog page.
 */
export async function getProductsServer(options?: {
  categoryId?: string;
  onlyActive?: boolean;
  featured?: boolean;
  limitCount?: number;
}): Promise<Product[]> {
  try {
    const supabase = getPublicClient();

    let query = supabase
      .from('products')
      .select('id, name, slug, sku, category_id, category_name, brand, price, unit, description, specifications, image_url, image_path, image_alt, stock, low_stock_level, featured, active, created_at, updated_at')
      .order('name', { ascending: true });

    if (options?.onlyActive) {
      query = query.eq('active', true);
    }
    if (options?.categoryId && options.categoryId !== 'all') {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(options.categoryId.trim())) {
        query = query.eq('category_id', options.categoryId.trim());
      } else {
        const { data: catData } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', options.categoryId)
          .single();
        if (catData?.id) {
          query = query.eq('category_id', catData.id);
        }
      }
    }
    if (options?.featured) {
      query = query.eq('featured', true);
    }
    if (options?.limitCount && options.limitCount > 0) {
      query = query.limit(options.limitCount);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    return data.map((p: any) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      categoryId: p.category_id || '',
      categoryName: p.category_name || '',
      brand: p.brand || '',
      price: Number(p.price) || 0,
      unit: p.unit || 'pcs',
      description: p.description || '',
      specifications: p.specifications || {},
      imageUrl: p.image_url || '',
      imagePath: p.image_path || '',
      imageAlt: p.image_alt || '',
      stock: p.stock || 0,
      lowStockLevel: p.low_stock_level || 10,
      featured: p.featured || false,
      active: p.active !== false,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));
  } catch (err) {
    console.error('Error in getProductsServer:', err);
    return [];
  }
}

/**
 * Fetch a single product by slug for the product detail page.
 */
export async function getProductBySlugServer(slug: string): Promise<Product | null> {
  try {
    const supabase = getPublicClient();

    const { data: p, error } = await supabase
      .from('products')
      .select('id, name, slug, sku, category_id, category_name, brand, price, unit, description, specifications, image_url, image_path, image_alt, stock, low_stock_level, featured, active, created_at, updated_at')
      .eq('slug', slug)
      .limit(1)
      .single();

    if (error || !p) return null;

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      categoryId: p.category_id || '',
      categoryName: p.category_name || '',
      brand: p.brand || '',
      price: Number(p.price) || 0,
      unit: p.unit || 'pcs',
      description: p.description || '',
      specifications: p.specifications || {},
      imageUrl: p.image_url || '',
      imagePath: p.image_path || '',
      imageAlt: p.image_alt || '',
      stock: p.stock || 0,
      lowStockLevel: p.low_stock_level || 10,
      featured: p.featured || false,
      active: p.active !== false,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    };
  } catch (err) {
    console.error('Error in getProductBySlugServer:', err);
    return null;
  }
}
