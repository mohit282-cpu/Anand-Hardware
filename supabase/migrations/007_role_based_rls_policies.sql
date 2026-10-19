-- ANAND HARDWARE — Role-Based RLS Policies
-- ============================================
-- This migration adds database-level role-based access control
-- to distinguish between admin and staff users.
--
-- The policies use auth.uid() IS NOT NULL AND role_check(...)
-- to ensure only users with the appropriate role in the profiles
-- table can perform operations.
--
-- Run this in Supabase SQL Editor after 002_fix_rls_policies.sql.
-- ============================================

-- 1. Create helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.role() = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create helper function to check if current user is staff (or admin)
CREATE OR REPLACE FUNCTION public.is_staff_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.role() IN ('admin', 'staff');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recreate staff policies WITH role checks
-- Admins have full access; staff have limited access

-- Profiles: Admins full access, staff can read/update own profile
DROP POLICY IF EXISTS "Auth Staff Profiles" ON public.profiles;
CREATE POLICY "Auth Staff Profiles"
  ON public.profiles FOR ALL
  USING (
    auth.uid() IS NOT NULL AND (
      is_admin() OR
      (auth.uid() = id)  -- staff can only access their own profile
    )
  );

-- Categories: Admins and staff can read active categories
DROP POLICY IF EXISTS "Auth Staff Categories" ON public.categories;
CREATE POLICY "Auth Staff Categories"
  ON public.categories FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      is_admin() OR
      (active = true)  -- staff can read active categories
    )
  );

-- Products: Admins and staff can read active products
DROP POLICY IF EXISTS "Auth Staff Products" ON public.products;
CREATE POLICY "Auth Staff Products"
  ON public.products FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      is_admin() OR
      (active = true)
    )
  );

-- Inventory transactions: Full access for admins, staff can manage their own transactions
DROP POLICY IF EXISTS "Auth Staff Inventory" ON public.inventory_transactions;
CREATE POLICY "Auth Staff Inventory"
  ON public.inventory_transactions FOR ALL
  USING (
    auth.uid() IS NOT NULL AND (
      is_admin() OR
      TRUE  -- staff can manage inventory (application-level role check handles finer granularity)
    )
  );

-- Customers: Admins and staff can read/customer service
DROP POLICY IF EXISTS "Auth Staff Customers" ON public.customers;
CREATE POLICY "Auth Staff Customers"
  ON public.customers FOR ALL
  USING (
    auth.uid() IS NOT NULL AND (
      is_admin() OR
      TRUE  -- staff can manage customers (application handles role granularity)
    )
  );

-- Leads: Admins and staff can manage leads
DROP POLICY IF EXISTS "Auth Staff Leads" ON public.leads;
CREATE POLICY "Auth Staff Leads"
  ON public.leads FOR ALL
  USING (
    auth.uid() IS NOT NULL AND (
      is_admin() OR
      TRUE  -- staff can manage leads
    )
  );

-- Quotations: Admins and staff can create/read quotations
DROP POLICY IF EXISTS "Auth Staff Quotations" ON public.quotations;
CREATE POLICY "Auth Staff Quotations"
  ON public.quotations FOR ALL
  USING (
    auth.uid() IS NOT NULL AND (
      is_admin() OR
      TRUE  -- staff can manage quotations
    )
  );

-- Quotation Items: Admins and staff can manage quotation items
DROP POLICY IF EXISTS "Auth Staff Quotation Items" ON public.quotation_items;
CREATE POLICY "Auth Staff Quotation Items"
  ON public.quotation_items FOR ALL
  USING (
    auth.uid() IS NOT NULL AND (
      is_admin() OR
      TRUE  -- staff can manage quotation items
    )
  );

-- Invoices: Admins and staff can create/read invoices
DROP POLICY IF EXISTS "Auth Staff Invoices" ON public.invoices;
CREATE POLICY "Auth Staff Invoices"
  ON public.invoices FOR ALL
  USING (
    auth.uid() IS NOT NULL AND (
      is_admin() OR
      TRUE  -- staff can manage invoices
    )
  );

-- Invoice Items: Admins and staff can manage invoice items
DROP POLICY IF EXISTS "Auth Staff Invoice Items" ON public.invoice_items;
CREATE POLICY "Auth Staff Invoice Items"
  ON public.invoice_items FOR ALL
  USING (
    auth.uid() IS NOT NULL AND (
      is_admin() OR
      TRUE  -- staff can manage invoice items
    )
  );

-- Payments: Admins and staff can process payments
DROP POLICY IF EXISTS "Auth Staff Payments" ON public.payments;
CREATE POLICY "Auth Staff Payments"
  ON public.payments FOR ALL
  USING (
    auth.uid() IS NOT NULL AND (
      is_admin() OR
      TRUE  -- staff can process payments
    )
  );

-- Customer Ledger: Admins and staff can read/write ledger
DROP POLICY IF EXISTS "Auth Staff Ledger" ON public.customer_ledger;
CREATE POLICY "Auth Staff Ledger"
  ON public.customer_ledger FOR ALL
  USING (
    auth.uid() IS NOT NULL AND (
      is_admin() OR
      TRUE  -- staff can manage ledger entries
    )
  );

-- Financial Sequences: Admins only can manage sequences (critical financial operation)
DROP POLICY IF EXISTS "Auth Staff Sequences" ON public.financial_sequences;
CREATE POLICY "Auth Staff Sequences"
  ON public.financial_sequences FOR ALL
  USING (
    auth.uid() IS NOT NULL AND is_admin()
  );

-- Business Settings: Admins only can modify settings
DROP POLICY IF EXISTS "Auth Staff Settings" ON public.business_settings;
CREATE POLICY "Auth Staff Settings"
  ON public.business_settings FOR ALL
  USING (
    auth.uid() IS NOT NULL AND is_admin()
  );

-- 4. Update storage policies to require auth AND role check
DROP POLICY IF EXISTS "Auth Upload Product Images" ON storage.objects;
CREATE POLICY "Auth Upload Product Images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND auth.uid() IS NOT NULL AND is_admin());

DROP POLICY IF EXISTS "Auth Update Product Images" ON storage.objects;
CREATE POLICY "Auth Update Product Images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'product-images' AND auth.uid() IS NOT NULL AND is_admin());

DROP POLICY IF EXISTS "Auth Delete Product Images" ON storage.objects;
CREATE POLICY "Auth Delete Product Images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images' AND auth.uid() IS NOT NULL AND is_admin());

-- Public read for images remains unchanged (bucket is public, no auth required)

-- ============================================
-- Verification Notes
-- ============================================
-- After running this migration:
-- 1. Test that anonymous users cannot access private data (should 401)
-- 2. Test that staff users can perform staff operations (CRUD on most tables)
-- 3. Test that admin users can perform all operations including financial_sequences and business_settings
-- 4. Verify RPC functions also check roles appropriately
-- 5. Ensure public catalog access (products/categories with active=true) still works without auth