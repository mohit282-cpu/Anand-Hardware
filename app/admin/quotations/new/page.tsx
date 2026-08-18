'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Trash2, ArrowLeft, Save, FileSpreadsheet, Calculator } from 'lucide-react';
import { getProducts, createQuotation } from '@/lib/firestore/services';
import { Product, QuotationItem } from '@/types';
import { useAuth } from '@/components/auth/AuthProvider';

function NewQuotationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userProfile } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Customer State
  const [customerName, setCustomerName] = useState(searchParams.get('customerName') || '');
  const [customerPhone, setCustomerPhone] = useState(searchParams.get('phone') || '');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerCompany, setCustomerCompany] = useState(searchParams.get('company') || '');
  const [customerAddress, setCustomerAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Items State
  const [items, setItems] = useState<QuotationItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [tax, setTax] = useState<number>(13); // Default 13% VAT in Nepal

  useEffect(() => {
    async function init() {
      try {
        const prodData = await getProducts({ onlyActive: true });
        setProducts(prodData);

        // Pre-fill initial item if passed from Lead CRM
        const initialProdName = searchParams.get('productName');
        const initialQty = Number(searchParams.get('quantity')) || 1;

        if (initialProdName) {
          const matched = prodData.find(p => p.name.toLowerCase() === initialProdName.toLowerCase());
          if (matched) {
            setItems([{
              productId: matched.id,
              productName: matched.name,
              sku: matched.sku,
              quantity: initialQty,
              unit: matched.unit,
              unitPrice: matched.price,
              subtotal: matched.price * initialQty,
            }]);
          } else {
            setItems([{
              productId: 'custom',
              productName: initialProdName,
              sku: 'CUSTOM',
              quantity: initialQty,
              unit: 'Piece',
              unitPrice: 100,
              subtotal: 100 * initialQty,
            }]);
          }
        } else if (prodData.length > 0) {
          // Add default first item row
          const p = prodData[0];
          setItems([{
            productId: p.id,
            productName: p.name,
            sku: p.sku,
            quantity: 1,
            unit: p.unit,
            unitPrice: p.price,
            subtotal: p.price,
          }]);
        }
      } catch (err) {
        console.error('Failed to load products for quotation:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [searchParams]);

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

  // Calculations
  const calculatedSubtotal = items.reduce((acc, curr) => acc + (Number(curr.subtotal) || 0), 0);
  const safeDiscount = Math.max(0, Number(discount) || 0);
  const taxableAmount = Math.max(0, calculatedSubtotal - safeDiscount);
  const safeTaxPercent = Math.max(0, Number(tax) || 0);
  const calculatedTaxAmount = (taxableAmount * safeTaxPercent) / 100;
  const calculatedTotal = taxableAmount + calculatedTaxAmount;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      alert('Please fill in customer name and phone number.');
      return;
    }
    if (items.length === 0) {
      alert('Please add at least one item to the quotation.');
      return;
    }

    setSaving(true);
    try {
      const newId = await createQuotation({
        customer: {
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
        status: 'DRAFT',
        notes,
        createdBy: userProfile?.displayName || userProfile?.email || 'Admin Staff',
      });
      router.push(`/admin/quotations/${newId}`);
    } catch (err: any) {
      console.error('Failed to create quotation:', err);
      alert(err.message || 'Failed to create quotation.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading quotation builder...</div>;
  }

  return (
    <form onSubmit={handleSave} className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Top Header */}
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
            <h1 className="text-2xl font-black text-navy-950">Create New Quotation</h1>
            <p className="text-xs text-slate-500">Generate an official pricing document for Anand Hardware clients.</p>
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Generating...' : 'Save & View Quotation'}</span>
        </button>
      </div>

      {/* Customer Details Box */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-navy-950 uppercase tracking-wider">Customer Details</h2>
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
              placeholder="e.g. Ramesh Shrestha"
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Firm Name</label>
            <input
              type="text"
              value={customerCompany}
              onChange={(e) => setCustomerCompany(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              placeholder="Shrestha Builders"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              placeholder="ramesh@example.com"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Delivery Site / Address</label>
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
          <h2 className="text-sm font-bold text-navy-950 uppercase tracking-wider">Quotation Line Items</h2>
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
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-3 items-center p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
              {/* Product Selector */}
              <div className="col-span-12 sm:col-span-5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Select Hardware Item</label>
                <select
                  value={item.productId}
                  onChange={(e) => handleProductSelect(index, e.target.value)}
                  className="w-full py-1.5 px-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku || 'N/A'}) — Rs. {p.price}/{p.unit}
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
                  className="w-full py-1.5 px-2 bg-white border border-slate-200 rounded-lg text-xs font-bold"
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
          ))}
        </div>
      </div>

      {/* RECALCULATION & SUMMARY PANEL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Notes */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-navy-950 uppercase tracking-wider">Terms & Notes</h3>
          <textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
            placeholder="e.g. Price valid for 15 days. Delivery charges included within Biratnagar city limits."
          />
        </div>

        {/* Totals Recalculation Card */}
        <div className="bg-navy-950 text-white rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-navy-900 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Calculation Summary</span>
            <Calculator className="w-4 h-4 text-brand-500" />
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Items Subtotal:</span>
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
          </div>
        </div>
      </div>
    </form>
  );
}

export default function NewQuotationPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading quotation builder...</div>}>
      <NewQuotationContent />
    </React.Suspense>
  );
}
