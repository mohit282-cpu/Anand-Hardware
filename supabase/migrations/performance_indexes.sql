-- ANAND HARDWARE — Performance Optimization Indexes
-- Run this in Supabase SQL Editor
-- These indexes are based on actual query patterns in the application

-- ============================================
-- PRODUCTS TABLE INDEXES
-- ============================================

-- Homepage: getProducts({ onlyActive: true, featured: true })
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_products_featured_active ON products(featured, active) WHERE featured = true AND active = true;

-- Product catalog: filter by category_id
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);

-- Product detail: lookup by slug
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);

-- ============================================
-- CATEGORIES TABLE INDEXES
-- ============================================

-- Categories page: filter by active
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(active);

-- ============================================
-- INVOICES TABLE INDEXES
-- ============================================

-- Invoice list: filter by status, order by created_at
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_financial_year ON invoices(financial_year);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);

-- ============================================
-- QUOTATIONS TABLE INDEXES
-- ============================================

-- Quotation list: filter by status
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_created_at ON quotations(created_at DESC);

-- ============================================
-- PAYMENTS TABLE INDEXES
-- ============================================

-- Payment list: order by created_at
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id);

-- ============================================
-- LEADS TABLE INDEXES
-- ============================================

-- Dashboard: count leads by status
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

-- ============================================
-- INVENTORY TRANSACTIONS TABLE INDEXES
-- ============================================

-- Dashboard/Inventory: order by created_at, filter by product_id
CREATE INDEX IF NOT EXISTS idx_inv_txn_created_at ON inventory_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inv_txn_product_id ON inventory_transactions(product_id);

-- ============================================
-- CUSTOMER LEDGER TABLE INDEXES
-- ============================================

-- Customer ledger: filter by customer_id
CREATE INDEX IF NOT EXISTS idx_customer_ledger_customer ON customer_ledger(customer_id);

-- ============================================
-- CUSTOMERS TABLE INDEXES
-- ============================================

-- Customer search: phone lookup
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- ============================================
-- FINANCIAL SEQUENCES TABLE INDEXES
-- ============================================

-- Sequence generation: lookup by seq_type + financial_year_key
CREATE INDEX IF NOT EXISTS idx_fin_seq_type_fy ON financial_sequences(seq_type, financial_year_key);
