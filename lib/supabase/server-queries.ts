import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Product, Category, BusinessSettings } from '@/types';
import { DEFAULT_SETTINGS } from '@/lib/supabase/services';

// --------------------------------------------------------
// PUBLIC SERVER-SIDE QUERIES
// Uses stateless Supabase client without cookies() access,
// enabling ISR / SSG static generation without DYNAMIC_SERVER_USAGE errors.
// --------------------------------------------------------

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL;

const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY;

function getPublicClient() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.');
  }
  return createSupabaseClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });
}

/**
 * Fetch categories with product count using embedded count (no N+1).
 */
export async function getCategoriesWithCountServer(
  onlyActive = false
): Promise<(Category & { productCount: number })[]> {
  const supabase = getPublicClient();

  let query = supabase
    .from('categories')
    .select('id, name, slug, description, image_url, active, created_at, updated_at, products(count)', { count: 'exact' })
    .order('name', { ascending: true });

  if (onlyActive) {
    query = query.eq('active', true);
  }

  const { data: categories, error } = await query;
  if (error) {
    console.error('Error in getCategoriesWithCountServer:', error);
    throw new Error(`Failed to load categories: ${error.message}`);
  }
  if (!categories) return [];

  return categories.map((c: any) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description || '',
    imageUrl: c.image_url || '',
    active: c.active,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
    productCount: c.products?.[0]?.count || 0,
  }));
}

/**
 * Fetch categories (without count) for server-side rendering.
 */
export async function getCategoriesServer(onlyActive = false): Promise<Category[]> {
  const supabase = getPublicClient();

  let query = supabase
    .from('categories')
    .select('id, name, slug, description, image_url, active, created_at, updated_at')
    .order('name', { ascending: true });

  if (onlyActive) {
    query = query.eq('active', true);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error in getCategoriesServer:', error);
    throw new Error(`Failed to load categories: ${error.message}`);
  }
  if (!data) return [];

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
 * Only selects columns needed for product cards.
 */
export async function getFeaturedProductsServer(limit = 8): Promise<Product[]> {
  const supabase = getPublicClient();

  const { data, error } = await supabase
    .from('products')
    .select('id, name, slug, sku, category_id, category_name, brand, price, unit, description, image_url, image_path, image_alt, stock, low_stock_level, featured, active, created_at, updated_at')
    .eq('active', true)
    .eq('featured', true)
    .order('name', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Error in getFeaturedProductsServer:', error);
    throw new Error(`Failed to load featured products: ${error.message}`);
  }
  if (!data) return [];

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
 * Fetch distinct brand names using database-side DISTINCT.
 * Falls back to client-side dedup if RPC is not available.
 */
export async function getDistinctBrandsServer(): Promise<string[]> {
  const supabase = getPublicClient();

  // Try RPC first (fastest, true DISTINCT at DB level)
  const { data: rpcData, error: rpcError } = await supabase.rpc('get_distinct_brands');

  if (!rpcError && rpcData && Array.isArray(rpcData)) {
    return rpcData.map((r: any) => r.brand).filter(Boolean);
  }

  // Fallback: fetch brand column only and deduplicate
  const { data, error } = await supabase
    .from('products')
    .select('brand')
    .eq('active', true)
    .not('brand', 'is', null)
    .neq('brand', '');

  if (error) {
    console.error('Error in getDistinctBrandsServer:', error);
    return [];
  }
  if (!data) return [];

  const brands = Array.from(new Set(data.map((p: any) => p.brand).filter(Boolean)));
  return brands.sort();
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
  if (error) {
    console.error('Error in getProductsServer:', error);
    throw new Error(`Failed to load products: ${error.message}`);
  }
  if (!data) return [];

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
}

/**
 * Fetch business settings for public headers, footers, contact page, and layout.
 */
export async function getBusinessSettingsServer(): Promise<BusinessSettings> {
  try {
    const supabase = getPublicClient();
    const { data, error } = await supabase
      .from('business_settings')
      .select('business_name, logo_url, phone, email, address, website, opening_hours, whatsapp, facebook, instagram, tax_id, quotation_prefix, invoice_prefix, receipt_prefix, updated_at')
      .eq('id', 'default')
      .single();

    if (error || !data) return DEFAULT_SETTINGS;
    return {
      businessName: data.business_name || DEFAULT_SETTINGS.businessName,
      logoUrl: data.logo_url || '',
      phone: data.phone || DEFAULT_SETTINGS.phone,
      email: data.email || DEFAULT_SETTINGS.email,
      address: data.address || DEFAULT_SETTINGS.address,
      website: data.website || DEFAULT_SETTINGS.website,
      openingHours: data.opening_hours || DEFAULT_SETTINGS.openingHours,
      whatsapp: data.whatsapp || DEFAULT_SETTINGS.whatsapp,
      facebook: data.facebook || '',
      instagram: data.instagram || '',
      taxId: data.tax_id || DEFAULT_SETTINGS.taxId,
      quotationPrefix: data.quotation_prefix || DEFAULT_SETTINGS.quotationPrefix,
      invoicePrefix: data.invoice_prefix || DEFAULT_SETTINGS.invoicePrefix,
      receiptPrefix: data.receipt_prefix || DEFAULT_SETTINGS.receiptPrefix,
      updatedAt: data.updated_at,
    };
  } catch (err) {
    console.error('Error in getBusinessSettingsServer:', err);
    return DEFAULT_SETTINGS;
  }
}
