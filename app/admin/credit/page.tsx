'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Wallet, Search, Plus, CreditCard, RefreshCw, AlertTriangle, CheckCircle2, History, ArrowRight } from 'lucide-react';
import { getCustomers, recordPayment } from '@/lib/supabase/services';
import { Customer, PaymentMethod } from '@/types';
import { useAuth } from '@/components/auth/AuthProvider';

export default function CreditManagementPage() {
  const { userProfile } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Payment Modal State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [paymentNote, setPaymentNote] = useState('');
  const [recording, setRecording] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error('Error loading customer credit:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openPaymentModal = (c: Customer) => {
    setSelectedCustomer(c);
    setPaymentAmount(c.currentOutstanding || 0);
    setPaymentMethod('CASH');
    setPaymentNote('');
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || paymentAmount <= 0) return;

    if (paymentAmount > (selectedCustomer.currentOutstanding || 0)) {
      alert(`Payment amount (NPR ${paymentAmount.toLocaleString()}) cannot exceed outstanding balance (NPR ${(selectedCustomer.currentOutstanding || 0).toLocaleString()}).`);
      return;
    }

    setRecording(true);
    try {
      const receiptId = await recordPayment({
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        customerPhone: selectedCustomer.phone,
        amount: paymentAmount,
        paymentMethod,
        note: paymentNote,
        createdBy: userProfile?.displayName || userProfile?.email || 'Admin Staff',
      });

      alert('Payment recorded successfully!');
      setSelectedCustomer(null);
      await loadData();
    } catch (err: any) {
      console.error('Failed to record payment:', err);
      alert(err.message || 'Failed to record payment.');
    } finally {
      setRecording(false);
    }
  };

  const creditCustomers = customers.filter(c => (c.currentOutstanding || 0) > 0);
  const totalOutstanding = customers.reduce((acc, c) => acc + (c.currentOutstanding || 0), 0);
  const totalPurchases = customers.reduce((acc, c) => acc + (c.totalPurchases || 0), 0);
  const totalPaid = customers.reduce((acc, c) => acc + (c.totalPaid || 0), 0);

  const filteredCustomers = customers.filter(c => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        (c.company && c.company.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-navy-950">Credit / Udhar Management</h1>
          <p className="text-xs text-slate-500 mt-1">Track outstanding customer balances, payment receipts, and credit limits in Biratnagar.</p>
        </div>

        <button
          onClick={loadData}
          className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-xl transition flex items-center gap-1.5 self-start"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* KPI METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-navy-950 text-white rounded-3xl p-5 shadow-lg border border-navy-900">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Outstanding Udhar</span>
          <p className="text-2xl font-black text-amber-400 mt-1">NPR {totalOutstanding.toLocaleString()}</p>
          <span className="text-[11px] text-slate-400 mt-2 block">{creditCustomers.length} customers with balance</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Customer Sales</span>
          <p className="text-2xl font-black text-navy-950 mt-1">NPR {totalPurchases.toLocaleString()}</p>
          <span className="text-[11px] text-slate-500 mt-2 block">All time billed amount</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Payments Collected</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">NPR {totalPaid.toLocaleString()}</p>
          <span className="text-[11px] text-slate-500 mt-2 block">Cash / Transfers received</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Credit Collection Rate</span>
          <p className="text-2xl font-black text-brand-600 mt-1">
            {totalPurchases > 0 ? `${Math.round((totalPaid / totalPurchases) * 100)}%` : '100%'}
          </p>
          <span className="text-[11px] text-slate-500 mt-2 block">Percentage collected</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search credit customer by name or phone..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
        </div>
      </div>

      {/* CUSTOMERS CREDIT TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading credit ledger data...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-3">
            <Wallet className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-bold text-navy-950 text-sm">No Customer Credit Records Found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4 text-right">Total Billed</th>
                  <th className="py-3.5 px-4 text-right">Total Paid</th>
                  <th className="py-3.5 px-4 text-right">Outstanding Udhar</th>
                  <th className="py-3.5 px-4 text-center">Credit Limit</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredCustomers.map((c) => {
                  const outstanding = c.currentOutstanding || 0;
                  const creditLimit = c.creditLimit || 0;
                  const isLimitExceeded = creditLimit > 0 && outstanding > creditLimit;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-navy-950 block">{c.name}</span>
                        <span className="text-[11px] text-slate-500">{c.phone}</span>
                        {c.company && <span className="text-[10px] text-slate-400 block">{c.company}</span>}
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-slate-700">
                        Rs. {(c.totalPurchases || 0).toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-emerald-700">
                        Rs. {(c.totalPaid || 0).toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4 text-right font-black text-amber-700 text-sm">
                        Rs. {outstanding.toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4 text-center font-semibold">
                        {creditLimit > 0 ? (
                          <span className={`px-2 py-1 rounded text-[10px] ${isLimitExceeded ? 'bg-rose-100 text-rose-800 font-bold border border-rose-200' : 'bg-slate-100 text-slate-700'}`}>
                            Rs. {creditLimit.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">No Limit</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-2">
                        <Link
                          href={`/admin/customers/${c.id}/ledger`}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-navy-950 text-xs font-bold rounded-lg transition inline-flex items-center gap-1"
                        >
                          <History className="w-3.5 h-3.5" />
                          <span>View Ledger</span>
                        </Link>

                        {outstanding > 0 && (
                          <button
                            onClick={() => openPaymentModal(c)}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition inline-flex items-center gap-1 shadow-sm"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Record Payment</span>
                          </button>
                        )}
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
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-navy-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-navy-950">Record Payment</h3>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1 text-xs">
              <p className="font-bold text-navy-950">{selectedCustomer.name}</p>
              <p className="text-slate-600">Phone: {selectedCustomer.phone}</p>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-bold">
                <span className="text-slate-600">Current Outstanding:</span>
                <span className="text-amber-700">Rs. {(selectedCustomer.currentOutstanding || 0).toLocaleString()}</span>
              </div>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Payment Amount (NPR) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedCustomer.currentOutstanding || 0}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
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
                  <option value="CASH">Cash Payment</option>
                  <option value="BANK_TRANSFER">Bank Transfer / Fonepay</option>
                  <option value="CHEQUE">Bank Cheque</option>
                  <option value="CARD">Debit / Credit Card</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Note / Reference #</label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  placeholder="e.g. Fonepay ref #908123 or Cheque #00492"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={recording}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow disabled:opacity-50"
                >
                  {recording ? 'Recording...' : 'Save & Issue Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
