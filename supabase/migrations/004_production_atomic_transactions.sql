-- ANAND HARDWARE — Atomic Transaction Functions for Invoice Confirmation & Cancellation
-- =====================================================================================
-- This migration creates stored procedures for 100% ACID compliant atomic execution
-- of invoice confirmation (stock deduction + customer ledger + invoice status) and
-- invoice cancellation (stock restoration + ledger reversal + customer balance update).
-- =====================================================================================

-- 1. ATOMIC INVOICE CONFIRMATION FUNCTION
CREATE OR REPLACE FUNCTION public.confirm_invoice(p_invoice_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_invoice RECORD;
  v_item RECORD;
  v_prod RECORD;
  v_cust RECORD;
  v_new_purchases NUMERIC(12,2);
  v_new_paid NUMERIC(12,2);
  v_new_outstanding NUMERIC(12,2);
  v_final_status TEXT;
  v_receipt_seq INT;
  v_receipt_num TEXT;
BEGIN
  -- 1. Lock & fetch invoice record
  SELECT * INTO v_invoice FROM public.invoices WHERE id = p_invoice_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice % not found.', p_invoice_id;
  END IF;
  IF v_invoice.status != 'DRAFT' THEN
    RAISE EXCEPTION 'Invoice % is already processed (Status: %).', v_invoice.invoice_number, v_invoice.status;
  END IF;

  -- 2. Lock & validate all items and stock levels up front
  FOR v_item IN SELECT * FROM public.invoice_items WHERE invoice_id = p_invoice_id LOOP
    IF v_item.product_id IS NOT NULL THEN
      SELECT * INTO v_prod FROM public.products WHERE id = v_item.product_id FOR UPDATE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Product "%" (ID: %) not found.', v_item.product_name, v_item.product_id;
      END IF;
      IF v_item.quantity > v_prod.stock THEN
        RAISE EXCEPTION 'Insufficient stock for product "%". Available: %, Billed: %', v_prod.name, v_prod.stock, v_item.quantity;
      END IF;
    END IF;
  END LOOP;

  -- 3. Deduct inventory & create stock-out audit entries
  FOR v_item IN SELECT * FROM public.invoice_items WHERE invoice_id = p_invoice_id LOOP
    IF v_item.product_id IS NOT NULL THEN
      UPDATE public.products
      SET stock = stock - v_item.quantity,
          updated_at = NOW()
      WHERE id = v_item.product_id;

      INSERT INTO public.inventory_transactions (
        product_id, product_name, type, quantity, reason, reference_type, reference_id, created_by
      ) VALUES (
        v_item.product_id, v_item.product_name, 'STOCK_OUT', v_item.quantity,
        'Confirmed Bill #' || v_invoice.invoice_number, 'BILL', v_invoice.id, v_invoice.created_by
      );
    END IF;
  END LOOP;

  -- 4. Customer balance update & ledger entry
  IF v_invoice.customer_id IS NOT NULL THEN
    SELECT * INTO v_cust FROM public.customers WHERE id = v_invoice.customer_id FOR UPDATE;
    IF FOUND THEN
      v_new_purchases := COALESCE(v_cust.total_purchases, 0) + v_invoice.total;
      v_new_paid := COALESCE(v_cust.total_paid, 0) + v_invoice.paid_amount;
      v_new_outstanding := COALESCE(v_cust.current_outstanding, 0) + v_invoice.credit_amount;

      IF v_cust.credit_limit IS NOT NULL AND v_cust.credit_limit > 0 AND v_new_outstanding > v_cust.credit_limit THEN
        RAISE EXCEPTION 'Credit limit exceeded for customer "%". Current: Rs. %, Credit: Rs. %, Limit: Rs. %',
          v_cust.name, v_cust.current_outstanding, v_invoice.credit_amount, v_cust.credit_limit;
      END IF;

      UPDATE public.customers
      SET total_purchases = v_new_purchases,
          total_paid = v_new_paid,
          current_outstanding = v_new_outstanding,
          updated_at = NOW()
      WHERE id = v_invoice.customer_id;

      IF v_invoice.credit_amount > 0 THEN
        INSERT INTO public.customer_ledger (
          customer_id, type, amount, balance, reference_type, reference_id, description, created_by
        ) VALUES (
          v_invoice.customer_id, 'SALE_CREDIT', v_invoice.credit_amount, v_new_outstanding,
          'INVOICE', v_invoice.id::text, 'Credit Purchase — Bill #' || v_invoice.invoice_number, v_invoice.created_by
        );
      END IF;
    END IF;
  END IF;

  -- 5. Record initial payment if paid_amount > 0
  IF v_invoice.paid_amount > 0 AND v_invoice.customer_id IS NOT NULL THEN
    v_receipt_seq := public.get_next_sequence_number('payments', v_invoice.financial_year);
    v_receipt_num := 'REC-' || v_invoice.financial_year || '-' || LPAD(v_receipt_seq::text, 4, '0');

    INSERT INTO public.payments (
      receipt_number, financial_year, invoice_id, customer_id, customer_name, customer_phone,
      amount, payment_method, previous_outstanding, remaining_outstanding, note, created_by
    ) VALUES (
      v_receipt_num, v_invoice.financial_year, v_invoice.id, v_invoice.customer_id,
      COALESCE(v_cust.name, 'Customer'), COALESCE(v_cust.phone, ''),
      v_invoice.paid_amount, 'CASH',
      COALESCE(v_cust.current_outstanding, 0) - v_invoice.credit_amount, v_new_outstanding,
      'Initial payment for Bill #' || v_invoice.invoice_number, v_invoice.created_by
    );
  END IF;

  -- 6. Set final invoice status
  v_final_status := CASE WHEN v_invoice.credit_amount > 0 THEN 'CREDIT' ELSE 'PAID' END;
  UPDATE public.invoices
  SET status = v_final_status,
      updated_at = NOW()
  WHERE id = p_invoice_id;

  RETURN jsonb_build_object(
    'success', true,
    'status', v_final_status,
    'invoice_number', v_invoice.invoice_number
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. ATOMIC INVOICE CANCELLATION FUNCTION
CREATE OR REPLACE FUNCTION public.cancel_invoice(
  p_invoice_id UUID,
  p_reason TEXT,
  p_staff_name TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_invoice RECORD;
  v_item RECORD;
  v_cust RECORD;
  v_new_purchases NUMERIC(12,2);
  v_new_paid NUMERIC(12,2);
  v_new_outstanding NUMERIC(12,2);
BEGIN
  -- 1. Lock & fetch invoice record
  SELECT * INTO v_invoice FROM public.invoices WHERE id = p_invoice_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invoice % not found.', p_invoice_id;
  END IF;
  IF v_invoice.status = 'CANCELLED' THEN
    RAISE EXCEPTION 'Invoice % is already cancelled.', v_invoice.invoice_number;
  END IF;

  -- 2. If invoice was confirmed, restore inventory & reverse customer totals/ledger
  IF v_invoice.status IN ('CONFIRMED', 'CREDIT', 'PAID', 'PARTIALLY_PAID') THEN
    FOR v_item IN SELECT * FROM public.invoice_items WHERE invoice_id = p_invoice_id LOOP
      IF v_item.product_id IS NOT NULL THEN
        UPDATE public.products
        SET stock = stock + v_item.quantity,
            updated_at = NOW()
        WHERE id = v_item.product_id;

        INSERT INTO public.inventory_transactions (
          product_id, product_name, type, quantity, reason, reference_type, reference_id, created_by
        ) VALUES (
          v_item.product_id, v_item.product_name, 'STOCK_IN', v_item.quantity,
          'Restored from Cancelled Bill #' || v_invoice.invoice_number, 'CANCELLED_BILL', v_invoice.id, p_staff_name
        );
      END IF;
    END LOOP;

    -- Reverse customer balances & ledger
    IF v_invoice.customer_id IS NOT NULL THEN
      SELECT * INTO v_cust FROM public.customers WHERE id = v_invoice.customer_id FOR UPDATE;
      IF FOUND THEN
        v_new_purchases := GREATEST(0, COALESCE(v_cust.total_purchases, 0) - v_invoice.total);
        v_new_paid := GREATEST(0, COALESCE(v_cust.total_paid, 0) - v_invoice.paid_amount);
        v_new_outstanding := GREATEST(0, COALESCE(v_cust.current_outstanding, 0) - v_invoice.credit_amount);

        UPDATE public.customers
        SET total_purchases = v_new_purchases,
            total_paid = v_new_paid,
            current_outstanding = v_new_outstanding,
            updated_at = NOW()
        WHERE id = v_invoice.customer_id;

        IF v_invoice.credit_amount > 0 THEN
          INSERT INTO public.customer_ledger (
            customer_id, type, amount, balance, reference_type, reference_id, description, created_by
          ) VALUES (
            v_invoice.customer_id, 'CANCELLED_SALE', -v_invoice.credit_amount, v_new_outstanding,
            'INVOICE', v_invoice.id::text, 'Credit Reversal — Cancelled Bill #' || v_invoice.invoice_number, p_staff_name
          );
        END IF;
      END IF;
    END IF;
  END IF;

  -- 3. Update invoice status to CANCELLED
  UPDATE public.invoices
  SET status = 'CANCELLED',
      cancelled_by = p_staff_name,
      cancelled_at = NOW(),
      cancellation_reason = p_reason,
      updated_at = NOW()
  WHERE id = p_invoice_id;

  RETURN jsonb_build_object(
    'success', true,
    'status', 'CANCELLED',
    'invoice_number', v_invoice.invoice_number
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
