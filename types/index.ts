export type InventoryTransactionType = 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT' | 'DAMAGE' | 'RETURN';

export type InventoryTransactionReferenceType = 'BILL' | 'MANUAL' | 'PURCHASE' | 'RETURN' | 'ADJUSTMENT' | 'CANCELLED_BILL';

export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUOTATION' | 'WON' | 'LOST';

export type QuotationStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

export type InvoiceStatus = 'DRAFT' | 'CONFIRMED' | 'PARTIALLY_PAID' | 'PAID' | 'CREDIT' | 'CANCELLED';

export type PaymentType = 'FULL_PAYMENT' | 'PARTIAL_PAYMENT' | 'CREDIT';

export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'CHEQUE' | 'OTHER';

export type CustomerLedgerType = 'SALE_CREDIT' | 'PAYMENT' | 'RETURN' | 'ADJUSTMENT' | 'CANCELLED_SALE';

export type UserRole = 'admin' | 'staff';

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  categoryId: string;
  categoryName: string;
  brand: string;
  price: number;
  unit: string;
  description: string;
  specifications: Record<string, string> | string;
  imageUrl: string;
  imagePath?: string;
  imageAlt?: string;
  stock: number;
  lowStockLevel: number;
  featured: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryTransaction {
  id: string;
  productId: string;
  productName: string;
  type: InventoryTransactionType;
  quantity: number;
  reason: string;
  referenceType?: InventoryTransactionReferenceType;
  referenceId?: string;
  note?: string;
  createdAt: string;
  createdBy: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  address?: string;
  notes?: string;
  totalPurchases?: number;
  totalPaid?: number;
  currentOutstanding?: number;
  creditLimit?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Lead {
  id: string;
  customerId?: string;
  customerName: string;
  phone: string;
  email?: string;
  company?: string;
  productId?: string;
  productName: string;
  quantity: number;
  message?: string;
  status: LeadStatus;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
}

export interface QuotationItem {
  productId: string;
  productName: string;
  sku?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  subtotal: number;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  customerId?: string;
  customer: {
    id?: string;
    name: string;
    phone: string;
    email?: string;
    company?: string;
    address?: string;
  };
  items: QuotationItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: QuotationStatus;
  notes?: string;
  invoiceId?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  financialYear: string;
  quotationId?: string;
  customerId?: string;
  customer: {
    id?: string;
    name: string;
    phone: string;
    email?: string;
    company?: string;
    address?: string;
  };
  items: QuotationItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paidAmount: number;
  creditAmount: number;
  paymentType: PaymentType;
  status: InvoiceStatus;
  notes?: string;
  cancelledBy?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface Payment {
  id: string;
  receiptNumber: string;
  financialYear: string;
  invoiceId?: string;
  invoiceNumber?: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  paymentMethod: PaymentMethod;
  previousOutstanding: number;
  remainingOutstanding: number;
  note?: string;
  createdAt: string;
  createdBy: string;
}

export interface CustomerLedgerEntry {
  id: string;
  customerId: string;
  type: CustomerLedgerType;
  amount: number;
  balance: number;
  referenceType: 'INVOICE' | 'PAYMENT' | 'MANUAL';
  referenceId: string;
  description: string;
  createdAt: string;
  createdBy: string;
}

export interface BusinessSettings {
  businessName: string;
  logoUrl: string;
  phone: string;
  email: string;
  address: string;
  website: string;
  openingHours: string;
  whatsapp: string;
  facebook: string;
  instagram: string;
  taxId: string; // PAN / VAT
  quotationPrefix: string;
  invoicePrefix: string;
  receiptPrefix: string;
  updatedAt?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt?: string;
}
