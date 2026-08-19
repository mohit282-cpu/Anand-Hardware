-- ANAND HARDWARE — Walk-in Debtor & Credit Payment RPC Migration
-- ====================================================================

-- 1. STORED PROCEDURE: RECEIVE CREDIT PAYMENT (ATOMIC)
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
  v_new_outstanding NUMERIC(12,2);
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

  v_prev_outstanding := COALESCE(v_cust.current_outstanding, 0);

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be greater than zero.';
  END IF;

  IF p_amount > v_prev_outstanding THEN
    RAISE EXCEPTION 'Payment amount (Rs. %) cannot exceed outstanding balance (Rs. %).', p_amount, v_prev_outstanding;
  END IF;

  v_new_outstanding := v_prev_outstanding - p_amount;
  v_new_total_paid := COALESCE(v_cust.total_paid, 0) + p_amount;

  -- 2. Generate Receipt Sequence (e.g. REC-2082/83-0005)
  v_fy_string := '2082/83';
  v_fy_key := '2082-83';
  v_receipt_seq := public.get_next_sequence_number('payments', v_fy_key);
  v_receipt_num := 'REC-' || v_fy_string || '-' || LPAD(v_receipt_seq::text, 4, '0');

  -- 3. Update customer totals & outstanding balance
  UPDATE public.customers
  SET total_paid = v_new_total_paid,
      current_outstanding = v_new_outstanding,
      updated_at = NOW()
  WHERE id = p_customer_id;

  -- 4. Insert payment record
  INSERT INTO public.payments (
    receipt_number, financial_year, invoice_id, customer_id, customer_name, customer_phone,
    amount, payment_method, previous_outstanding, remaining_outstanding, note, created_by
  ) VALUES (
    v_receipt_num, v_fy_string, p_invoice_id, p_customer_id,
    v_cust.name, v_cust.phone,
    p_amount, p_payment_method, v_prev_outstanding, v_new_outstanding,
    COALESCE(p_note, ''), p_staff_name
  ) RETURNING id INTO v_payment_id;

  -- 5. Insert ledger entry
  INSERT INTO public.customer_ledger (
    customer_id, type, amount, balance, reference_type, reference_id, description, created_by
  ) VALUES (
    p_customer_id, 'PAYMENT', -p_amount, v_new_outstanding,
    'PAYMENT', v_payment_id::text,
    'Payment Received (' || p_payment_method || ') — Receipt #' || v_receipt_num, p_staff_name
  );

  RETURN jsonb_build_object(
    'success', true,
    'payment_id', v_payment_id,
    'receipt_number', v_receipt_num,
    'previous_outstanding', v_prev_outstanding,
    'remaining_outstanding', v_new_outstanding
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
