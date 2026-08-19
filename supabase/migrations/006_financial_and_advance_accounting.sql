-- ANAND HARDWARE — Migration 006: Complete Financial, Advance & Credit Payment Architecture
-- =========================================================================================

-- 1. ADD ADVANCE BALANCE & INVOICE ADVANCE COLUMNS
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS advance_balance NUMERIC(12,2) NOT NULL DEFAULT 0.00;

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS advance_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS advance_used NUMERIC(12,2) NOT NULL DEFAULT 0.00;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS payment_category TEXT NOT NULL DEFAULT 'SALE_PAYMENT';

-- 2. UPDATE LEDGER CONSTRAINTS TO ALLOW ADVANCE TYPES
ALTER TABLE public.customer_ledger
  DROP CONSTRAINT IF EXISTS customer_ledger_type_check;

ALTER TABLE public.customer_ledger
  ADD CONSTRAINT customer_ledger_type_check
  CHECK (type IN ('SALE_CREDIT', 'PAYMENT', 'RETURN', 'ADJUSTMENT', 'CANCELLED_SALE', 'ADVANCE', 'ADVANCE_APPLIED'));


-- 3. ATOMIC INVOICE CONFIRMATION WITH OVERPAYMENT & ADVANCE APPLICATION
CREATE OR REPLACE FUNCTION public.confirm_invoice(p_invoice_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_invoice RECORD;
  v_item RECORD;
  v_prod RECORD;
  v_cust RECORD;
  v_actual_bill_total NUMERIC(12,2);
  v_paid_amount NUMERIC(12,2);
  v_advance_used NUMERIC(12,2);
  v_applied_to_bill NUMERIC(12,2);
  v_excess_advance NUMERIC(12,2) := 0.00;
  v_credit_needed NUMERIC(12,2) := 0.00;
  v_new_purchases NUMERIC(12,2);
  v_new_paid NUMERIC(12,2);
  v_new_outstanding NUMERIC(12,2);
  v_new_advance NUMERIC(12,2);
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

  v_actual_bill_total := v_invoice.total;
  v_paid_amount := v_invoice.paid_amount;
  v_advance_used := COALESCE(v_invoice.advance_used, 0.00);

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

  -- 4. Customer financial ledger processing
  IF v_invoice.customer_id IS NOT NULL THEN
    SELECT * INTO v_cust FROM public.customers WHERE id = v_invoice.customer_id FOR UPDATE;
    IF FOUND THEN
      v_new_advance := COALESCE(v_cust.advance_balance, 0.00);
      v_new_outstanding := COALESCE(v_cust.current_outstanding, 0.00);

      -- Check & deduct advance used
      IF v_advance_used > 0 THEN
        IF v_advance_used > v_new_advance THEN
          RAISE EXCEPTION 'Applied advance (Rs. %) exceeds customer advance balance (Rs. %).', v_advance_used, v_new_advance;
        END IF;
        v_new_advance := v_new_advance - v_advance_used;

        INSERT INTO public.customer_ledger (
          customer_id, type, amount, balance, reference_type, reference_id, description, created_by
        ) VALUES (
          v_invoice.customer_id, 'ADVANCE_APPLIED', v_advance_used, v_new_outstanding,
          'INVOICE', v_invoice.id::text, 'Advance Applied — Bill #' || v_invoice.invoice_number, v_invoice.created_by
        );
      END IF;

      -- Calculate net bill after advance applied
      v_applied_to_bill := GREATEST(0.00, v_actual_bill_total - v_advance_used);

      -- Determine overpayment / credit balance
      IF v_paid_amount >= v_applied_to_bill THEN
        v_excess_advance := v_paid_amount - v_applied_to_bill;
        v_credit_needed := 0.00;
        v_new_advance := v_new_advance + v_excess_advance;
      ELSE
        v_excess_advance := 0.00;
        v_credit_needed := v_applied_to_bill - v_paid_amount;
        v_new_outstanding := v_new_outstanding + v_credit_needed;
      END IF;

      v_new_purchases := COALESCE(v_cust.total_purchases, 0.00) + v_actual_bill_total;
      v_new_paid := COALESCE(v_cust.total_paid, 0.00) + v_paid_amount;

      -- Validate credit limit
      IF v_cust.credit_limit IS NOT NULL AND v_cust.credit_limit > 0 AND v_new_outstanding > v_cust.credit_limit THEN
        RAISE EXCEPTION 'Credit limit exceeded for customer "%". Current: Rs. %, Credit: Rs. %, Limit: Rs. %',
          v_cust.name, v_cust.current_outstanding, v_credit_needed, v_cust.credit_limit;
      END IF;

      -- Update customer balances
      UPDATE public.customers
      SET total_purchases = v_new_purchases,
          total_paid = v_new_paid,
          current_outstanding = v_new_outstanding,
          advance_balance = v_new_advance,
          updated_at = NOW()
      WHERE id = v_invoice.customer_id;

      -- Record Credit Ledger entry if credit generated
      IF v_credit_needed > 0 THEN
        INSERT INTO public.customer_ledger (
          customer_id, type, amount, balance, reference_type, reference_id, description, created_by
        ) VALUES (
          v_invoice.customer_id, 'SALE_CREDIT', v_credit_needed, v_new_outstanding,
          'INVOICE', v_invoice.id::text, 'Credit Purchase — Bill #' || v_invoice.invoice_number, v_invoice.created_by
        );
      END IF;

      -- Record Advance Ledger entry if overpayment generated
      IF v_excess_advance > 0 THEN
        INSERT INTO public.customer_ledger (
          customer_id, type, amount, balance, reference_type, reference_id, description, created_by
        ) VALUES (
          v_invoice.customer_id, 'ADVANCE', -v_excess_advance, v_new_outstanding,
          'INVOICE', v_invoice.id::text, 'Overpayment / Advance Received — Bill #' || v_invoice.invoice_number, v_invoice.created_by
        );
      END IF;
    END IF;
  END IF;

  -- 5. Record Payment Log Entry if paid_amount > 0
  IF v_paid_amount > 0 AND v_invoice.customer_id IS NOT NULL THEN
    v_receipt_seq := public.get_next_sequence_number('payments', v_invoice.financial_year);
    v_receipt_num := 'REC-' || v_invoice.financial_year || '-' || LPAD(v_receipt_seq::text, 4, '0');

    INSERT INTO public.payments (
      receipt_number, financial_year, invoice_id, customer_id, customer_name, customer_phone,
      amount, payment_method, payment_category, previous_outstanding, remaining_outstanding, note, created_by
    ) VALUES (
      v_receipt_num, v_invoice.financial_year, v_invoice.id, v_invoice.customer_id,
      COALESCE(v_cust.name, 'Customer'), COALESCE(v_cust.phone, ''),
      v_paid_amount, 'CASH', 'SALE_PAYMENT',
      COALESCE(v_cust.current_outstanding, 0) - v_credit_needed, v_new_outstanding,
      'Sale Payment for Bill #' || v_invoice.invoice_number, v_invoice.created_by
    );
  END IF;

  -- 6. Set final invoice status
  IF v_credit_needed > 0 THEN
    v_final_status := CASE WHEN v_paid_amount > 0 THEN 'PARTIALLY_PAID' ELSE 'CREDIT' END;
  ELSE
    v_final_status := 'PAID';
  END IF;

  UPDATE public.invoices
  SET status = v_final_status,
      paid_amount = v_paid_amount,
      credit_amount = v_credit_needed,
      advance_amount = v_excess_advance,
      updated_at = NOW()
  WHERE id = p_invoice_id;

  RETURN jsonb_build_object(
    'success', true,
    'status', v_final_status,
    'invoice_number', v_invoice.invoice_number,
    'credit_amount', v_credit_needed,
    'advance_amount', v_excess_advance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. ATOMIC RECEIVE CREDIT PAYMENT RPC WITH OVERPAYMENT TO ADVANCE
CREATE OR REPLACE FUNCTION public.receive_credit_payment(
  p_customer_id UUID,
  p_amount NUMERIC(12,2),
  p_payment_method TEXT,
  p_note TEXT,
  p_staff_name TEXT,
  p_invoice_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_cust RECORD;
  v_prev_outstanding NUMERIC(12,2);
  v_payment_for_debt NUMERIC(12,2);
  v_excess_to_advance NUMERIC(12,2) := 0.00;
  v_new_outstanding NUMERIC(12,2);
  v_new_advance NUMERIC(12,2);
  v_new_total_paid NUMERIC(12,2);
  v_receipt_seq INT;
  v_receipt_num TEXT;
  v_payment_id UUID;
  v_fy_key TEXT;
  v_fy_string TEXT;
BEGIN
  -- 1. Lock & fetch customer row
  SELECT * INTO v_cust FROM public.customers WHERE id = p_customer_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Customer ID % not found.', p_customer_id;
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be greater than zero.';
  END IF;

  v_prev_outstanding := COALESCE(v_cust.current_outstanding, 0.00);

  IF p_amount > v_prev_outstanding THEN
    v_payment_for_debt := v_prev_outstanding;
    v_excess_to_advance := p_amount - v_prev_outstanding;
    v_new_outstanding := 0.00;
  ELSE
    v_payment_for_debt := p_amount;
    v_excess_to_advance := 0.00;
    v_new_outstanding := v_prev_outstanding - p_amount;
  END IF;

  v_new_advance := COALESCE(v_cust.advance_balance, 0.00) + v_excess_to_advance;
  v_new_total_paid := COALESCE(v_cust.total_paid, 0.00) + p_amount;

  -- 2. Generate Receipt Sequence (REC-2082/83-0005)
  v_fy_string := '2082/83';
  v_fy_key := '2082-83';
  v_receipt_seq := public.get_next_sequence_number('payments', v_fy_key);
  v_receipt_num := 'REC-' || v_fy_string || '-' || LPAD(v_receipt_seq::text, 4, '0');

  -- 3. Update customer totals & balances
  UPDATE public.customers
  SET total_paid = v_new_total_paid,
      current_outstanding = v_new_outstanding,
      advance_balance = v_new_advance,
      updated_at = NOW()
  WHERE id = p_customer_id;

  -- 4. Insert payment record into Payment Log
  INSERT INTO public.payments (
    receipt_number, financial_year, invoice_id, customer_id, customer_name, customer_phone,
    amount, payment_method, payment_category, previous_outstanding, remaining_outstanding, note, created_by
  ) VALUES (
    v_receipt_num, v_fy_string, p_invoice_id, p_customer_id,
    v_cust.name, v_cust.phone,
    p_amount, p_payment_method, 'CREDIT_PAYMENT', v_prev_outstanding, v_new_outstanding,
    COALESCE(p_note, ''), p_staff_name
  ) RETURNING id INTO v_payment_id;

  -- 5. Insert ledger entry for credit payment
  INSERT INTO public.customer_ledger (
    customer_id, type, amount, balance, reference_type, reference_id, description, created_by
  ) VALUES (
    p_customer_id, 'PAYMENT', -v_payment_for_debt, v_new_outstanding,
    'PAYMENT', v_payment_id::text,
    'Credit Payment Received (' || p_payment_method || ') — Receipt #' || v_receipt_num, p_staff_name
  );

  -- 6. Insert ledger entry for excess advance if overpayment occurred
  IF v_excess_to_advance > 0 THEN
    INSERT INTO public.customer_ledger (
      customer_id, type, amount, balance, reference_type, reference_id, description, created_by
    ) VALUES (
      p_customer_id, 'ADVANCE', -v_excess_to_advance, v_new_outstanding,
      'PAYMENT', v_payment_id::text,
      'Excess Payment to Advance Balance — Receipt #' || v_receipt_num, p_staff_name
    );
  END IF;

  -- 7. Transition paid credit invoices to PAID status when debt is cleared
  IF p_invoice_id IS NOT NULL AND v_new_outstanding = 0 THEN
    UPDATE public.invoices
    SET status = 'PAID',
        paid_amount = total,
        credit_amount = 0.00,
        updated_at = NOW()
    WHERE id = p_invoice_id;
  ELSIF v_new_outstanding = 0 THEN
    UPDATE public.invoices
    SET status = 'PAID',
        paid_amount = total,
        credit_amount = 0.00,
        updated_at = NOW()
    WHERE customer_id = p_customer_id AND status IN ('CREDIT', 'PARTIALLY_PAID');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'payment_id', v_payment_id,
    'receipt_number', v_receipt_num,
    'previous_outstanding', v_prev_outstanding,
    'remaining_outstanding', v_new_outstanding,
    'excess_advance', v_excess_to_advance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
