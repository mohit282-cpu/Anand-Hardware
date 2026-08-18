import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  sku: z.string().optional().default(''),
  categoryId: z.string().min(1, 'Category is required'),
  categoryName: z.string().optional().default(''),
  brand: z.string().optional().default(''),
  price: z.coerce.number().min(0, 'Price must be greater than or equal to 0'),
  unit: z.string().min(1, 'Unit of measurement is required'),
  description: z.string().optional().default(''),
  specifications: z.string().optional().default(''),
  imageUrl: z.string().refine(
    (val) => !val || val === '' || /^https?:\/\/.+/i.test(val),
    'Please enter a valid URL starting with http:// or https://'
  ).optional().default(''),
  stock: z.coerce.number().int().min(0, 'Stock cannot be negative'),
  lowStockLevel: z.coerce.number().int().min(0, 'Low stock threshold cannot be negative'),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
});

export type ProductFormValues = z.infer<typeof productSchema>;

export const categorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters'),
  description: z.string().optional().default(''),
  imageUrl: z.string().refine(
    (val) => !val || val === '' || /^https?:\/\/.+/i.test(val),
    'Please enter a valid URL starting with http:// or https://'
  ).optional().default(''),
  active: z.boolean().default(true),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

export const leadInquirySchema = z.object({
  customerName: z.string().min(2, 'Full name is required'),
  phone: z.string().min(7, 'Please enter a valid phone number (at least 7 digits)'),
  email: z.string().refine(
    (val) => !val || val === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
    'Please enter a valid email address'
  ).optional().default(''),
  company: z.string().optional().default(''),
  productName: z.string().min(1, 'Product selection is required'),
  productId: z.string().optional().default(''),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  message: z.string().optional().default(''),
});

export type LeadInquiryFormValues = z.infer<typeof leadInquirySchema>;

export const customerSchema = z.object({
  name: z.string().min(2, 'Customer name is required'),
  phone: z.string().min(7, 'Valid phone number is required'),
  email: z.string().refine(
    (val) => !val || val === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
    'Invalid email address'
  ).optional().default(''),
  company: z.string().optional().default(''),
  address: z.string().optional().default(''),
  notes: z.string().optional().default(''),
  creditLimit: z.coerce.number().min(0, 'Credit limit cannot be negative').default(0),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;

export const inventoryTransactionSchema = z.object({
  productId: z.string().min(1, 'Product selection is required'),
  type: z.enum(['STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT', 'DAMAGE', 'RETURN']),
  quantity: z.coerce.number().int().min(1, 'Quantity must be greater than 0'),
  reason: z.string().min(2, 'Reason is required (e.g. Purchase, Sale, Defect)'),
  note: z.string().optional().default(''),
});

export type InventoryTransactionFormValues = z.infer<typeof inventoryTransactionSchema>;

export const quotationItemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  productName: z.string().min(1, 'Product name is required'),
  sku: z.string().optional().default(''),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  unit: z.string().min(1, 'Unit is required'),
  unitPrice: z.coerce.number().min(0, 'Unit price cannot be negative'),
  subtotal: z.coerce.number().min(0),
});

export const quotationSchema = z.object({
  customerName: z.string().min(2, 'Customer name is required'),
  customerPhone: z.string().min(7, 'Customer phone number is required'),
  customerEmail: z.string().optional().default(''),
  customerCompany: z.string().optional().default(''),
  customerAddress: z.string().optional().default(''),
  customerId: z.string().optional().default(''),
  items: z.array(quotationItemSchema).min(1, 'Quotation must have at least one line item'),
  discount: z.coerce.number().min(0, 'Discount cannot be negative').default(0),
  tax: z.coerce.number().min(0, 'Tax percentage cannot be negative').default(0),
  notes: z.string().optional().default(''),
  status: z.enum(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED']).default('DRAFT'),
});

export type QuotationFormValues = z.infer<typeof quotationSchema>;

export const invoiceSchema = z.object({
  customerName: z.string().min(2, 'Customer name is required'),
  customerPhone: z.string().min(7, 'Customer phone number is required'),
  customerEmail: z.string().optional().default(''),
  customerCompany: z.string().optional().default(''),
  customerAddress: z.string().optional().default(''),
  customerId: z.string().optional().default(''),
  quotationId: z.string().optional().default(''),
  items: z.array(quotationItemSchema).min(1, 'Invoice must have at least one line item'),
  discount: z.coerce.number().min(0, 'Discount cannot be negative').default(0),
  tax: z.coerce.number().min(0, 'Tax percentage cannot be negative').default(0),
  paidAmount: z.coerce.number().min(0, 'Paid amount cannot be negative').default(0),
  creditAmount: z.coerce.number().min(0, 'Credit amount cannot be negative').default(0),
  paymentType: z.enum(['FULL_PAYMENT', 'PARTIAL_PAYMENT', 'CREDIT']).default('FULL_PAYMENT'),
  notes: z.string().optional().default(''),
  confirmImmediately: z.boolean().default(false),
});

export type InvoiceFormValues = z.infer<typeof invoiceSchema>;

export const paymentSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  customerName: z.string().min(2, 'Customer name is required'),
  customerPhone: z.string().optional().default(''),
  invoiceId: z.string().optional().default(''),
  invoiceNumber: z.string().optional().default(''),
  amount: z.coerce.number().min(1, 'Payment amount must be at least NPR 1'),
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'CARD', 'CHEQUE', 'OTHER']).default('CASH'),
  note: z.string().optional().default(''),
});

export type PaymentFormValues = z.infer<typeof paymentSchema>;

export const businessSettingsSchema = z.object({
  businessName: z.string().min(2, 'Business name is required'),
  logoUrl: z.string().optional().default(''),
  phone: z.string().min(5, 'Phone number is required'),
  email: z.string().email('Valid email is required'),
  address: z.string().min(5, 'Physical address is required'),
  website: z.string().optional().default(''),
  openingHours: z.string().min(2, 'Opening hours are required'),
  whatsapp: z.string().optional().default(''),
  facebook: z.string().optional().default(''),
  instagram: z.string().optional().default(''),
  taxId: z.string().optional().default(''),
  quotationPrefix: z.string().min(1, 'Quotation prefix is required').default('QT-'),
  invoicePrefix: z.string().min(1, 'Invoice prefix is required').default('INV-'),
  receiptPrefix: z.string().min(1, 'Receipt prefix is required').default('REC-'),
});

export type BusinessSettingsFormValues = z.infer<typeof businessSettingsSchema>;
