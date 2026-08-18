import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  runTransaction,
  writeBatch
} from 'firebase/firestore';
import { db, productsCol, categoriesCol, inventoryTransactionsCol, customersCol, leadsCol, quotationsCol, settingsCol } from '@/lib/firebase/client';
import {
  Product,
  Category,
  InventoryTransaction,
  Customer,
  Lead,
  Quotation,
  BusinessSettings,
  LeadStatus,
  QuotationStatus,
  InventoryTransactionType
} from '@/types';

// Default Settings Fallback for Anand Hardware
export const DEFAULT_SETTINGS: BusinessSettings = {
  businessName: 'Anand Hardware',
  logoUrl: '',
  phone: '+977 21-523456',
  email: 'info@anandhardware.com',
  address: 'Main Road, Ward No. 7, Biratnagar, Morang, Nepal',
  website: 'https://anandhardware.com',
  openingHours: 'Sun - Fri: 8:00 AM - 7:00 PM (Saturday Closed)',
  whatsapp: '+977 9801234567',
  facebook: 'https://facebook.com/anandhardware',
  instagram: 'https://instagram.com/anandhardware',
  taxId: 'PAN: 302948576 / VAT Registered',
  quotationPrefix: 'AH-QT-',
};

// BUSINESS SETTINGS
export async function getBusinessSettings(): Promise<BusinessSettings> {
  try {
    const docRef = doc(db, 'settings', 'business');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { ...DEFAULT_SETTINGS, ...docSnap.data() } as BusinessSettings;
    }
  } catch (err) {
    console.error('Error reading business settings:', err);
  }
  return DEFAULT_SETTINGS;
}

export async function updateBusinessSettings(settings: Partial<BusinessSettings>): Promise<void> {
  const docRef = doc(db, 'settings', 'business');
  await setDoc(docRef, { ...settings, updatedAt: new Date().toISOString() }, { merge: true });
}

// CATEGORIES
export async function getCategories(onlyActive = false): Promise<Category[]> {
  try {
    let q = query(categoriesCol, orderBy('name', 'asc'));
    if (onlyActive) {
      q = query(categoriesCol, where('active', '==', true), orderBy('name', 'asc'));
    }
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Category));
  } catch (err) {
    console.error('Error fetching categories:', err);
    return [];
  }
}

export async function createCategory(data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const now = new Date().toISOString();
  const docRef = await addDoc(categoriesCol, {
    ...data,
    slug: data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function updateCategory(id: string, data: Partial<Category>): Promise<void> {
  const docRef = doc(db, 'categories', id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteCategory(id: string): Promise<{ success: boolean; message?: string }> {
  // Check if any product references this category
  const q = query(productsCol, where('categoryId', '==', id), limit(1));
  const snap = await getDocs(q);
  if (!snap.empty) {
    return {
      success: false,
      message: 'Cannot delete category because it has linked products. Please reassign or delete products first.',
    };
  }
  await deleteDoc(doc(db, 'categories', id));
  return { success: true };
}

// PRODUCTS
export async function getProducts(options?: {
  onlyActive?: boolean;
  categoryId?: string;
  featuredOnly?: boolean;
  searchQuery?: string;
  limitCount?: number;
}): Promise<Product[]> {
  try {
    let q = query(productsCol, orderBy('createdAt', 'desc'));

    if (options?.limitCount) {
      q = query(productsCol, orderBy('createdAt', 'desc'), limit(options.limitCount));
    }

    const snap = await getDocs(q);
    let products = snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));

    if (options?.onlyActive) {
      products = products.filter(p => p.active !== false);
    }
    if (options?.categoryId && options.categoryId !== 'all') {
      products = products.filter(p => p.categoryId === options.categoryId);
    }
    if (options?.featuredOnly) {
      products = products.filter(p => p.featured === true);
    }
    if (options?.searchQuery && options.searchQuery.trim()) {
      const sq = options.searchQuery.toLowerCase().trim();
      products = products.filter(p =>
        p.name.toLowerCase().includes(sq) ||
        p.sku.toLowerCase().includes(sq) ||
        p.brand.toLowerCase().includes(sq) ||
        p.categoryName.toLowerCase().includes(sq) ||
        p.description.toLowerCase().includes(sq)
      );
    }

    return products;
  } catch (err) {
    console.error('Error getting products:', err);
    return [];
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const q = query(productsCol, where('slug', '==', slug), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const d = snap.docs[0];
      return { id: d.id, ...d.data() } as Product;
    }
    // Fallback: try by ID if slug match fails
    const docRef = doc(db, 'products', slug);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Product;
    }
  } catch (err) {
    console.error('Error fetching product by slug:', err);
  }
  return null;
}

export async function createProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const now = new Date().toISOString();
  const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const docRef = await addDoc(productsCol, {
    ...data,
    slug,
    stock: Number(data.stock) || 0,
    lowStockLevel: Number(data.lowStockLevel) || 5,
    price: Number(data.price) || 0,
    featured: Boolean(data.featured),
    active: data.active !== false,
    createdAt: now,
    updatedAt: now,
  });

  // If initial stock > 0, record initial stock transaction
  if (data.stock > 0) {
    await addDoc(inventoryTransactionsCol, {
      productId: docRef.id,
      productName: data.name,
      type: 'STOCK_IN',
      quantity: data.stock,
      reason: 'Initial Product Setup Stock',
      note: 'Automatic entry during product creation',
      createdAt: now,
      createdBy: 'Admin System',
    });
  }

  return docRef.id;
}

export async function updateProduct(id: string, data: Partial<Product>): Promise<void> {
  const docRef = doc(db, 'products', id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteProduct(id: string): Promise<void> {
  await deleteDoc(doc(db, 'products', id));
}

// INVENTORY TRANSACTIONS
export async function addInventoryTransaction(data: {
  productId: string;
  productName: string;
  type: InventoryTransactionType;
  quantity: number;
  reason: string;
  note?: string;
  createdBy: string;
}): Promise<{ success: boolean; message?: string }> {
  try {
    const productRef = doc(db, 'products', data.productId);

    return await runTransaction(db, async (transaction) => {
      const productDoc = await transaction.get(productRef);
      if (!productDoc.exists()) {
        throw new Error('Product not found.');
      }

      const product = productDoc.data() as Product;
      let newStock = product.stock || 0;
      const qty = Number(data.quantity);

      if (data.type === 'STOCK_IN' || data.type === 'RETURN') {
        newStock += qty;
      } else if (data.type === 'STOCK_OUT' || data.type === 'DAMAGE') {
        if (qty > newStock) {
          throw new Error(`Insufficient stock. Current stock is ${newStock}, requested release is ${qty}.`);
        }
        newStock -= qty;
      } else if (data.type === 'ADJUSTMENT') {
        // Direct stock level override or adjustment delta
        newStock = qty;
      }

      if (newStock < 0) {
        throw new Error('Stock quantity cannot drop below 0.');
      }

      const now = new Date().toISOString();
      const txnRef = doc(inventoryTransactionsCol);

      transaction.set(txnRef, {
        productId: data.productId,
        productName: data.productName || product.name,
        type: data.type,
        quantity: qty,
        reason: data.reason,
        note: data.note || '',
        createdAt: now,
        createdBy: data.createdBy,
      });

      transaction.update(productRef, {
        stock: newStock,
        updatedAt: now,
      });

      return { success: true };
    });
  } catch (err: any) {
    console.error('Inventory transaction failed:', err);
    return { success: false, message: err.message || 'Failed to complete stock transaction.' };
  }
}

export async function getInventoryTransactions(productId?: string): Promise<InventoryTransaction[]> {
  try {
    let q = query(inventoryTransactionsCol, orderBy('createdAt', 'desc'), limit(100));
    if (productId) {
      q = query(inventoryTransactionsCol, where('productId', '==', productId), orderBy('createdAt', 'desc'), limit(100));
    }
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as InventoryTransaction));
  } catch (err) {
    console.error('Error fetching inventory transactions:', err);
    return [];
  }
}

// CUSTOMERS
export async function getCustomers(): Promise<Customer[]> {
  try {
    const q = query(customersCol, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Customer));
  } catch (err) {
    console.error('Error fetching customers:', err);
    return [];
  }
}

export async function createCustomer(data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const now = new Date().toISOString();
  const docRef = await addDoc(customersCol, {
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function updateCustomer(id: string, data: Partial<Customer>): Promise<void> {
  const docRef = doc(db, 'customers', id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteCustomer(id: string): Promise<void> {
  await deleteDoc(doc(db, 'customers', id));
}

// LEADS
export async function createLeadInquiry(data: Omit<Lead, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const now = new Date().toISOString();
  const docRef = await addDoc(leadsCol, {
    ...data,
    status: 'NEW' as LeadStatus,
    createdAt: now,
    updatedAt: now,
  });

  // Auto-link or auto-create Customer record if phone exists
  try {
    const q = query(customersCol, where('phone', '==', data.phone), limit(1));
    const snap = await getDocs(q);
    let customerId = '';
    if (!snap.empty) {
      customerId = snap.docs[0].id;
    } else {
      const newCustRef = await addDoc(customersCol, {
        name: data.customerName,
        phone: data.phone,
        email: data.email || '',
        company: data.company || '',
        createdAt: now,
        updatedAt: now,
      });
      customerId = newCustRef.id;
    }
    await updateDoc(docRef, { customerId });
  } catch (err) {
    console.error('Auto customer linking error (non-fatal):', err);
  }

  return docRef.id;
}

export async function getLeads(statusFilter?: LeadStatus): Promise<Lead[]> {
  try {
    let q = query(leadsCol, orderBy('createdAt', 'desc'));
    if (statusFilter) {
      q = query(leadsCol, where('status', '==', statusFilter), orderBy('createdAt', 'desc'));
    }
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Lead));
  } catch (err) {
    console.error('Error fetching leads:', err);
    return [];
  }
}

export async function updateLeadStatus(id: string, status: LeadStatus): Promise<void> {
  const docRef = doc(db, 'leads', id);
  await updateDoc(docRef, {
    status,
    updatedAt: new Date().toISOString(),
  });
}

// QUOTATIONS
export async function generateQuotationNumber(): Promise<string> {
  const settings = await getBusinessSettings();
  const prefix = settings.quotationPrefix || 'AH-QT-';
  const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${yearMonth}-${randomDigits}`;
}

export async function createQuotation(data: Omit<Quotation, 'id' | 'quotationNumber' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const now = new Date().toISOString();
  const quotationNumber = await generateQuotationNumber();

  // Recalculate totals on backend to prevent client tampering
  let calculatedSubtotal = 0;
  const safeItems = data.items.map(item => {
    const sub = Number(item.quantity) * Number(item.unitPrice);
    calculatedSubtotal += sub;
    return {
      ...item,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      subtotal: sub,
    };
  });

  const discount = Number(data.discount) || 0;
  const taxPercent = Number(data.tax) || 0;
  const taxableAmount = Math.max(0, calculatedSubtotal - discount);
  const taxAmount = (taxableAmount * taxPercent) / 100;
  const calculatedTotal = taxableAmount + taxAmount;

  const docRef = await addDoc(quotationsCol, {
    ...data,
    quotationNumber,
    items: safeItems,
    subtotal: calculatedSubtotal,
    discount,
    tax: taxPercent,
    total: calculatedTotal,
    status: data.status || 'DRAFT',
    createdAt: now,
    updatedAt: now,
  });

  return docRef.id;
}

export async function getQuotations(): Promise<Quotation[]> {
  try {
    const q = query(quotationsCol, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Quotation));
  } catch (err) {
    console.error('Error fetching quotations:', err);
    return [];
  }
}

export async function getQuotationById(id: string): Promise<Quotation | null> {
  try {
    const docRef = doc(db, 'quotations', id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as Quotation;
    }
  } catch (err) {
    console.error('Error fetching quotation by ID:', err);
  }
  return null;
}

export async function updateQuotationStatus(id: string, status: QuotationStatus): Promise<void> {
  const docRef = doc(db, 'quotations', id);
  await updateDoc(docRef, {
    status,
    updatedAt: new Date().toISOString(),
  });
}
