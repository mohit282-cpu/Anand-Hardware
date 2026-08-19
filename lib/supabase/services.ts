import { supabase } from './client';
import {
  Product,
  Category,
  InventoryTransaction,
  Customer,
  Lead,
  Quotation,
  Invoice,
  Payment,
  CustomerLedgerEntry,
  BusinessSettings,
  LeadStatus,
  QuotationStatus,
  InvoiceStatus,
  PaymentMethod,
} from '@/types';
import { getNepalFY, formatDocumentNumber } from '@/lib/utils/nepalFY';

// Default settings used as fallback when business_settings table has no row.
// These contain the ACTUAL registered business information.
// They should be updated via /admin/settings and stored in the database.
export const DEFAULT_SETTINGS: BusinessSettings = {
  businessName: 'ANAND HARDWARE',
  logoUrl: '',
  phone: '',
  email: '',
  address: 'Biratnagar, Morang, Nepal',
  website: '',
  openingHours: '',
  whatsapp: '',
  facebook: '',
  instagram: '',
  taxId: '',
  quotationPrefix: 'QT-',
  invoicePrefix: 'INV-',
  receiptPrefix: 'REC-',
};

// --------------------------------------------------------
// FINANCIAL SEQUENCE GENERATION (PostgreSQL Transactional)
// --------------------------------------------------------
export async function getNextSequenceNumber(
  seqType: 'quotations' | 'invoices' | 'payments',
  fyKey: string
): Promise<number> {
  const { data, error } = await supabase.rpc('get_next_sequence_number', {
    p_seq_type: seqType,
    p_fy_key: fyKey,
  });

  if (error || typeof data !== 'number') {
    // CRITICAL: Do NOT fallback to read-then-upsert — it is NOT concurrency safe.
    // The RPC must be installed. See supabase/schema.sql for the function definition.
    throw new Error(
      `Financial sequence generation failed for ${seqType}/${fyKey}: ${error?.message || 'RPC returned non-numeric value'}. ` +
      'Ensure the get_next_sequence_number() function is installed in your Supabase database (see supabase/schema.sql).'
    );
  }

  return data;
}

export function toValidUuidOrNull(id?: string | null): string | null {
  if (!id || typeof id !== 'string') return null;
  const trimmed = id.trim();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(trimmed) ? trimmed : null;
}

// --------------------------------------------------------
// CATEGORIES SERVICE
// --------------------------------------------------------
export async function getCategories(onlyActive = false): Promise<Category[]> {
  let query = supabase.from('categories').select('id, name, slug, description, image_url, active, created_at, updated_at').order('name', { ascending: true });
  if (onlyActive) {
    query = query.eq('active', true);
  }
  const { data, error } = await query;
  if (error) {
    console.error('Error fetching categories:', error);
    throw new Error(`Failed to load categories: ${error.message}`);
  }
  return (data || []).map(c => ({
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

export async function getCategoriesWithCount(onlyActive = false): Promise<(Category & { productCount: number })[]> {
  let query = supabase
    .from('categories')
    .select('id, name, slug, description, image_url, active, created_at, updated_at, products(count)')
    .order('name', { ascending: true });
  if (onlyActive) {
    query = query.eq('active', true);
  }
  const { data, error } = await query;
  if (error) {
    console.error('Error fetching categories with count:', error);
    throw new Error(`Failed to load categories: ${error.message}`);
  }
  return (data || []).map((c: any) => ({
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

export async function getDistinctBrands(): Promise<string[]> {
  // Try RPC first (true DISTINCT at DB level)
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
  if (error || !data) return [];
  const brands = Array.from(new Set(data.map((p: any) => p.brand).filter(Boolean)));
  return brands.sort();
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const { data, error } = await supabase.from('categories').select('id, name, slug, description, image_url, active, created_at, updated_at').eq('id', id).single();
  if (error || !data) return null;
  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    description: data.description || '',
    imageUrl: data.image_url || '',
    active: data.active,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function createCategory(data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const { data: newRow, error } = await supabase.from('categories').insert({
    name: data.name,
    slug,
    description: data.description || '',
    image_url: data.imageUrl || '',
    active: data.active !== false,
  }).select('id').single();

  if (error) throw error;
  return newRow.id;
}

export async function updateCategory(id: string, data: Partial<Category>): Promise<void> {
  const updates: Record<string, any> = { updated_at: new Date().toISOString() };
  if (data.name !== undefined) updates.name = data.name;
  if (data.slug !== undefined) updates.slug = data.slug;
  if (data.description !== undefined) updates.description = data.description;
  if (data.imageUrl !== undefined) updates.image_url = data.imageUrl;
  if (data.active !== undefined) updates.active = data.active;

  const { error } = await supabase.from('categories').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteCategory(id: string): Promise<{ success: boolean; message?: string }> {
  try {
    const { data: prodData } = await supabase.from('products').select('id').eq('category_id', id).limit(1);
    if (prodData && prodData.length > 0) {
      return { success: false, message: 'Cannot delete category: products are assigned to it.' };
    }
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to delete category.' };
  }
}

// --------------------------------------------------------
// PRODUCTS SERVICE
// --------------------------------------------------------
export async function getProducts(options?: {
  categoryId?: string;
  onlyActive?: boolean;
  featured?: boolean;
  limitCount?: number;
}): Promise<Product[]> {
  let query = supabase.from('products')
    .select('id, name, slug, sku, category_id, category_name, brand, price, unit, description, specifications, image_url, image_path, image_alt, stock, low_stock_level, featured, active, created_at, updated_at')
    .order('name', { ascending: true });

  if (options?.onlyActive) {
    query = query.eq('active', true);
  }
  if (options?.categoryId && options.categoryId !== 'all') {
    const validUuid = toValidUuidOrNull(options.categoryId);
    if (validUuid) {
      query = query.eq('category_id', validUuid);
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
  if (error) throw error;

  return (data || []).map(p => ({
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

export async function getProductById(id: string): Promise<Product | null> {
  const { data: p, error } = await supabase.from('products')
    .select('id, name, slug, sku, category_id, category_name, brand, price, unit, description, specifications, image_url, image_path, image_alt, stock, low_stock_level, featured, active, created_at, updated_at')
    .eq('id', id).single();
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

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { data: p, error } = await supabase.from('products')
    .select('id, name, slug, sku, category_id, category_name, brand, price, unit, description, specifications, image_url, image_path, image_alt, stock, low_stock_level, featured, active, created_at, updated_at')
    .eq('slug', slug).limit(1).single();
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

export async function createProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const payload: Record<string, any> = {
    name: data.name,
    slug,
    sku: data.sku,
    category_id: toValidUuidOrNull(data.categoryId),
    category_name: data.categoryName || '',
    brand: data.brand || '',
    price: data.price,
    unit: data.unit,
    description: data.description || '',
    specifications: typeof data.specifications === 'object' ? data.specifications : {},
    image_url: data.imageUrl || '',
    image_path: data.imagePath || '',
    image_alt: data.imageAlt || '',
    stock: data.stock || 0,
    low_stock_level: data.lowStockLevel || 10,
    featured: data.featured || false,
    active: data.active !== false,
  };

  try {
    const { data: newRow, error } = await supabase.from('products').insert(payload).select('id').single();
    if (error) throw error;
    return newRow.id;
  } catch (err: any) {
    // If schema cache hasn't reloaded image_path/image_alt columns yet, retry without them
    if (err.message?.includes('image_alt') || err.message?.includes('image_path') || err.code === 'PGRST204') {
      console.warn('PostgREST schema mismatch detected. Retrying product creation without extended image columns...');
      delete payload.image_path;
      delete payload.image_alt;
      const { data: fallbackRow, error: fallbackErr } = await supabase.from('products').insert(payload).select('id').single();
      if (fallbackErr) throw fallbackErr;
      return fallbackRow.id;
    }
    throw err;
  }
}

export async function updateProduct(id: string, data: Partial<Product>): Promise<void> {
  const updates: Record<string, any> = { updated_at: new Date().toISOString() };
  if (data.name !== undefined) updates.name = data.name;
  if (data.slug !== undefined) updates.slug = data.slug;
  if (data.sku !== undefined) updates.sku = data.sku;
  if (data.categoryId !== undefined) updates.category_id = toValidUuidOrNull(data.categoryId);
  if (data.categoryName !== undefined) updates.category_name = data.categoryName;
  if (data.brand !== undefined) updates.brand = data.brand;
  if (data.price !== undefined) updates.price = data.price;
  if (data.unit !== undefined) updates.unit = data.unit;
  if (data.description !== undefined) updates.description = data.description;
  if (data.specifications !== undefined) {
    updates.specifications = typeof data.specifications === 'object' ? data.specifications : {};
  }
  if (data.imageUrl !== undefined) updates.image_url = data.imageUrl;
  if (data.imagePath !== undefined) updates.image_path = data.imagePath;
  if (data.imageAlt !== undefined) updates.image_alt = data.imageAlt;
  if (data.stock !== undefined) updates.stock = data.stock;
  if (data.lowStockLevel !== undefined) updates.low_stock_level = data.lowStockLevel;
  if (data.featured !== undefined) updates.featured = data.featured;
  if (data.active !== undefined) updates.active = data.active;

  try {
    const { error } = await supabase.from('products').update(updates).eq('id', id);
    if (error) throw error;
  } catch (err: any) {
    if (err.message?.includes('image_alt') || err.message?.includes('image_path') || err.code === 'PGRST204') {
      delete updates.image_path;
      delete updates.image_alt;
      const { error: fallbackErr } = await supabase.from('products').update(updates).eq('id', id);
      if (fallbackErr) throw fallbackErr;
    } else {
      throw err;
    }
  }
}

export async function deleteProduct(id: string): Promise<void> {
  const prod = await getProductById(id);
  if (prod?.imagePath) {
    const { deleteProductImage } = await import('./storage');
    deleteProductImage(prod.imagePath).catch(() => {});
  }
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

// --------------------------------------------------------
// INVENTORY SERVICE
// --------------------------------------------------------
export async function getInventoryTransactions(): Promise<InventoryTransaction[]> {
  const { data, error } = await supabase.from('inventory_transactions')
    .select('id, product_id, product_name, type, quantity, reason, reference_type, reference_id, note, created_at, created_by')
    .order('created_at', { ascending: false }).limit(100);
  if (error) throw error;
  return (data || []).map(tx => ({
    id: tx.id,
    productId: tx.product_id,
    productName: tx.product_name,
    type: tx.type,
    quantity: tx.quantity,
    reason: tx.reason,
    referenceType: tx.reference_type,
    referenceId: tx.reference_id,
    note: tx.note,
    createdAt: tx.created_at,
    createdBy: tx.created_by,
  }));
}

export async function addInventoryTransaction(
  data: Omit<InventoryTransaction, 'id' | 'createdAt'>
): Promise<{ success: boolean; message?: string }> {
  try {
    const { data: prod, error: prodErr } = await supabase.from('products').select('stock').eq('id', data.productId).single();
    if (prodErr || !prod) {
      return { success: false, message: `Product not found.` };
    }

    const currentStock = prod.stock || 0;
    let newStock = currentStock;

    if (data.type === 'STOCK_IN' || data.type === 'RETURN') {
      newStock += data.quantity;
    } else if (data.type === 'STOCK_OUT' || data.type === 'DAMAGE') {
      if (data.quantity > currentStock) {
        return { success: false, message: `Insufficient stock for ${data.productName}. Available: ${currentStock}, Requested: ${data.quantity}` };
      }
      newStock -= data.quantity;
    } else if (data.type === 'ADJUSTMENT') {
      newStock = data.quantity;
    }

    await supabase.from('products').update({ stock: newStock, updated_at: new Date().toISOString() }).eq('id', data.productId);
    await supabase.from('inventory_transactions').insert({
      product_id: data.productId,
      product_name: data.productName,
      type: data.type,
      quantity: data.quantity,
      reason: data.reason,
      reference_type: data.referenceType || null,
      reference_id: data.referenceId || null,
      note: data.note || null,
      created_by: data.createdBy || 'Staff',
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to record stock transaction.' };
  }
}

// --------------------------------------------------------
// CUSTOMERS SERVICE
// --------------------------------------------------------
export async function getCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase.from('customers')
    .select('id, name, phone, email, company, address, notes, total_purchases, total_paid, current_outstanding, advance_balance, credit_limit, created_at, updated_at')
    .order('name', { ascending: true });
  if (error) throw error;
  return (data || []).map(c => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email || '',
    company: c.company || '',
    address: c.address || '',
    notes: c.notes || '',
    totalPurchases: Number(c.total_purchases) || 0,
    totalPaid: Number(c.total_paid) || 0,
    currentOutstanding: Number(c.current_outstanding) || 0,
    advanceBalance: Number(c.advance_balance) || 0,
    creditLimit: Number(c.credit_limit) || 0,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  }));
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const { data: c, error } = await supabase.from('customers')
    .select('id, name, phone, email, company, address, notes, total_purchases, total_paid, current_outstanding, advance_balance, credit_limit, created_at, updated_at')
    .eq('id', id).single();
  if (error || !c) return null;
  return {
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email || '',
    company: c.company || '',
    address: c.address || '',
    notes: c.notes || '',
    totalPurchases: Number(c.total_purchases) || 0,
    totalPaid: Number(c.total_paid) || 0,
    currentOutstanding: Number(c.current_outstanding) || 0,
    advanceBalance: Number(c.advance_balance) || 0,
    creditLimit: Number(c.credit_limit) || 0,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  };
}

export async function createCustomer(data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const { data: newRow, error } = await supabase.from('customers').insert({
    name: data.name,
    phone: data.phone,
    email: data.email || '',
    company: data.company || '',
    address: data.address || '',
    notes: data.notes || '',
    credit_limit: data.creditLimit || 0,
  }).select('id').single();

  if (error) throw error;
  return newRow.id;
}

export async function updateCustomer(id: string, data: Partial<Customer>): Promise<void> {
  const updates: Record<string, any> = { updated_at: new Date().toISOString() };
  if (data.name !== undefined) updates.name = data.name;
  if (data.phone !== undefined) updates.phone = data.phone;
  if (data.email !== undefined) updates.email = data.email;
  if (data.company !== undefined) updates.company = data.company;
  if (data.address !== undefined) updates.address = data.address;
  if (data.notes !== undefined) updates.notes = data.notes;
  if (data.totalPurchases !== undefined) updates.total_purchases = data.totalPurchases;
  if (data.totalPaid !== undefined) updates.total_paid = data.totalPaid;
  if (data.currentOutstanding !== undefined) updates.current_outstanding = data.currentOutstanding;
  if (data.advanceBalance !== undefined) updates.advance_balance = data.advanceBalance;
  if (data.creditLimit !== undefined) updates.credit_limit = data.creditLimit;

  const { error } = await supabase.from('customers').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteCustomer(id: string): Promise<void> {
  const { error } = await supabase.from('customers').delete().eq('id', id);
  if (error) throw error;
}

// --------------------------------------------------------
// LEADS SERVICE
// --------------------------------------------------------
export async function getLeads(status?: LeadStatus): Promise<Lead[]> {
  let query = supabase.from('leads')
    .select('id, customer_id, customer_name, phone, email, company, product_id, product_name, quantity, message, status, assigned_to, created_at, updated_at')
    .order('created_at', { ascending: false });
  if (status) {
    query = query.eq('status', status);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(l => ({
    id: l.id,
    customerId: l.customer_id,
    customerName: l.customer_name,
    phone: l.phone,
    email: l.email || '',
    company: l.company || '',
    productId: l.product_id,
    productName: l.product_name,
    quantity: l.quantity,
    message: l.message || '',
    status: l.status,
    assignedTo: l.assigned_to,
    createdAt: l.created_at,
    updatedAt: l.updated_at,
  }));
}

export async function createLead(data: Omit<Lead, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const { data: newRow, error } = await supabase.from('leads').insert({
    customer_id: data.customerId || null,
    customer_name: data.customerName,
    phone: data.phone,
    email: data.email || '',
    company: data.company || '',
    product_id: data.productId || null,
    product_name: data.productName,
    quantity: data.quantity || 1,
    message: data.message || '',
    status: 'NEW',
  }).select('id').single();

  if (error) throw error;
  return newRow.id;
}

export const createLeadInquiry = createLead;

export async function updateLeadStatus(id: string, status: LeadStatus): Promise<void> {
  const { error } = await supabase.from('leads').update({
    status,
    updated_at: new Date().toISOString(),
  }).eq('id', id);
  if (error) throw error;
}

// --------------------------------------------------------
// QUOTATIONS SERVICE
// --------------------------------------------------------
export async function getQuotations(status?: QuotationStatus): Promise<Quotation[]> {
  try {
    let query = supabase.from('quotations').select('*, quotation_items(*)').order('created_at', { ascending: false });
    if (status) {
      query = query.eq('status', status);
    }
    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map(q => ({
      id: q.id,
      quotationNumber: q.quotation_number,
      customerId: q.customer_id,
      customer: q.customer_info || { name: '', phone: '' },
      items: (q.quotation_items || []).map((item: any) => ({
        productId: item.product_id,
        productName: item.product_name,
        sku: item.sku,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: Number(item.unit_price),
        subtotal: Number(item.subtotal),
      })),
      subtotal: Number(q.subtotal),
      discount: Number(q.discount),
      tax: Number(q.tax),
      total: Number(q.total),
      status: q.status,
      notes: q.notes || '',
      invoiceId: q.invoice_id,
      createdAt: q.created_at,
      updatedAt: q.updated_at,
      createdBy: q.created_by,
    }));
  } catch (err) {
    console.error('Error fetching quotations:', err);
    return [];
  }
}

export async function getQuotationById(id: string): Promise<Quotation | null> {
  try {
    const { data: q, error } = await supabase.from('quotations').select('*, quotation_items(*)').eq('id', id).single();
    if (error || !q) return null;
    return {
      id: q.id,
      quotationNumber: q.quotation_number,
      customerId: q.customer_id,
      customer: q.customer_info || { name: '', phone: '' },
      items: (q.quotation_items || []).map((item: any) => ({
        productId: item.product_id,
        productName: item.product_name,
        sku: item.sku,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: Number(item.unit_price),
        subtotal: Number(item.subtotal),
      })),
      subtotal: Number(q.subtotal),
      discount: Number(q.discount),
      tax: Number(q.tax),
      total: Number(q.total),
      status: q.status,
      notes: q.notes || '',
      invoiceId: q.invoice_id,
      createdAt: q.created_at,
      updatedAt: q.updated_at,
      createdBy: q.created_by,
    };
  } catch (err) {
    return null;
  }
}

export async function createQuotation(
  data: Omit<Quotation, 'id' | 'quotationNumber' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const fyInfo = getNepalFY();
  const seqNum = await getNextSequenceNumber('quotations', fyInfo.fyKey);
  const quotationNumber = formatDocumentNumber('QT', fyInfo.fyString, seqNum);

  const { data: newQ, error: qErr } = await supabase.from('quotations').insert({
    quotation_number: quotationNumber,
    financial_year: fyInfo.fyString,
    customer_id: data.customerId || null,
    customer_info: data.customer,
    subtotal: data.subtotal,
    discount: data.discount,
    tax: data.tax,
    total: data.total,
    status: data.status || 'DRAFT',
    notes: data.notes || '',
    created_by: data.createdBy || 'Staff',
  }).select('id').single();

  if (qErr) throw qErr;

  const itemInserts = data.items.map(item => ({
    quotation_id: newQ.id,
    product_id: item.productId || null,
    product_name: item.productName,
    sku: item.sku || '',
    quantity: item.quantity,
    unit: item.unit,
    unit_price: item.unitPrice,
    subtotal: item.subtotal,
  }));

  await supabase.from('quotation_items').insert(itemInserts);
  return newQ.id;
}

export async function updateQuotationStatus(id: string, status: QuotationStatus): Promise<void> {
  const { error } = await supabase.from('quotations').update({
    status,
    updated_at: new Date().toISOString(),
  }).eq('id', id);
  if (error) throw error;
}

// --------------------------------------------------------
// INVOICES / BILLING SERVICE
// --------------------------------------------------------
export async function getInvoices(status?: InvoiceStatus): Promise<Invoice[]> {
  try {
    let query = supabase.from('invoices').select('*, invoice_items(*)').order('created_at', { ascending: false });
    if (status) {
      query = query.eq('status', status);
    }
    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map(inv => ({
      id: inv.id,
      invoiceNumber: inv.invoice_number,
      financialYear: inv.financial_year,
      quotationId: inv.quotation_id,
      customerId: inv.customer_id,
      customer: inv.customer_info || { name: '', phone: '' },
      items: (inv.invoice_items || []).map((item: any) => ({
        productId: item.product_id,
        productName: item.product_name,
        sku: item.sku,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: Number(item.unit_price),
        subtotal: Number(item.subtotal),
      })),
      subtotal: Number(inv.subtotal),
      discount: Number(inv.discount),
      tax: Number(inv.tax),
      total: Number(inv.total),
      paidAmount: Number(inv.paid_amount),
      creditAmount: Number(inv.credit_amount),
      advanceAmount: Number(inv.advance_amount) || 0,
      advanceUsed: Number(inv.advance_used) || 0,
      paymentType: inv.payment_type,
      status: inv.status,
      notes: inv.notes || '',
      cancelledBy: inv.cancelled_by,
      cancelledAt: inv.cancelled_at,
      cancellationReason: inv.cancellation_reason,
      createdAt: inv.created_at,
      updatedAt: inv.updated_at,
      createdBy: inv.created_by,
    }));
  } catch (err) {
    console.error('Error fetching invoices:', err);
    return [];
  }
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  try {
    const { data: inv, error } = await supabase.from('invoices').select('*, invoice_items(*)').eq('id', id).single();
    if (error || !inv) return null;
    return {
      id: inv.id,
      invoiceNumber: inv.invoice_number,
      financialYear: inv.financial_year,
      quotationId: inv.quotation_id,
      customerId: inv.customer_id,
      customer: inv.customer_info || { name: '', phone: '' },
      items: (inv.invoice_items || []).map((item: any) => ({
        productId: item.product_id,
        productName: item.product_name,
        sku: item.sku,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: Number(item.unit_price),
        subtotal: Number(item.subtotal),
      })),
      subtotal: Number(inv.subtotal),
      discount: Number(inv.discount),
      tax: Number(inv.tax),
      total: Number(inv.total),
      paidAmount: Number(inv.paid_amount),
      creditAmount: Number(inv.credit_amount),
      advanceAmount: Number(inv.advance_amount) || 0,
      advanceUsed: Number(inv.advance_used) || 0,
      paymentType: inv.payment_type,
      status: inv.status,
      notes: inv.notes || '',
      cancelledBy: inv.cancelled_by,
      cancelledAt: inv.cancelled_at,
      cancellationReason: inv.cancellation_reason,
      createdAt: inv.created_at,
      updatedAt: inv.updated_at,
      createdBy: inv.created_by,
    };
  } catch (err) {
    return null;
  }
}

export async function createInvoice(data: {
  customerId?: string;
  customer: {
    id?: string;
    name: string;
    phone: string;
    email?: string;
    company?: string;
    address?: string;
  };
  quotationId?: string;
  items: Invoice['items'];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paidAmount: number;
  creditAmount: number;
  advanceAmount?: number;
  advanceUsed?: number;
  paymentType: Invoice['paymentType'];
  status?: InvoiceStatus;
  notes?: string;
  confirmImmediately?: boolean;
  createdBy: string;
}): Promise<string> {
  const fyInfo = getNepalFY();
  const seqNum = await getNextSequenceNumber('invoices', fyInfo.fyKey);
  const invoiceNumber = formatDocumentNumber('INV', fyInfo.fyString, seqNum);
  let resolvedCustomerId = data.customerId || null;

  // Walk-in Debtor Auto-Resolution / Registration
  if (!resolvedCustomerId && (data.customer.name || data.customer.phone)) {
    try {
      const cleanPhone = (data.customer.phone || '').trim();
      const cleanName = (data.customer.name || '').trim();

      // Check if matching customer exists by phone
      if (cleanPhone) {
        const { data: existing } = await supabase
          .from('customers')
          .select('id')
          .eq('phone', cleanPhone)
          .limit(1)
          .single();
        if (existing?.id) {
          resolvedCustomerId = existing.id;
        }
      }

      // If still no customer and name/phone provided, create persistent debtor entry
      if (!resolvedCustomerId && (cleanName || cleanPhone)) {
        const newCustId = await createCustomer({
          name: cleanName || 'Walk-in Customer',
          phone: cleanPhone || '0000000000',
          email: data.customer.email || '',
          company: data.customer.company || 'Walk-in Customer',
          address: data.customer.address || '',
          notes: `Walk-in debtor created from Bill #${invoiceNumber}`,
        });
        resolvedCustomerId = newCustId;
      }
    } catch (err) {
      console.warn('Walk-in customer resolution fallback:', err);
    }
  }

  // Always insert as DRAFT initially so confirmInvoice can perform stock & ledger atomic processing
  const initialStatus: InvoiceStatus = 'DRAFT';

  const { data: newInv, error: invErr } = await supabase.from('invoices').insert({
    invoice_number: invoiceNumber,
    financial_year: fyInfo.fyString,
    quotation_id: data.quotationId || null,
    customer_id: resolvedCustomerId,
    customer_info: {
      ...data.customer,
      id: resolvedCustomerId || data.customer.id,
    },
    subtotal: data.subtotal,
    discount: data.discount,
    tax: data.tax,
    total: data.total,
    paid_amount: data.paidAmount,
    credit_amount: data.creditAmount,
    advance_amount: data.advanceAmount || 0,
    advance_used: data.advanceUsed || 0,
    payment_type: data.paymentType,
    status: initialStatus,
    notes: data.notes || '',
    created_by: data.createdBy,
  }).select('id').single();

  if (invErr) throw invErr;

  const itemInserts = data.items.map(item => ({
    invoice_id: newInv.id,
    product_id: item.productId || null,
    product_name: item.productName,
    sku: item.sku || '',
    quantity: item.quantity,
    unit: item.unit,
    unit_price: item.unitPrice,
    subtotal: item.subtotal,
  }));

  await supabase.from('invoice_items').insert(itemInserts);

  if (data.confirmImmediately) {
    await confirmInvoice(newInv.id);
  }

  return newInv.id;
}

export async function confirmInvoice(invoiceId: string, staffName?: string): Promise<void> {
  // Try atomic PostgreSQL RPC procedure first
  const { data: rpcData, error: rpcError } = await supabase.rpc('confirm_invoice', {
    p_invoice_id: invoiceId,
  });

  if (!rpcError && rpcData?.success) {
    return;
  }

  if (rpcError && !rpcError.message.includes('function') && !rpcError.message.includes('not found')) {
    throw new Error(`Failed to confirm invoice: ${rpcError.message}`);
  }

  // Application-level transactional execution fallback
  const invoice = await getInvoiceById(invoiceId);
  if (!invoice) throw new Error('Invoice not found.');
  if (invoice.status !== 'DRAFT') throw new Error('Only draft invoices can be confirmed.');

  // Batch Fetch & Validate Stock Levels up front (no N+1 loops)
  const productMap = new Map<string, Product>();
  for (const item of invoice.items) {
    if (!item.productId) continue;
    const prod = await getProductById(item.productId);
    if (!prod) throw new Error(`Product ${item.productName} not found.`);
    if (item.quantity > prod.stock) {
      throw new Error(`Insufficient stock for ${item.productName}. Available: ${prod.stock}, Billed: ${item.quantity}`);
    }
    productMap.set(item.productId, prod);
  }

  // Deduct Inventory & Create Stock-out Log
  for (const item of invoice.items) {
    if (!item.productId) continue;
    const prod = productMap.get(item.productId);
    if (!prod) continue;
    const newStock = prod.stock - item.quantity;
    await updateProduct(item.productId, { stock: newStock });
    await supabase.from('inventory_transactions').insert({
      product_id: item.productId,
      product_name: item.productName,
      type: 'STOCK_OUT',
      quantity: item.quantity,
      reason: `Confirmed Bill #${invoice.invoiceNumber}`,
      reference_type: 'BILL',
      reference_id: invoice.id,
      created_by: invoice.createdBy,
    });
  }

  // Update Customer Account & Credit Balance if Customer ID exists
  if (invoice.customerId) {
    const cust = await getCustomerById(invoice.customerId);
    if (cust) {
      const newTotalPurchases = (cust.totalPurchases || 0) + invoice.total;
      const newTotalPaid = (cust.totalPaid || 0) + invoice.paidAmount;
      const newOutstanding = (cust.currentOutstanding || 0) + invoice.creditAmount;

      if (cust.creditLimit && cust.creditLimit > 0 && newOutstanding > cust.creditLimit) {
        throw new Error(`Credit limit exceeded for customer ${cust.name}. Current: Rs. ${cust.currentOutstanding}, Limit: Rs. ${cust.creditLimit}`);
      }

      await updateCustomer(invoice.customerId, {
        totalPurchases: newTotalPurchases,
        totalPaid: newTotalPaid,
        currentOutstanding: newOutstanding,
      });

      if (invoice.creditAmount > 0) {
        await supabase.from('customer_ledger').insert({
          customer_id: invoice.customerId,
          type: 'SALE_CREDIT',
          amount: invoice.creditAmount,
          balance: newOutstanding,
          reference_type: 'INVOICE',
          reference_id: invoice.id,
          description: `Credit Purchase — Bill #${invoice.invoiceNumber}`,
          created_by: invoice.createdBy,
        });
      }
    }
  }

  // Set final status
  const finalStatus: InvoiceStatus = invoice.creditAmount > 0 ? 'CREDIT' : 'PAID';
  await supabase.from('invoices').update({
    status: finalStatus,
    updated_at: new Date().toISOString(),
  }).eq('id', invoiceId);
}

export async function cancelInvoice(invoiceId: string, reason: string, staffName: string): Promise<void> {
  // Try atomic PostgreSQL RPC procedure first
  const { data: rpcData, error: rpcError } = await supabase.rpc('cancel_invoice', {
    p_invoice_id: invoiceId,
    p_reason: reason,
    p_staff_name: staffName,
  });

  if (!rpcError && rpcData?.success) {
    return;
  }

  if (rpcError && !rpcError.message.includes('function') && !rpcError.message.includes('not found')) {
    throw new Error(`Failed to cancel invoice: ${rpcError.message}`);
  }

  // Application-level transactional execution fallback
  const invoice = await getInvoiceById(invoiceId);
  if (!invoice) throw new Error('Invoice not found.');
  if (invoice.status === 'CANCELLED') throw new Error('Invoice is already cancelled.');

  if (invoice.status === 'CONFIRMED' || invoice.status === 'CREDIT' || invoice.status === 'PAID') {
    // Restore Stock
    for (const item of invoice.items) {
      if (!item.productId) continue;
      const prod = await getProductById(item.productId);
      if (prod) {
        const restoredStock = prod.stock + item.quantity;
        await updateProduct(item.productId, { stock: restoredStock });
        await supabase.from('inventory_transactions').insert({
          product_id: item.productId,
          product_name: item.productName,
          type: 'STOCK_IN',
          quantity: item.quantity,
          reason: `Restored from Cancelled Bill #${invoice.invoiceNumber}`,
          reference_type: 'CANCELLED_BILL',
          reference_id: invoice.id,
          created_by: staffName,
        });
      }
    }

    // Reverse Customer Totals & Credit Balance
    if (invoice.customerId) {
      const cust = await getCustomerById(invoice.customerId);
      if (cust) {
        const newTotalPurchases = Math.max(0, (cust.totalPurchases || 0) - invoice.total);
        const newTotalPaid = Math.max(0, (cust.totalPaid || 0) - invoice.paidAmount);
        const newOutstanding = Math.max(0, (cust.currentOutstanding || 0) - invoice.creditAmount);

        await updateCustomer(invoice.customerId, {
          totalPurchases: newTotalPurchases,
          totalPaid: newTotalPaid,
          currentOutstanding: newOutstanding,
        });

        if (invoice.creditAmount > 0) {
          await supabase.from('customer_ledger').insert({
            customer_id: invoice.customerId,
            type: 'CANCELLED_SALE',
            amount: -invoice.creditAmount,
            balance: newOutstanding,
            reference_type: 'INVOICE',
            reference_id: invoice.id,
            description: `Credit Reversal — Cancelled Bill #${invoice.invoiceNumber}`,
            created_by: staffName,
          });
        }
      }
    }
  }

  await supabase.from('invoices').update({
    status: 'CANCELLED',
    cancelled_by: staffName,
    cancelled_at: new Date().toISOString(),
    cancellation_reason: reason,
    updated_at: new Date().toISOString(),
  }).eq('id', invoiceId);
}

// --------------------------------------------------------
// PAYMENTS SERVICE
// --------------------------------------------------------
export async function getPayments(method?: PaymentMethod, category?: string): Promise<Payment[]> {
  try {
    let query = supabase.from('payments').select('*').order('created_at', { ascending: false });
    if (method) {
      query = query.eq('payment_method', method);
    }
    if (category) {
      query = query.eq('payment_category', category);
    }
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(p => ({
      id: p.id,
      receiptNumber: p.receipt_number,
      financialYear: p.financial_year,
      invoiceId: p.invoice_id,
      customerId: p.customer_id,
      customerName: p.customer_name,
      customerPhone: p.customer_phone,
      amount: Number(p.amount),
      paymentMethod: p.payment_method,
      paymentCategory: (p.payment_category as any) || 'SALE_PAYMENT',
      previousOutstanding: Number(p.previous_outstanding),
      remainingOutstanding: Number(p.remaining_outstanding),
      note: p.note || '',
      createdAt: p.created_at,
      createdBy: p.created_by,
    }));
  } catch (err) {
    console.error('Error fetching payments:', err);
    return [];
  }
}

export async function getPaymentById(id: string): Promise<Payment | null> {
  try {
    const { data: p, error } = await supabase.from('payments').select('*').eq('id', id).single();
    if (error || !p) return null;
    return {
      id: p.id,
      receiptNumber: p.receipt_number,
      financialYear: p.financial_year,
      invoiceId: p.invoice_id,
      customerId: p.customer_id,
      customerName: p.customer_name,
      customerPhone: p.customer_phone,
      amount: Number(p.amount),
      paymentMethod: p.payment_method,
      paymentCategory: (p.payment_category as any) || 'SALE_PAYMENT',
      previousOutstanding: Number(p.previous_outstanding),
      remainingOutstanding: Number(p.remaining_outstanding),
      note: p.note || '',
      createdAt: p.created_at,
      createdBy: p.created_by,
    };
  } catch (err) {
    return null;
  }
}

export async function recordPayment(data: {
  customerId: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  paymentMethod: PaymentMethod;
  note?: string;
  createdBy: string;
  invoiceId?: string;
}): Promise<string> {
  // Try atomic PostgreSQL RPC first
  const { data: rpcData, error: rpcError } = await supabase.rpc('receive_credit_payment', {
    p_customer_id: data.customerId,
    p_amount: data.amount,
    p_payment_method: data.paymentMethod,
    p_note: data.note || '',
    p_staff_name: data.createdBy,
    p_invoice_id: data.invoiceId || null,
  });

  if (!rpcError && rpcData?.payment_id) {
    return rpcData.payment_id;
  }

  if (rpcError && !rpcError.message.includes('function') && !rpcError.message.includes('not found')) {
    throw new Error(`Failed to record payment: ${rpcError.message}`);
  }

  // Application-level transactional execution fallback
  const cust = await getCustomerById(data.customerId);
  if (!cust) throw new Error('Customer not found.');

  const prevOutstanding = cust.currentOutstanding || 0;
  if (data.amount <= 0) {
    throw new Error('Payment amount must be greater than zero.');
  }
  if (data.amount > prevOutstanding) {
    throw new Error(`Payment amount (Rs. ${data.amount}) cannot exceed customer outstanding balance (Rs. ${prevOutstanding}).`);
  }

  const remainingOutstanding = prevOutstanding - data.amount;
  const fyInfo = getNepalFY();
  const seqNum = await getNextSequenceNumber('payments', fyInfo.fyKey);
  const receiptNumber = formatDocumentNumber('REC', fyInfo.fyString, seqNum);

  const { data: newP, error: pErr } = await supabase.from('payments').insert({
    receipt_number: receiptNumber,
    financial_year: fyInfo.fyString,
    invoice_id: data.invoiceId || null,
    customer_id: data.customerId,
    customer_name: data.customerName,
    customer_phone: data.customerPhone,
    amount: data.amount,
    payment_method: data.paymentMethod,
    previous_outstanding: prevOutstanding,
    remaining_outstanding: remainingOutstanding,
    note: data.note || '',
    created_by: data.createdBy,
  }).select('id').single();

  if (pErr) throw pErr;

  // Update Customer Outstanding & Total Paid
  const newTotalPaid = (cust.totalPaid || 0) + data.amount;
  await updateCustomer(data.customerId, {
    totalPaid: newTotalPaid,
    currentOutstanding: remainingOutstanding,
  });

  // Record Ledger Entry
  await supabase.from('customer_ledger').insert({
    customer_id: data.customerId,
    type: 'PAYMENT',
    amount: -data.amount,
    balance: remainingOutstanding,
    reference_type: 'PAYMENT',
    reference_id: newP.id,
    description: `Payment Received (${data.paymentMethod}) — Receipt #${receiptNumber}`,
    created_by: data.createdBy,
  });

  return newP.id;
}

// --------------------------------------------------------
// CUSTOMER LEDGER SERVICE
// --------------------------------------------------------
export async function getCustomerLedger(customerId: string): Promise<CustomerLedgerEntry[]> {
  try {
    const { data, error } = await supabase.from('customer_ledger').select('*').eq('customer_id', customerId).order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(l => ({
      id: l.id,
      customerId: l.customer_id,
      type: l.type,
      amount: Number(l.amount),
      balance: Number(l.balance),
      referenceType: l.reference_type,
      referenceId: l.reference_id,
      description: l.description,
      createdAt: l.created_at,
      createdBy: l.created_by,
    }));
  } catch (err) {
    console.error('Error fetching customer ledger:', err);
    return [];
  }
}

// --------------------------------------------------------
// QUOTATION TO BILL CONVERSION
// --------------------------------------------------------
export async function convertQuotationToInvoice(quotationId: string): Promise<string> {
  const quotation = await getQuotationById(quotationId);
  if (!quotation) throw new Error('Quotation not found.');
  if (quotation.invoiceId) return quotation.invoiceId;

  const newInvoiceId = await createInvoice({
    customerId: quotation.customerId,
    customer: quotation.customer,
    quotationId: quotation.id,
    items: quotation.items,
    subtotal: quotation.subtotal,
    discount: quotation.discount,
    tax: quotation.tax,
    total: quotation.total,
    paidAmount: 0,
    creditAmount: quotation.total,
    paymentType: 'CREDIT',
    status: 'DRAFT',
    notes: `Converted from Quotation #${quotation.quotationNumber}`,
    confirmImmediately: false,
    createdBy: quotation.createdBy,
  });

  await supabase.from('quotations').update({
    invoice_id: newInvoiceId,
    status: 'ACCEPTED',
    updated_at: new Date().toISOString(),
  }).eq('id', quotationId);

  return newInvoiceId;
}

// --------------------------------------------------------
// FINANCIAL & SALES ANALYTICS REPORTING
// --------------------------------------------------------
export async function getFinancialReports(fyKey?: string) {
  const currentFY = getNepalFY();
  const selectedKey = fyKey || currentFY.fyKey;
  const fyString = selectedKey.replace('-', '/');

  const [invData, payData, custData, prodData, qData, txnData] = await Promise.all([
    supabase.from('invoices').select('*').eq('financial_year', fyString),
    supabase.from('payments').select('*').eq('financial_year', fyString),
    supabase.from('customers').select('*'),
    supabase.from('products').select('*'),
    supabase.from('quotations').select('*').eq('financial_year', fyString),
    supabase.from('inventory_transactions').select('*').order('created_at', { ascending: false }).limit(20),
  ]);

  const invoices = invData.data || [];
  const payments = payData.data || [];
  const customers = custData.data || [];
  const products = prodData.data || [];
  const quotations = qData.data || [];

  const confirmedBills = invoices.filter(i => i.status !== 'CANCELLED' && i.status !== 'DRAFT');
  const totalSales = confirmedBills.reduce((acc, i) => acc + Number(i.total), 0);
  const totalCollected = payments.reduce((acc, p) => acc + Number(p.amount), 0);
  const creditSales = confirmedBills.reduce((acc, i) => acc + Number(i.credit_amount), 0);
  const totalOutstanding = customers.reduce((acc, c) => acc + Number(c.current_outstanding), 0);

  return {
    fyKey: selectedKey,
    fyString,
    totalSales,
    totalCollected,
    creditSales,
    totalOutstanding,
    confirmedBillsCount: confirmedBills.length,
    draftBillsCount: invoices.filter(i => i.status === 'DRAFT').length,
    invoices: invoices.map(i => ({
      id: i.id,
      invoiceNumber: i.invoice_number,
      total: Number(i.total),
      paidAmount: Number(i.paid_amount),
      creditAmount: Number(i.credit_amount),
      status: i.status,
      customer: i.customer_info,
    })),
    payments: payments.map(p => ({
      id: p.id,
      receiptNumber: p.receipt_number,
      customerName: p.customer_name,
      paymentMethod: p.payment_method,
      amount: Number(p.amount),
      remainingOutstanding: Number(p.remaining_outstanding),
    })),
    recentTransactions: (txnData.data || []).map((tx: any) => ({
      id: tx.id,
      createdAt: tx.created_at,
      productName: tx.product_name,
      type: tx.type,
      quantity: tx.quantity,
      reason: tx.reason,
    })),
    quotationTotal: quotations.length,
    quotationAccepted: quotations.filter(q => q.status === 'ACCEPTED').length,
  };
}

// --------------------------------------------------------
// BUSINESS SETTINGS SERVICE
// --------------------------------------------------------
export async function getBusinessSettings(): Promise<BusinessSettings> {
  try {
    const { data, error } = await supabase.from('business_settings').select('*').eq('id', 'default').single();
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
    return DEFAULT_SETTINGS;
  }
}

export async function updateBusinessSettings(data: Partial<BusinessSettings>): Promise<void> {
  const { error } = await supabase.from('business_settings').upsert({
    id: 'default',
    business_name: data.businessName,
    logo_url: data.logoUrl,
    phone: data.phone,
    email: data.email,
    address: data.address,
    website: data.website,
    opening_hours: data.openingHours,
    whatsapp: data.whatsapp,
    facebook: data.facebook,
    instagram: data.instagram,
    tax_id: data.taxId,
    quotation_prefix: data.quotationPrefix,
    invoice_prefix: data.invoicePrefix,
    receipt_prefix: data.receiptPrefix,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}
