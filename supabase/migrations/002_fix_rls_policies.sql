-- ANAND HARDWARE — RLS Policy Security Fix
-- ============================================
-- This migration fixes the critical security issue where
-- "Authenticated Staff" policies used USING(true) without
-- checking auth.uid(), allowing unauthenticated/anonymous
-- access to ALL private data.
--
-- Run this in Supabase SQL Editor.
-- ============================================

-- 1. Drop existing overly-permissive staff policies
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

-- 2. Recreate staff policies WITH auth.uid() check
-- Only authenticated users can access private data

CREATE POLICY "Auth Staff Profiles"
  ON public.profiles FOR ALL
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Auth Staff Categories"
  ON public.categories FOR ALL
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Auth Staff Products"
  ON public.products FOR ALL
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Auth Staff Inventory"
  ON public.inventory_transactions FOR ALL
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Auth Staff Customers"
  ON public.customers FOR ALL
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Auth Staff Leads"
  ON public.leads FOR ALL
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Auth Staff Quotations"
  ON public.quotations FOR ALL
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Auth Staff Quotation Items"
  ON public.quotation_items FOR ALL
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Auth Staff Invoices"
  ON public.invoices FOR ALL
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Auth Staff Invoice Items"
  ON public.invoice_items FOR ALL
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Auth Staff Payments"
  ON public.payments FOR ALL
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Auth Staff Ledger"
  ON public.customer_ledger FOR ALL
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Auth Staff Sequences"
  ON public.financial_sequences FOR ALL
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Auth Staff Settings Write"
  ON public.business_settings FOR ALL
  USING (auth.uid() IS NOT NULL);

-- 3. Fix Storage policies: require auth for upload/update/delete
DROP POLICY IF EXISTS "Allow Product Images Upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow Product Images Update" ON storage.objects;
DROP POLICY IF EXISTS "Allow Product Images Delete" ON storage.objects;

CREATE POLICY "Auth Upload Product Images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Auth Update Product Images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'product-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Auth Delete Product Images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images' AND auth.uid() IS NOT NULL);

-- Public read for images remains unchanged (already exists)
