export type InventoryTransactionType = 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT' | 'DAMAGE' | 'RETURN';

export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUOTATION' | 'WON' | 'LOST';

export type QuotationStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

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
  createdAt: string;
  updatedAt: string;
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
  updatedAt?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt?: string;
}
