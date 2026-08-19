-- ANAND HARDWARE — RPC Helper Functions
-- ============================================
-- These RPCs push aggregation into PostgreSQL for better performance.
-- Run this in Supabase SQL Editor.
-- ============================================

-- 1. Get distinct brands from active products (avoids JS Set() dedup)
CREATE OR REPLACE FUNCTION public.get_distinct_brands()
RETURNS TABLE(brand TEXT) AS $$
BEGIN
  RETURN QUERY
    SELECT DISTINCT p.brand
    FROM public.products p
    WHERE p.brand IS NOT NULL
      AND p.brand != ''
      AND p.active = true
    ORDER BY p.brand;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
