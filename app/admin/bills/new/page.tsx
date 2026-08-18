'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Trash2, ArrowLeft, Save, CheckCircle2, Calculator, Search, UserCheck } from 'lucide-react';
import { getProducts, getCustomers, createInvoice, getQuotationById } from '@/lib/supabase/services';
import { Product, Customer, QuotationItem, PaymentType } from '@/types';
import { useAuth } from '@/components/auth/AuthProvider';

function NewBillContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userProfile } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Customer State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerCompany, setCustomerCompany] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Items State
  const [items, setItems] = useState<QuotationItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [tax, setTax] = useState<number>(13); // Default 13% VAT in Nepal

  // Payment State
  const [paymentType, setPaymentType] = useState<PaymentType>('FULL_PAYMENT');
  const [paidAmountInput, setPaidAmountInput] = useState<number>(0);

  useEffect(() => {
    async function init() {
      try {
        const [prodData, custData] = await Promise.all([
          getProducts({ onlyActive: true }),
          getCustomers(),
        ]);
        setProducts(prodData);
        setCustomers(custData);

        // Pre-fill from Quotation if converted
        const fromQuotationId = searchParams.get('fromQuotation');
        if (fromQuotationId) {
          const q = await getQuotationById(fromQuotationId);
          if (q) {
            setCustomerName(q.customer.name);
            setCustomerPhone(q.customer.phone);
            setCustomerEmail(q.customer.email || '');
            setCustomerCompany(q.customer.company || '');
            setCustomerAddress(q.customer.address || '');
            setItems(q.items);
            setDiscount(q.discount);
            // Pre-fill default row if empty
            setItems(currentItems => {
              if (currentItems.length === 0 && prodData.length > 0) {
                const p = prodData[0];
                return [{
                  productId: p.id,
                  productName: p.name,
                  sku: p.sku,
                  quantity: 1,
                  unit: p.unit,
                  unitPrice: p.price,
                  subtotal: p.price,
                }];
              }
              return currentItems;
            });
          }
        }
      } catch (err) {
        console.error('Failed to initialize bill form:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [searchParams]);

  const handleCustomerSelect = (id: string) => {
    setSelectedCustomerId(id);
    const c = customers.find(item => item.id === id);
    if (c) {
      setCustomerName(c.name);
      setCustomerPhone(c.phone);
      setCustomerEmail(c.email || '');
      setCustomerCompany(c.company || '');
      setCustomerAddress(c.address || '');
    }
  };

  const handleProductSelect = (index: number, productId: string) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    setItems(prev => {
      const next = [...prev];
      next[index] = {
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        quantity: next[index]?.quantity || 1,
        unit: prod.unit,
        unitPrice: prod.price,
        subtotal: prod.price * (next[index]?.quantity || 1),
      };
      return next;
    });
  };

  const handleItemChange = (index: number, field: keyof QuotationItem, value: any) => {
    setItems(prev => {
      const next = [...prev];
      const current = { ...next[index], [field]: value };
      const qty = Number(current.quantity) || 0;
      const price = Number(current.unitPrice) || 0;
      current.subtotal = qty * price;
      next[index] = current;
      return next;
    });
  };

  const addItemRow = () => {
    if (products.length > 0) {
      const p = products[0];
      setItems(prev => [
        ...prev,
        {
          productId: p.id,
          productName: p.name,
          sku: p.sku,
          quantity: 1,
          unit: p.unit,
          unitPrice: p.price,
          subtotal: p.price,
        },
      ]);
    }
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Financial Calculations
  const calculatedSubtotal = items.reduce((acc, curr) => acc + (Number(curr.subtotal) || 0), 0);
  const safeDiscount = Math.max(0, Number(discount) || 0);
  const taxableAmount = Math.max(0, calculatedSubtotal - safeDiscount);
  const safeTaxPercent = Math.max(0, Number(tax) || 0);
  const calculatedTaxAmount = (taxableAmount * safeTaxPercent) / 100;
  const calculatedTotal = taxableAmount + calculatedTaxAmount;

  // Determine Paid & Credit Amounts based on Payment Type
  let finalPaidAmount = 0;
  let finalCreditAmount = 0;

  if (paymentType === 'FULL_PAYMENT') {
    finalPaidAmount = calculatedTotal;
    finalCreditAmount = 0;
  } else if (paymentType === 'CREDIT') {
    finalPaidAmount = 0;
    finalCreditAmount = calculatedTotal;
  } else if (paymentType === 'PARTIAL_PAYMENT') {
    finalPaidAmount = Math.min(calculatedTotal, Math.max(0, paidAmountInput));
    finalCreditAmount = Math.max(0, calculatedTotal - finalPaidAmount);
  }

  const handleSaveInvoice = async (confirmNow: boolean) => {
    if (!customerName.trim() || !customerPhone.trim()) {
      alert('Please enter customer name and phone number.');
      return;
    }
    if (items.length === 0) {
      alert('Please add at least one line item.');
      return;
    }

    setSaving(true);
    try {
      const newId = await createInvoice({
        customerId: selectedCustomerId,
        customer: {
          id: selectedCustomerId,
          name: customerName,
          phone: customerPhone,
          email: customerEmail,
          company: customerCompany,
          address: customerAddress,
        },
        items,
        subtotal: calculatedSubtotal,
        discount: safeDiscount,
        tax: safeTaxPercent,
        total: calculatedTotal,
        paidAmount: finalPaidAmount,
        creditAmount: finalCreditAmount,
        paymentType,
        status: confirmNow ? (finalCreditAmount > 0 ? 'CREDIT' : 'PAID') : 'DRAFT',
        notes,
        confirmImmediately: confirmNow,
        createdBy: userProfile?.displayName || userProfile?.email || 'Admin Staff',
      });

      alert(confirmNow ? 'Bill confirmed and stock updated!' : 'Draft bill saved successfully.');
      router.push(`/admin/bills/${newId}`);
    } catch (err: any) {
      console.error('Failed to save invoice:', err);
      alert(err.message || 'Failed to create bill.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading bill generator...</div>;
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 text-slate-600 hover:bg-white rounded-xl border border-slate-200"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-navy-950">Create New Bill / POS</h1>
            <p className="text-xs text-slate-500">Generate sales invoice with instant inventory stock-out and credit tracking.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSaveInvoice(false)}
            className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => handleSaveInvoice(true)}
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{saving ? 'Processing...' : 'Confirm Bill & Release Stock'}</span>
          </button>
        </div>
      </div>

      {/* Customer Selection Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-navy-950 uppercase tracking-wider">Customer Information</h2>
          {customers.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Select Existing:</span>
              <select
                value={selectedCustomerId}
                onChange={(e) => handleCustomerSelect(e.target.value)}
                className="py-1 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
              >
                <option value="">-- Choose Customer --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone}) {c.currentOutstanding ? `— Outstanding: Rs. ${c.currentOutstanding}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Customer Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              placeholder="e.g. Ram Shrestha"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Phone Number <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              placeholder="9801234567"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Firm</label>
            <input
              type="text"
              value={customerCompany}
              onChange={(e) => setCustomerCompany(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              placeholder="Nepal Builders P. Ltd."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              placeholder="ram@example.com"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Delivery / Site Address</label>
            <input
              type="text"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              placeholder="Site location in Biratnagar / Morang"
            />
          </div>
        </div>
      </div>

      {/* LINE ITEMS BUILDER */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-navy-950 uppercase tracking-wider">Billed Line Items</h2>
          <button
            type="button"
            onClick={addItemRow}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-navy-950 text-xs font-bold rounded-lg transition flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item Row</span>
          </button>
        </div>

        <div className="space-y-3">
          {items.map((item, index) => {
            const matchedProd = products.find(p => p.id === item.productId);
            const stockAvailable = matchedProd ? matchedProd.stock : null;
            const isStockShort = stockAvailable !== null && item.quantity > stockAvailable;

            return (
              <div key={index} className={`grid grid-cols-12 gap-3 items-center p-3 rounded-2xl border text-xs ${isStockShort ? 'bg-rose-50/50 border-rose-300' : 'bg-slate-50 border-slate-200'}`}>
                {/* Product Selector */}
                <div className="col-span-12 sm:col-span-5">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Hardware Product</label>
                    {stockAvailable !== null && (
                      <span className={`text-[10px] font-bold ${isStockShort ? 'text-rose-600' : 'text-emerald-700'}`}>
                        Avail: {stockAvailable} {item.unit}
                      </span>
                    )}
                  </div>
                  <select
                    value={item.productId}
                    onChange={(e) => handleProductSelect(index, e.target.value)}
                    className="w-full py-1.5 px-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku || 'N/A'}) — Rs. {p.price}/{p.unit} (Stock: {p.stock})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity */}
                <div className="col-span-4 sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    className={`w-full py-1.5 px-2 bg-white border rounded-lg text-xs font-bold ${isStockShort ? 'border-rose-400 text-rose-700' : 'border-slate-200'}`}
                  />
                </div>

                {/* Unit Price */}
                <div className="col-span-4 sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Unit Price (NPR)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                    className="w-full py-1.5 px-2 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                  />
                </div>

                {/* Subtotal */}
                <div className="col-span-3 sm:col-span-2 text-right">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Subtotal</label>
                  <span className="font-black text-navy-950 block py-1.5">
                    Rs. {item.subtotal.toLocaleString()}
                  </span>
                </div>

                {/* Delete Row */}
                <div className="col-span-1 text-right">
                  <button
                    type="button"
                    onClick={() => removeItemRow(index)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PAYMENT & TOTALS PANEL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Payment Type Options */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-navy-950 uppercase tracking-wider">Payment Breakdown</h3>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setPaymentType('FULL_PAYMENT')}
              className={`py-2 px-3 text-xs font-bold rounded-xl border transition ${paymentType === 'FULL_PAYMENT' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-700 border-slate-200'}`}
            >
              Full Cash
            </button>
            <button
              type="button"
              onClick={() => setPaymentType('CREDIT')}
              className={`py-2 px-3 text-xs font-bold rounded-xl border transition ${paymentType === 'CREDIT' ? 'bg-amber-600 text-white border-amber-600' : 'bg-slate-50 text-slate-700 border-slate-200'}`}
            >
              Full Udhar
            </button>
            <button
              type="button"
              onClick={() => setPaymentType('PARTIAL_PAYMENT')}
              className={`py-2 px-3 text-xs font-bold rounded-xl border transition ${paymentType === 'PARTIAL_PAYMENT' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-700 border-slate-200'}`}
            >
              Partial Paid
            </button>
          </div>

          {paymentType === 'PARTIAL_PAYMENT' && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700">Immediate Paid Amount (NPR)</label>
              <input
                type="number"
                min="0"
                max={calculatedTotal}
                value={paidAmountInput}
                onChange={(e) => setPaidAmountInput(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white"
                placeholder="Enter paid amount..."
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Billing Notes / Terms</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
              placeholder="e.g. Delivery via Anand Hardware truck to site."
            />
          </div>
        </div>

        {/* Grand Total Calculation Card */}
        <div className="bg-navy-950 text-white rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-navy-900 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Invoice Calculation</span>
            <Calculator className="w-4 h-4 text-brand-500" />
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Subtotal:</span>
              <span className="font-bold text-white">Rs. {calculatedSubtotal.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-300">Discount Amount (NPR):</span>
              <input
                type="number"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-28 px-2 py-1 bg-navy-900 border border-slate-700 rounded text-right font-bold text-white text-xs"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-300">VAT / Tax (%):</span>
              <input
                type="number"
                min="0"
                value={tax}
                onChange={(e) => setTax(Number(e.target.value))}
                className="w-28 px-2 py-1 bg-navy-900 border border-slate-700 rounded text-right font-bold text-white text-xs"
              />
            </div>

            <div className="flex justify-between text-slate-300">
              <span>VAT Amount ({safeTaxPercent}%):</span>
              <span className="font-bold text-white">Rs. {calculatedTaxAmount.toLocaleString()}</span>
            </div>

            <div className="pt-3 border-t border-navy-900 flex justify-between items-baseline">
              <span className="text-sm font-bold text-slate-200 uppercase">Grand Total:</span>
              <span className="text-2xl font-black text-brand-400">
                Rs. {calculatedTotal.toLocaleString()}
              </span>
            </div>

            <div className="pt-2 border-t border-navy-900/60 text-[11px] space-y-1">
              <div className="flex justify-between text-emerald-400 font-bold">
                <span>Immediate Paid:</span>
                <span>Rs. {finalPaidAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-amber-400 font-bold">
                <span>Remaining Udhar (Credit):</span>
                <span>Rs. {finalCreditAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewBillPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading bill generator...</div>}>
      <NewBillContent />
    </React.Suspense>
  );
}
