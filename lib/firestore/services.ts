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
import {
  db,
  productsCol,
  categoriesCol,
  inventoryTransactionsCol,
  customersCol,
  leadsCol,
  quotationsCol,
  invoicesCol,
  paymentsCol,
  customerLedgerCol,
  sequencesCol,
  settingsCol
} from '@/lib/firebase/client';
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
  PaymentType,
  PaymentMethod,
  InventoryTransactionType
} from '@/types';
import { getNepalFY, formatDocumentNumber } from '@/lib/utils/nepalFY';

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
  quotationPrefix: 'QT-',
  invoicePrefix: 'INV-',
  receiptPrefix: 'REC-',
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

// ATOMIC SEQUENCE GENERATOR (per Nepal FY)
export async function getNextSequenceNumber(
  seqType: 'quotations' | 'invoices' | 'receipts',
  fyKey: string,
  externalTransaction?: any
): Promise<number> {
  const seqDocId = `${seqType}_${fyKey}`;
  const seqRef = doc(db, 'sequences', seqDocId);

  if (externalTransaction) {
    const seqSnap = await externalTransaction.get(seqRef);
    let nextNum = 1;
    if (seqSnap.exists()) {
      nextNum = (seqSnap.data().lastNumber || 0) + 1;
    }
    externalTransaction.set(seqRef, { lastNumber: nextNum, updatedAt: new Date().toISOString() }, { merge: true });
    return nextNum;
  }

  return await runTransaction(db, async (trans) => {
    const seqSnap = await trans.get(seqRef);
    let nextNum = 1;
    if (seqSnap.exists()) {
      nextNum = (seqSnap.data().lastNumber || 0) + 1;
    }
    trans.set(seqRef, { lastNumber: nextNum, updatedAt: new Date().toISOString() }, { merge: true });
    return nextNum;
  });
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
  try {
    // Prevent deletion if products exist in category
    const q = query(productsCol, where('categoryId', '==', id), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return { success: false, message: 'Cannot delete category: products are assigned to it.' };
    }
    await deleteDoc(doc(db, 'categories', id));
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to delete category.' };
  }
}

// PRODUCTS
export async function getProducts(options?: { categoryId?: string; onlyActive?: boolean; featured?: boolean; limitCount?: number }): Promise<Product[]> {
  try {
    let q = query(productsCol, orderBy('name', 'asc'));
    if (options?.onlyActive) {
      q = query(productsCol, where('active', '==', true), orderBy('name', 'asc'));
    }
    const snap = await getDocs(q);
    let list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));

    if (options?.categoryId && options.categoryId !== 'all') {
      list = list.filter(p => p.categoryId === options.categoryId);
    }
    if (options?.featured) {
      list = list.filter(p => p.featured);
    }
    if (options?.limitCount && options.limitCount > 0) {
      list = list.slice(0, options.limitCount);
    }
    return list;
  } catch (err) {
    console.error('Error fetching products:', err);
    return [];
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const q = query(productsCol, where('slug', '==', slug), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const docSnap = snap.docs[0];
    return { id: docSnap.id, ...docSnap.data() } as Product;
  } catch (err) {
    console.error('Error fetching product by slug:', err);
    return null;
  }
}

export async function createProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const now = new Date().toISOString();
  const docRef = await addDoc(productsCol, {
    ...data,
    slug: data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
    createdAt: now,
    updatedAt: now,
  });
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

export async function addInventoryTransaction(
  data: Omit<InventoryTransaction, 'id' | 'createdAt'>
): Promise<{ success: boolean; message?: string }> {
  try {
    await runTransaction(db, async (trans) => {
      const prodRef = doc(db, 'products', data.productId);
      const prodSnap = await trans.get(prodRef);
      if (!prodSnap.exists()) {
        throw new Error(`Product ID ${data.productId} not found.`);
      }

      const currentStock = prodSnap.data().stock || 0;
      let newStock = currentStock;

      if (data.type === 'STOCK_IN' || data.type === 'RETURN') {
        newStock += data.quantity;
      } else if (data.type === 'STOCK_OUT' || data.type === 'DAMAGE') {
        if (data.quantity > currentStock) {
          throw new Error(`Insufficient stock for ${data.productName}. Available: ${currentStock}, Requested: ${data.quantity}`);
        }
        newStock -= data.quantity;
      } else if (data.type === 'ADJUSTMENT') {
        newStock = data.quantity;
      }

      trans.update(prodRef, { stock: newStock, updatedAt: new Date().toISOString() });

      const newTxRef = doc(inventoryTransactionsCol);
      trans.set(newTxRef, {
        ...data,
        createdAt: new Date().toISOString(),
      });
    });
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to record stock transaction.' };
  }
}

// CUSTOMERS
export async function getCustomers(): Promise<Customer[]> {
  try {
    const q = query(customersCol, orderBy('name', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({
      id: d.id,
      totalPurchases: 0,
      totalPaid: 0,
      currentOutstanding: 0,
      creditLimit: 0,
      ...d.data()
    } as Customer));
  } catch (err) {
    console.error('Error fetching customers:', err);
    return [];
  }
}

export async function createCustomer(data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const now = new Date().toISOString();
  const docRef = await addDoc(customersCol, {
    ...data,
    totalPurchases: data.totalPurchases || 0,
    totalPaid: data.totalPaid || 0,
    currentOutstanding: data.currentOutstanding || 0,
    creditLimit: data.creditLimit || 0,
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

// LEADS / INQUIRIES ALIAS
export const createLeadInquiry = createLead;

// LEADS / INQUIRIES
export async function getLeads(status?: LeadStatus): Promise<Lead[]> {
  try {
    let q = query(leadsCol, orderBy('createdAt', 'desc'));
    if (status) {
      q = query(leadsCol, where('status', '==', status), orderBy('createdAt', 'desc'));
    }
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Lead));
  } catch (err) {
    console.error('Error fetching leads:', err);
    return [];
  }
}

export async function createLead(data: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<string> {
  const now = new Date().toISOString();
  // Check if customer already exists by phone
  let customerId = data.customerId;
  if (!customerId && data.phone) {
    try {
      const q = query(customersCol, where('phone', '==', data.phone), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        customerId = snap.docs[0].id;
      } else {
        // Auto create customer record
        customerId = await createCustomer({
          name: data.customerName,
          phone: data.phone,
          email: data.email || '',
          company: data.company || '',
        });
      }
    } catch (err) {
      console.warn('Auto customer link warning:', err);
    }
  }

  const docRef = await addDoc(leadsCol, {
    ...data,
    customerId: customerId || '',
    status: 'NEW',
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function updateLeadStatus(id: string, status: LeadStatus): Promise<void> {
  const docRef = doc(db, 'leads', id);
  await updateDoc(docRef, {
    status,
    updatedAt: new Date().toISOString(),
  });
}

// QUOTATIONS
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
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Quotation;
  } catch (err) {
    console.error('Error fetching quotation by ID:', err);
    return null;
  }
}

export async function createQuotation(data: Omit<Quotation, 'id' | 'quotationNumber' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const fyInfo = getNepalFY();
  const settings = await getBusinessSettings();
  const prefix = settings.quotationPrefix || 'QT-';

  return await runTransaction(db, async (trans) => {
    const nextSeq = await getNextSequenceNumber('quotations', fyInfo.fyKey, trans);
    const quotationNumber = formatDocumentNumber(prefix.replace(/-$/, ''), fyInfo.fyString, nextSeq);

    const now = new Date().toISOString();
    const newDocRef = doc(quotationsCol);

    trans.set(newDocRef, {
      ...data,
      quotationNumber,
      createdAt: now,
      updatedAt: now,
    });

    return newDocRef.id;
  });
}

export async function updateQuotationStatus(id: string, status: QuotationStatus): Promise<void> {
  const docRef = doc(db, 'quotations', id);
  await updateDoc(docRef, {
    status,
    updatedAt: new Date().toISOString(),
  });
}

// INVOICES / BILLS
export async function getInvoices(options?: { status?: InvoiceStatus; customerId?: string }): Promise<Invoice[]> {
  try {
    let q = query(invoicesCol, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    let list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Invoice));
    if (options?.status) {
      list = list.filter(i => i.status === options.status);
    }
    if (options?.customerId) {
      list = list.filter(i => i.customerId === options.customerId || i.customer.id === options.customerId);
    }
    return list;
  } catch (err) {
    console.error('Error fetching invoices:', err);
    return [];
  }
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  try {
    const docRef = doc(db, 'invoices', id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Invoice;
  } catch (err) {
    console.error('Error fetching invoice by ID:', err);
    return null;
  }
}

export async function createInvoice(
  data: Omit<Invoice, 'id' | 'invoiceNumber' | 'financialYear' | 'createdAt' | 'updatedAt'> & { confirmImmediately?: boolean }
): Promise<string> {
  const fyInfo = getNepalFY();
  const settings = await getBusinessSettings();
  const prefix = settings.invoicePrefix || 'INV-';

  const confirmNow = data.confirmImmediately || data.status === 'CONFIRMED' || data.status === 'PAID' || data.status === 'CREDIT' || data.status === 'PARTIALLY_PAID';

  let newInvoiceId = '';

  await runTransaction(db, async (trans) => {
    const nextSeq = await getNextSequenceNumber('invoices', fyInfo.fyKey, trans);
    const invoiceNumber = formatDocumentNumber(prefix.replace(/-$/, ''), fyInfo.fyString, nextSeq);

    const now = new Date().toISOString();
    const newDocRef = doc(invoicesCol);
    newInvoiceId = newDocRef.id;

    // Recalculate Subtotal & Totals Server-side for security
    const subtotal = data.items.reduce((acc, curr) => acc + (curr.quantity * curr.unitPrice), 0);
    const safeDiscount = Math.max(0, data.discount || 0);
    const taxableAmount = Math.max(0, subtotal - safeDiscount);
    const safeTax = Math.max(0, data.tax || 0);
    const grandTotal = taxableAmount + ((taxableAmount * safeTax) / 100);

    const paidAmount = Math.max(0, data.paidAmount || 0);
    const creditAmount = Math.max(0, grandTotal - paidAmount);

    let initialStatus: InvoiceStatus = confirmNow ? (creditAmount > 0 ? (paidAmount > 0 ? 'PARTIALLY_PAID' : 'CREDIT') : 'PAID') : 'DRAFT';

    // If confirmNow is set, perform stock validation and release inside the same transaction
    if (confirmNow) {
      for (const item of data.items) {
        if (item.productId && item.productId !== 'custom') {
          const prodRef = doc(db, 'products', item.productId);
          const prodSnap = await trans.get(prodRef);
          if (!prodSnap.exists()) {
            throw new Error(`Product ${item.productName} not found.`);
          }
          const availableStock = prodSnap.data().stock || 0;
          if (item.quantity > availableStock) {
            throw new Error(`Insufficient stock for ${item.productName}. Available: ${availableStock}, Billed: ${item.quantity}`);
          }
          // Reduce Stock
          trans.update(prodRef, {
            stock: availableStock - item.quantity,
            updatedAt: now,
          });

          // Log Stock Out Transaction
          const txRef = doc(inventoryTransactionsCol);
          trans.set(txRef, {
            productId: item.productId,
            productName: item.productName,
            type: 'STOCK_OUT',
            quantity: item.quantity,
            reason: `Invoice Billed: ${invoiceNumber}`,
            referenceType: 'BILL',
            referenceId: newInvoiceId,
            createdAt: now,
            createdBy: data.createdBy || 'Staff',
          });
        }
      }

      // Update / Link Customer Outstanding & Purchases
      let custId = data.customerId;
      if (!custId && data.customer.phone) {
        const qCust = query(customersCol, where('phone', '==', data.customer.phone), limit(1));
        const custSnap = await getDocs(qCust);
        if (!custSnap.empty) {
          custId = custSnap.docs[0].id;
        }
      }

      if (custId) {
        const custRef = doc(db, 'customers', custId);
        const custSnap = await trans.get(custRef);
        if (custSnap.exists()) {
          const cData = custSnap.data();
          const currPurchases = cData.totalPurchases || 0;
          const currPaid = cData.totalPaid || 0;
          const currOutstanding = cData.currentOutstanding || 0;
          const creditLimit = cData.creditLimit || 0;

          const newOutstanding = currOutstanding + creditAmount;
          if (creditLimit > 0 && newOutstanding > creditLimit) {
            throw new Error(`Credit limit exceeded for ${data.customer.name}. Limit: NPR ${creditLimit.toLocaleString()}, Current: NPR ${currOutstanding.toLocaleString()}, Requested Credit: NPR ${creditAmount.toLocaleString()}`);
          }

          trans.update(custRef, {
            totalPurchases: currPurchases + grandTotal,
            totalPaid: currPaid + paidAmount,
            currentOutstanding: newOutstanding,
            updatedAt: now,
          });

          // Ledger Entry
          const ledgerRef = doc(customerLedgerCol);
          trans.set(ledgerRef, {
            customerId: custId,
            type: 'SALE_CREDIT',
            amount: grandTotal,
            balance: newOutstanding,
            referenceType: 'INVOICE',
            referenceId: newInvoiceId,
            description: `Invoice #${invoiceNumber} (Paid: Rs. ${paidAmount.toLocaleString()}, Credit: Rs. ${creditAmount.toLocaleString()})`,
            createdAt: now,
            createdBy: data.createdBy || 'Staff',
          });
        }
      }
    }

    trans.set(newDocRef, {
      ...data,
      invoiceNumber,
      financialYear: fyInfo.fyString,
      subtotal,
      discount: safeDiscount,
      tax: safeTax,
      total: grandTotal,
      paidAmount,
      creditAmount,
      status: initialStatus,
      createdAt: now,
      updatedAt: now,
    });
  });

  return newInvoiceId;
}

export async function confirmInvoice(invoiceId: string, staffName = 'Admin Staff'): Promise<void> {
  const now = new Date().toISOString();

  await runTransaction(db, async (trans) => {
    const invRef = doc(db, 'invoices', invoiceId);
    const invSnap = await trans.get(invRef);
    if (!invSnap.exists()) throw new Error('Invoice not found.');

    const inv = invSnap.data() as Invoice;
    if (inv.status !== 'DRAFT') {
      throw new Error(`Invoice #${inv.invoiceNumber} is already confirmed or cancelled.`);
    }

    // 1. Check & Update Product Stocks
    for (const item of inv.items) {
      if (item.productId && item.productId !== 'custom') {
        const prodRef = doc(db, 'products', item.productId);
        const prodSnap = await trans.get(prodRef);
        if (!prodSnap.exists()) {
          throw new Error(`Product ${item.productName} not found.`);
        }
        const availStock = prodSnap.data().stock || 0;
        if (item.quantity > availStock) {
          throw new Error(`Insufficient stock for ${item.productName}. Available: ${availStock}, Required: ${item.quantity}`);
        }
        trans.update(prodRef, {
          stock: availStock - item.quantity,
          updatedAt: now,
        });

        // Log Stock Out Transaction
        const txRef = doc(inventoryTransactionsCol);
        trans.set(txRef, {
          productId: item.productId,
          productName: item.productName,
          type: 'STOCK_OUT',
          quantity: item.quantity,
          reason: `Bill Confirmed: ${inv.invoiceNumber}`,
          referenceType: 'BILL',
          referenceId: invoiceId,
          createdAt: now,
          createdBy: staffName,
        });
      }
    }

    // 2. Update Customer Account & Ledger
    let custId = inv.customerId || inv.customer.id;
    let newStatus: InvoiceStatus = inv.creditAmount > 0 ? (inv.paidAmount > 0 ? 'PARTIALLY_PAID' : 'CREDIT') : 'PAID';

    if (custId) {
      const custRef = doc(db, 'customers', custId);
      const custSnap = await trans.get(custRef);
      if (custSnap.exists()) {
        const cData = custSnap.data();
        const currPurchases = cData.totalPurchases || 0;
        const currPaid = cData.totalPaid || 0;
        const currOutstanding = cData.currentOutstanding || 0;
        const creditLimit = cData.creditLimit || 0;

        const newOutstanding = currOutstanding + inv.creditAmount;
        if (creditLimit > 0 && newOutstanding > creditLimit) {
          throw new Error(`Credit limit exceeded for ${inv.customer.name}. Limit: NPR ${creditLimit.toLocaleString()}, Current: NPR ${currOutstanding.toLocaleString()}`);
        }

        trans.update(custRef, {
          totalPurchases: currPurchases + inv.total,
          totalPaid: currPaid + inv.paidAmount,
          currentOutstanding: newOutstanding,
          updatedAt: now,
        });

        const ledgerRef = doc(customerLedgerCol);
        trans.set(ledgerRef, {
          customerId: custId,
          type: 'SALE_CREDIT',
          amount: inv.total,
          balance: newOutstanding,
          referenceType: 'INVOICE',
          referenceId: invoiceId,
          description: `Confirmed Bill #${inv.invoiceNumber}`,
          createdAt: now,
          createdBy: staffName,
        });
      }
    }

    trans.update(invRef, {
      status: newStatus,
      updatedAt: now,
    });
  });
}

export async function cancelInvoice(invoiceId: string, reason: string, staffName = 'Admin Staff'): Promise<void> {
  const now = new Date().toISOString();

  await runTransaction(db, async (trans) => {
    const invRef = doc(db, 'invoices', invoiceId);
    const invSnap = await trans.get(invRef);
    if (!invSnap.exists()) throw new Error('Invoice not found.');

    const inv = invSnap.data() as Invoice;
    if (inv.status === 'CANCELLED') {
      throw new Error(`Invoice #${inv.invoiceNumber} is already cancelled.`);
    }

    const wasConfirmed = inv.status !== 'DRAFT';

    if (wasConfirmed) {
      // 1. Restore Inventory
      for (const item of inv.items) {
        if (item.productId && item.productId !== 'custom') {
          const prodRef = doc(db, 'products', item.productId);
          const prodSnap = await trans.get(prodRef);
          if (prodSnap.exists()) {
            const currentStock = prodSnap.data().stock || 0;
            trans.update(prodRef, {
              stock: currentStock + item.quantity,
              updatedAt: now,
            });

            const txRef = doc(inventoryTransactionsCol);
            trans.set(txRef, {
              productId: item.productId,
              productName: item.productName,
              type: 'STOCK_IN',
              quantity: item.quantity,
              reason: `Cancelled Bill Reversal: #${inv.invoiceNumber}`,
              referenceType: 'CANCELLED_BILL',
              referenceId: invoiceId,
              createdAt: now,
              createdBy: staffName,
            });
          }
        }
      }

      // 2. Reverse Customer Credit & Outstanding
      const custId = inv.customerId || inv.customer.id;
      if (custId) {
        const custRef = doc(db, 'customers', custId);
        const custSnap = await trans.get(custRef);
        if (custSnap.exists()) {
          const cData = custSnap.data();
          const currPurchases = cData.totalPurchases || 0;
          const currPaid = cData.totalPaid || 0;
          const currOutstanding = cData.currentOutstanding || 0;

          const newOutstanding = Math.max(0, currOutstanding - inv.creditAmount);

          trans.update(custRef, {
            totalPurchases: Math.max(0, currPurchases - inv.total),
            totalPaid: Math.max(0, currPaid - inv.paidAmount),
            currentOutstanding: newOutstanding,
            updatedAt: now,
          });

          const ledgerRef = doc(customerLedgerCol);
          trans.set(ledgerRef, {
            customerId: custId,
            type: 'CANCELLED_SALE',
            amount: -inv.total,
            balance: newOutstanding,
            referenceType: 'INVOICE',
            referenceId: invoiceId,
            description: `Cancelled Bill #${inv.invoiceNumber} (${reason})`,
            createdAt: now,
            createdBy: staffName,
          });
        }
      }
    }

    trans.update(invRef, {
      status: 'CANCELLED',
      cancelledBy: staffName,
      cancelledAt: now,
      cancellationReason: reason,
      updatedAt: now,
    });
  });
}

// PAYMENTS & RECEIPTS
export async function getPayments(customerId?: string): Promise<Payment[]> {
  try {
    let q = query(paymentsCol, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    let list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Payment));
    if (customerId) {
      list = list.filter(p => p.customerId === customerId);
    }
    return list;
  } catch (err) {
    console.error('Error fetching payments:', err);
    return [];
  }
}

export async function getPaymentById(id: string): Promise<Payment | null> {
  try {
    const docRef = doc(db, 'payments', id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Payment;
  } catch (err) {
    console.error('Error fetching payment by ID:', err);
    return null;
  }
}

export async function recordPayment(
  data: Omit<Payment, 'id' | 'receiptNumber' | 'financialYear' | 'previousOutstanding' | 'remainingOutstanding' | 'createdAt'>
): Promise<string> {
  const fyInfo = getNepalFY();
  const settings = await getBusinessSettings();
  const prefix = settings.receiptPrefix || 'REC-';

  let newPaymentId = '';

  await runTransaction(db, async (trans) => {
    const custRef = doc(db, 'customers', data.customerId);
    const custSnap = await trans.get(custRef);
    if (!custSnap.exists()) throw new Error('Customer account not found.');

    const cData = custSnap.data();
    const prevOutstanding = cData.currentOutstanding || 0;

    if (data.amount > prevOutstanding) {
      throw new Error(`Payment amount (NPR ${data.amount.toLocaleString()}) exceeds total outstanding balance (NPR ${prevOutstanding.toLocaleString()}).`);
    }

    const nextSeq = await getNextSequenceNumber('receipts', fyInfo.fyKey, trans);
    const receiptNumber = formatDocumentNumber(prefix.replace(/-$/, ''), fyInfo.fyString, nextSeq);

    const remaining = prevOutstanding - data.amount;
    const now = new Date().toISOString();

    // 1. Update Customer Totals
    trans.update(custRef, {
      totalPaid: (cData.totalPaid || 0) + data.amount,
      currentOutstanding: remaining,
      updatedAt: now,
    });

    // 2. Customer Ledger Entry
    const ledgerRef = doc(customerLedgerCol);
    trans.set(ledgerRef, {
      customerId: data.customerId,
      type: 'PAYMENT',
      amount: -data.amount,
      balance: remaining,
      referenceType: 'PAYMENT',
      referenceId: '', // set after doc ref created below
      description: `Payment Received (${data.paymentMethod}) - Receipt #${receiptNumber}`,
      createdAt: now,
      createdBy: data.createdBy || 'Staff',
    });

    // 3. Update Invoice if linked
    if (data.invoiceId) {
      const invRef = doc(db, 'invoices', data.invoiceId);
      const invSnap = await trans.get(invRef);
      if (invSnap.exists()) {
        const invData = invSnap.data() as Invoice;
        const newPaid = (invData.paidAmount || 0) + data.amount;
        const newCredit = Math.max(0, (invData.creditAmount || 0) - data.amount);
        const newStatus: InvoiceStatus = newCredit <= 0 ? 'PAID' : 'PARTIALLY_PAID';

        trans.update(invRef, {
          paidAmount: newPaid,
          creditAmount: newCredit,
          status: newStatus,
          updatedAt: now,
        });
      }
    }

    // 4. Create Payment Document
    const payRef = doc(paymentsCol);
    newPaymentId = payRef.id;

    trans.set(payRef, {
      ...data,
      receiptNumber,
      financialYear: fyInfo.fyString,
      previousOutstanding: prevOutstanding,
      remainingOutstanding: remaining,
      createdAt: now,
    });
  });

  return newPaymentId;
}

// CUSTOMER LEDGER STATEMENT
export async function getCustomerLedger(customerId: string): Promise<CustomerLedgerEntry[]> {
  try {
    const q = query(customerLedgerCol, where('customerId', '==', customerId), orderBy('createdAt', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as CustomerLedgerEntry));
  } catch (err) {
    console.error('Error fetching customer ledger:', err);
    return [];
  }
}

// QUOTATION TO BILL CONVERSION
export async function convertQuotationToInvoice(quotationId: string, staffName = 'Admin Staff'): Promise<string> {
  const qSnap = await getDoc(doc(db, 'quotations', quotationId));
  if (!qSnap.exists()) throw new Error('Quotation not found.');

  const qData = qSnap.data() as Quotation;
  if (qData.invoiceId) {
    throw new Error('This quotation has already been converted into a bill.');
  }

  // Create Draft Invoice
  const invoiceId = await createInvoice({
    quotationId,
    customerId: qData.customerId || '',
    customer: qData.customer,
    items: qData.items,
    subtotal: qData.subtotal,
    discount: qData.discount,
    tax: qData.tax,
    total: qData.total,
    paidAmount: 0,
    creditAmount: qData.total,
    paymentType: 'CREDIT',
    status: 'DRAFT',
    notes: `Converted from Quotation #${qData.quotationNumber}. ${qData.notes || ''}`,
    createdBy: staffName,
  });

  // Mark Quotation as Accepted & Link Invoice
  await updateDoc(doc(db, 'quotations', quotationId), {
    status: 'ACCEPTED',
    invoiceId,
    updatedAt: new Date().toISOString(),
  });

  return invoiceId;
}

// FINANCIAL REPORTS
export async function getFinancialReports(targetFYKey?: string) {
  const currentFY = getNepalFY();
  const fyString = targetFYKey ? targetFYKey.replace('-', '/') : currentFY.fyString;

  const [invList, payList, txList, qList] = await Promise.all([
    getInvoices(),
    getPayments(),
    getInventoryTransactions(),
    getQuotations(),
  ]);

  const fyInvoices = invList.filter(i => !i.financialYear || i.financialYear === fyString);
  const fyPayments = payList.filter(p => !p.financialYear || p.financialYear === fyString);

  const totalSales = fyInvoices.filter(i => i.status !== 'CANCELLED').reduce((acc, curr) => acc + curr.total, 0);
  const totalCollected = fyInvoices.filter(i => i.status !== 'CANCELLED').reduce((acc, curr) => acc + curr.paidAmount, 0) +
                         fyPayments.reduce((acc, curr) => acc + curr.amount, 0);
  const creditSales = fyInvoices.filter(i => i.status !== 'CANCELLED').reduce((acc, curr) => acc + curr.creditAmount, 0);
  const totalOutstanding = Math.max(0, creditSales - fyPayments.reduce((acc, curr) => acc + curr.amount, 0));

  const confirmedBillsCount = fyInvoices.filter(i => i.status !== 'CANCELLED' && i.status !== 'DRAFT').length;
  const draftBillsCount = fyInvoices.filter(i => i.status === 'DRAFT').length;

  const quotationTotal = qList.length;
  const quotationAccepted = qList.filter(q => q.status === 'ACCEPTED').length;

  return {
    fyString,
    totalSales,
    totalCollected,
    creditSales,
    totalOutstanding,
    confirmedBillsCount,
    draftBillsCount,
    quotationTotal,
    quotationAccepted,
    invoices: fyInvoices,
    payments: fyPayments,
    recentTransactions: txList.slice(0, 20),
  };
}
