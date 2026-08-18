-- ANAND HARDWARE - SUPABASE POSTGRESQL DATABASE SCHEMA & RLS POLICIES
-- Biratnagar, Morang, Nepal

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PROFILES TABLE (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  category_name TEXT,
  brand TEXT,
  price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  unit TEXT NOT NULL DEFAULT 'pcs',
  description TEXT,
  specifications JSONB DEFAULT '{}'::jsonb,
  image_url TEXT,
  image_path TEXT,
  image_alt TEXT,
  stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  low_stock_level INT NOT NULL DEFAULT 10 CHECK (low_stock_level >= 0),
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. INVENTORY TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  product_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT', 'DAMAGE', 'RETURN')),
  quantity INT NOT NULL,
  reason TEXT NOT NULL,
  reference_type TEXT CHECK (reference_type IN ('BILL', 'MANUAL', 'PURCHASE', 'RETURN', 'ADJUSTMENT', 'CANCELLED_BILL')),
  reference_id UUID,
  note TEXT,
  created_by TEXT NOT NULL DEFAULT 'Staff',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  company TEXT,
  address TEXT,
  notes TEXT,
  total_purchases NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  total_paid NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  current_outstanding NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  credit_limit NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. LEADS TABLE
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  company TEXT,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'CONTACTED', 'QUOTATION', 'WON', 'LOST')),
  assigned_to TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. QUOTATIONS & ITEMS
CREATE TABLE IF NOT EXISTS public.quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_number TEXT UNIQUE NOT NULL,
  financial_year TEXT NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_info JSONB NOT NULL DEFAULT '{}'::jsonb,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  tax NUMERIC(5,2) NOT NULL DEFAULT 13.00,
  total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED')),
  notes TEXT,
  invoice_id UUID,
  created_by TEXT NOT NULL DEFAULT 'Staff',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.quotation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID REFERENCES public.quotations(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  sku TEXT,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit TEXT NOT NULL DEFAULT 'pcs',
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0.00
);

-- 8. INVOICES & ITEMS
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  financial_year TEXT NOT NULL,
  quotation_id UUID REFERENCES public.quotations(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_info JSONB NOT NULL DEFAULT '{}'::jsonb,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  tax NUMERIC(5,2) NOT NULL DEFAULT 13.00,
  total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  credit_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('FULL_PAYMENT', 'PARTIAL_PAYMENT', 'CREDIT')),
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'CONFIRMED', 'PARTIALLY_PAID', 'PAID', 'CREDIT', 'CANCELLED')),
  notes TEXT,
  cancelled_by TEXT,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_by TEXT NOT NULL DEFAULT 'Staff',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  sku TEXT,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit TEXT NOT NULL DEFAULT 'pcs',
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0.00
);

-- 9. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number TEXT UNIQUE NOT NULL,
  financial_year TEXT NOT NULL,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('CASH', 'BANK_TRANSFER', 'CARD', 'CHEQUE', 'OTHER')),
  previous_outstanding NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  remaining_outstanding NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  note TEXT,
  created_by TEXT NOT NULL DEFAULT 'Staff',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. CUSTOMER LEDGER
CREATE TABLE IF NOT EXISTS public.customer_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('SALE_CREDIT', 'PAYMENT', 'RETURN', 'ADJUSTMENT', 'CANCELLED_SALE')),
  amount NUMERIC(12,2) NOT NULL,
  balance NUMERIC(12,2) NOT NULL,
  reference_type TEXT NOT NULL CHECK (reference_type IN ('INVOICE', 'PAYMENT', 'MANUAL')),
  reference_id TEXT NOT NULL,
  description TEXT NOT NULL,
  created_by TEXT NOT NULL DEFAULT 'Staff',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. FINANCIAL SEQUENCES
CREATE TABLE IF NOT EXISTS public.financial_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seq_type TEXT NOT NULL CHECK (seq_type IN ('quotations', 'invoices', 'payments')),
  financial_year_key TEXT NOT NULL,
  last_number INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_seq_type_fy UNIQUE (seq_type, financial_year_key)
);

-- 12. BUSINESS SETTINGS
CREATE TABLE IF NOT EXISTS public.business_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  business_name TEXT NOT NULL DEFAULT 'ANAND HARDWARE',
  logo_url TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '+977 21-523456',
  email TEXT NOT NULL DEFAULT 'info@anandhardware.com',
  address TEXT NOT NULL DEFAULT 'Main Road, Ward No. 7, Biratnagar, Morang, Nepal',
  website TEXT NOT NULL DEFAULT 'https://anandhardware.com',
  opening_hours TEXT NOT NULL DEFAULT 'Sun - Fri: 8:00 AM - 7:00 PM',
  whatsapp TEXT NOT NULL DEFAULT '+9779801234567',
  facebook TEXT NOT NULL DEFAULT '',
  instagram TEXT NOT NULL DEFAULT '',
  tax_id TEXT NOT NULL DEFAULT 'PAN: 302948576',
  quotation_prefix TEXT NOT NULL DEFAULT 'QT-',
  invoice_prefix TEXT NOT NULL DEFAULT 'INV-',
  receipt_prefix TEXT NOT NULL DEFAULT 'REC-',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES FOR FAST PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(active);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(featured);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON public.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_fy ON public.invoices(financial_year);
CREATE INDEX IF NOT EXISTS idx_payments_customer ON public.payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_ledger_customer ON public.customer_ledger(customer_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON public.inventory_transactions(product_id);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing table policies if re-running
DROP POLICY IF EXISTS "Public Read Categories" ON public.categories;
DROP POLICY IF EXISTS "Public Read Products" ON public.products;
DROP POLICY IF EXISTS "Public Read Settings" ON public.business_settings;
DROP POLICY IF EXISTS "Public Insert Leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated Staff Profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated Staff Categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated Staff Products" ON public.products;
DROP POLICY IF EXISTS "Authenticated Staff Inventory" ON public.inventory_transactions;
DROP POLICY IF EXISTS "Authenticated Staff Customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated Staff Leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated Staff Quotations" ON public.quotations;
DROP POLICY IF EXISTS "Authenticated Staff Quotation Items" ON public.quotation_items;
DROP POLICY IF EXISTS "Authenticated Staff Invoices" ON public.invoices;
DROP POLICY IF EXISTS "Authenticated Staff Invoice Items" ON public.invoice_items;
DROP POLICY IF EXISTS "Authenticated Staff Payments" ON public.payments;
DROP POLICY IF EXISTS "Authenticated Staff Ledger" ON public.customer_ledger;
DROP POLICY IF EXISTS "Authenticated Staff Sequences" ON public.financial_sequences;
DROP POLICY IF EXISTS "Authenticated Staff Settings" ON public.business_settings;

-- Public Read for Catalog Data
CREATE POLICY "Public Read Categories" ON public.categories FOR SELECT USING (active = true);
CREATE POLICY "Public Read Products" ON public.products FOR SELECT USING (active = true);
CREATE POLICY "Public Read Settings" ON public.business_settings FOR SELECT USING (true);
CREATE POLICY "Public Insert Leads" ON public.leads FOR INSERT WITH CHECK (status = 'NEW');

-- Staff/Admin Full Access Policies
CREATE POLICY "Authenticated Staff Profiles" ON public.profiles FOR ALL USING (true);
CREATE POLICY "Authenticated Staff Categories" ON public.categories FOR ALL USING (true);
CREATE POLICY "Authenticated Staff Products" ON public.products FOR ALL USING (true);
CREATE POLICY "Authenticated Staff Inventory" ON public.inventory_transactions FOR ALL USING (true);
CREATE POLICY "Authenticated Staff Customers" ON public.customers FOR ALL USING (true);
CREATE POLICY "Authenticated Staff Leads" ON public.leads FOR ALL USING (true);
CREATE POLICY "Authenticated Staff Quotations" ON public.quotations FOR ALL USING (true);
CREATE POLICY "Authenticated Staff Quotation Items" ON public.quotation_items FOR ALL USING (true);
CREATE POLICY "Authenticated Staff Invoices" ON public.invoices FOR ALL USING (true);
CREATE POLICY "Authenticated Staff Invoice Items" ON public.invoice_items FOR ALL USING (true);
CREATE POLICY "Authenticated Staff Payments" ON public.payments FOR ALL USING (true);
CREATE POLICY "Authenticated Staff Ledger" ON public.customer_ledger FOR ALL USING (true);
CREATE POLICY "Authenticated Staff Sequences" ON public.financial_sequences FOR ALL USING (true);
CREATE POLICY "Authenticated Staff Settings" ON public.business_settings FOR ALL USING (true);

-- STORED PROCEDURE: ATOMIC SEQUENCE GENERATOR (FOR UPDATE LOCKING)
CREATE OR REPLACE FUNCTION public.get_next_sequence_number(
  p_seq_type TEXT,
  p_fy_key TEXT
) RETURNS INT AS $$
DECLARE
  v_next INT;
BEGIN
  INSERT INTO public.financial_sequences (seq_type, financial_year_key, last_number, updated_at)
  VALUES (p_seq_type, p_fy_key, 1, NOW())
  ON CONFLICT (seq_type, financial_year_key)
  DO UPDATE SET last_number = public.financial_sequences.last_number + 1, updated_at = NOW()
  RETURNING last_number INTO v_next;

  RETURN v_next;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. SUPABASE STORAGE BUCKET & SECURITY POLICIES FOR PRODUCT IMAGES
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Policies for product-images bucket
DROP POLICY IF EXISTS "Public Read Product Images" ON storage.objects;
DROP POLICY IF EXISTS "Allow Product Images Upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow Product Images Update" ON storage.objects;
DROP POLICY IF EXISTS "Allow Product Images Delete" ON storage.objects;

CREATE POLICY "Public Read Product Images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "Allow Product Images Upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Allow Product Images Update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'product-images');

CREATE POLICY "Allow Product Images Delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images');
