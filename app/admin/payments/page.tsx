'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CreditCard, Plus, Search, Eye, RefreshCw, Printer, CheckCircle2 } from 'lucide-react';
import { getPayments, getCustomers, recordPayment } from '@/lib/supabase/services';
import { Payment, Customer, PaymentMethod } from '@/types';
import { useAuth } from '@/components/auth/AuthProvider';

export default function PaymentsPage() {
  const { userProfile } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Record Payment Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [note, setNote] = useState('');
  const [recording, setRecording] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [payData, custData] = await Promise.all([
        getPayments(),
        getCustomers(),
      ]);
      setPayments(payData);
      setCustomers(custData);
    } catch (err) {
      console.error('Error loading payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedCust = customers.find(c => c.id === selectedCustomerId);

  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCust || amount <= 0) return;

    setRecording(true);
    try {
      const newReceiptId = await recordPayment({
        customerId: selectedCust.id,
        customerName: selectedCust.name,
        customerPhone: selectedCust.phone,
        amount,
        paymentMethod,
        note,
        createdBy: userProfile?.displayName || userProfile?.email || 'Admin Staff',
      });

      alert('Payment recorded successfully!');
      setIsModalOpen(false);
      setSelectedCustomerId('');
      setAmount(0);
      setNote('');
      await loadData();
    } catch (err: any) {
      console.error('Failed to record payment:', err);
      alert(err.message || 'Failed to record payment.');
    } finally {
      setRecording(false);
    }
  };

  const filteredPayments = payments.filter((p) => {
    if (methodFilter !== 'ALL' && p.paymentMethod !== methodFilter) return false;
    if (categoryFilter !== 'ALL' && (p.paymentCategory || 'SALE_PAYMENT') !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        p.receiptNumber.toLowerCase().includes(q) ||
        p.customerName.toLowerCase().includes(q) ||
        p.customerPhone.toLowerCase().includes(q) ||
        (p.financialYear && p.financialYear.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-navy-950">Payment Collection Records</h1>
          <p className="text-xs text-slate-500 mt-1">Unified payment log covering bill payments, credit collections, and advance balances.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2 self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Record New Payment</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by receipt #, customer name, phone..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="SALE_PAYMENT">Sale Payments</option>
            <option value="CREDIT_PAYMENT">Credit Payments</option>
            <option value="ADVANCE_PAYMENT">Advance Payments</option>
            <option value="REFUND">Refunds</option>
            <option value="ADJUSTMENT">Adjustments</option>
          </select>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:outline-none"
          >
            <option value="ALL">All Payment Methods</option>
            <option value="CASH">Cash</option>
            <option value="BANK_TRANSFER">Bank Transfer / Fonepay</option>
            <option value="CHEQUE">Cheque</option>
            <option value="CARD">Card</option>
            <option value="OTHER">Other</option>
          </select>
          <button onClick={loadData} className="p-2 text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* PAYMENTS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading payment receipts...</div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-3">
            <CreditCard className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-bold text-navy-950 text-sm">No Payment Records Found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-3.5 px-4">Receipt Number</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4 text-center">Category</th>
                  <th className="py-3.5 px-4 text-center">Method</th>
                  <th className="py-3.5 px-4 text-right">Amount Received (NPR)</th>
                  <th className="py-3.5 px-4 text-right">Remaining Udhar</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredPayments.map((p) => {
                  const category = p.paymentCategory || 'SALE_PAYMENT';
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-navy-950">
                        <Link href={`/admin/payments/${p.id}`} className="hover:text-emerald-600">
                          {p.receiptNumber}
                        </Link>
                        <span className="text-[10px] text-slate-400 block font-sans">
                          {new Date(p.createdAt).toLocaleDateString()} • FY {p.financialYear || 'Current'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-navy-950 block">{p.customerName}</span>
                        <span className="text-[11px] text-slate-500">{p.customerPhone}</span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border ${
                          category === 'SALE_PAYMENT' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          category === 'CREDIT_PAYMENT' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          category === 'ADVANCE_PAYMENT' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {category.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                          {p.paymentMethod}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-black text-emerald-700 text-sm">
                        Rs. {p.amount.toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-amber-700">
                        Rs. {p.remainingOutstanding.toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/admin/payments/${p.id}`}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-navy-950 text-xs font-bold rounded-lg transition inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Print Receipt</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-navy-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-navy-950">Record Customer Payment</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
            </div>

            <form onSubmit={handleRecordSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Select Customer <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => {
                    setSelectedCustomerId(e.target.value);
                    const matched = customers.find(c => c.id === e.target.value);
                    if (matched) setAmount(matched.currentOutstanding || 0);
                  }}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:bg-white focus:outline-none"
                  required
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.filter(c => (c.currentOutstanding || 0) > 0).map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone}) — Outstanding: Rs. {(c.currentOutstanding || 0).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              {selectedCust && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex justify-between font-bold">
                  <span className="text-slate-600">Current Outstanding Udhar:</span>
                  <span className="text-amber-700">Rs. {(selectedCust.currentOutstanding || 0).toLocaleString()}</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Payment Amount Received (NPR) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedCust?.currentOutstanding || 99999999}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:bg-white focus:outline-none"
                >
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer / Fonepay</option>
                  <option value="CHEQUE">Bank Cheque</option>
                  <option value="CARD">Debit / Credit Card</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reference / Note</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  placeholder="e.g. Fonepay Txn ID / Cheque #"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={recording}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow disabled:opacity-50"
                >
                  {recording ? 'Processing...' : 'Save & Print Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
