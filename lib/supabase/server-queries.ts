import { createClient } from '@/lib/server';
import { Product, Category } from '@/types';

// --------------------------------------------------------
// SERVER-SIDE OPTIMIZED QUERIES
// These functions use the server Supabase client (cookie-based)
// and select only the columns needed for each use case.
// Used exclusively in Server Components for SSR/ISR pages.
// --------------------------------------------------------

/**
 * Fetch categories with product count using a single efficient query.
 * Replaces the N+1 pattern of fetching all categories + all product category_ids.
 */
export async function getCategoriesWithCountServer(
  onlyActive = false
): Promise<(Category & { productCount: number })[]> {
  const supabase = await createClient();

  let query = supabase
    .from('categories')
    .select('id, name, slug, description, image_url, active, created_at, updated_at, products(count)')
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
    productCount: c.products?.[0]?.count ?? 0,
  }));
}

/**
 * Fetch categories (without count) for server-side rendering.
 */
export async function getCategoriesServer(onlyActive = false): Promise<Category[]> {
  const supabase = await createClient();

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
}

/**
 * Fetch featured products for homepage cards.
 * Only selects columns needed for product card display.
 */
export async function getFeaturedProductsServer(limit = 8): Promise<Product[]> {
  const supabase = await createClient();

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
}

/**
 * Fetch distinct brand names for the homepage brand strip.
 */
export async function getDistinctBrandsServer(): Promise<string[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('products')
    .select('brand')
    .not('brand', 'is', null)
    .neq('brand', '');

  if (error || !data) return [];

  const brands = Array.from(new Set(data.map((p: any) => p.brand).filter(Boolean)));
  return brands.sort();
}

/**
 * Fetch active products for the public catalog page.
 * Uses server client for proper SSR caching.
 */
export async function getProductsServer(options?: {
  categoryId?: string;
  onlyActive?: boolean;
  featured?: boolean;
  limitCount?: number;
}): Promise<Product[]> {
  const supabase = await createClient();

  let query = supabase
    .from('products')
    .select('id, name, slug, sku, category_id, category_name, brand, price, unit, description, specifications, image_url, image_path, image_alt, stock, low_stock_level, featured, active, created_at, updated_at')
    .order('name', { ascending: true });

  if (options?.onlyActive) {
    query = query.eq('active', true);
  }
  if (options?.categoryId && options.categoryId !== 'all') {
    // Try UUID match first, then slug
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
}

/**
 * Fetch a single product by slug for the product detail page.
 */
export async function getProductBySlugServer(slug: string): Promise<Product | null> {
  const supabase = await createClient();

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
}
