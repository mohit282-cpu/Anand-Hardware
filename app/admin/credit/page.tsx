'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Wallet, Search, Plus, CreditCard, RefreshCw, AlertTriangle, CheckCircle2, History, ArrowRight } from 'lucide-react';
import { getCustomers, getInvoices, recordPayment } from '@/lib/supabase/services';
import { Customer, Invoice, PaymentMethod } from '@/types';
import { useAuth } from '@/components/auth/AuthProvider';

export default function CreditManagementPage() {
  const { userProfile } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
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
      const [custData, invData] = await Promise.all([
        getCustomers(),
        getInvoices(),
      ]);

      // Combine customers with any credit invoices whose customer was not in customer table
      const custMap = new Map<string, Customer>();
      (custData || []).forEach(c => custMap.set(c.id, c));

      // Synthesize missing debtors from credit invoices if any
      (invData || []).forEach(inv => {
        const credit = Number(inv.creditAmount) || (inv.status === 'CREDIT' ? Number(inv.total) : 0);
        if (credit > 0) {
          const custId = inv.customerId || inv.customer?.id;
          if (custId && custMap.has(custId)) {
            const existing = custMap.get(custId)!;
            // Ensure outstanding is at least the invoice credit
            if (!existing.currentOutstanding || existing.currentOutstanding < credit) {
              existing.currentOutstanding = Math.max(existing.currentOutstanding || 0, credit);
            }
          } else if (inv.customer?.name || inv.customer?.phone) {
            // Unregistered credit debtor from invoice
            const synthId = custId || `synth-${inv.id}`;
            if (!custMap.has(synthId)) {
              custMap.set(synthId, {
                id: synthId,
                name: inv.customer.name || 'Walk-in Customer',
                phone: inv.customer.phone || '',
                company: inv.customer.company || 'Walk-in Customer',
                totalPurchases: Number(inv.total),
                totalPaid: Number(inv.paidAmount),
                currentOutstanding: credit,
                createdAt: inv.createdAt,
                updatedAt: inv.updatedAt,
              });
            }
          }
        }
      });

      setCustomers(Array.from(custMap.values()));
      setInvoices(invData || []);
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

      alert('Payment recorded successfully! Receipt issued.');
      setSelectedCustomer(null);
      await loadData();
    } catch (err: any) {
      console.error('Failed to record payment:', err);
      alert(err.message || 'Failed to record payment.');
    } finally {
      setRecording(false);
    }
  };

  const [filterType, setFilterType] = useState<'all' | 'outstanding' | 'walkin' | 'registered' | 'settled'>('outstanding');

  const walkinCustomers = customers.filter(c => c.company === 'Walk-in Customer' || c.company === 'Walk-in Debtor' || c.id.startsWith('synth-'));
  const registeredCustomers = customers.filter(c => c.company !== 'Walk-in Customer' && c.company !== 'Walk-in Debtor' && !c.id.startsWith('synth-'));

  const totalOutstanding = customers.reduce((acc, c) => acc + (c.currentOutstanding || 0), 0);
  const walkinOutstanding = walkinCustomers.reduce((acc, c) => acc + (c.currentOutstanding || 0), 0);
  const registeredOutstanding = registeredCustomers.reduce((acc, c) => acc + (c.currentOutstanding || 0), 0);
  const totalPaid = customers.reduce((acc, c) => acc + (c.totalPaid || 0), 0);

  const filteredCustomers = customers.filter(c => {
    const outstanding = c.currentOutstanding || 0;
    const isWalkin = c.company === 'Walk-in Customer' || c.company === 'Walk-in Debtor' || c.id.startsWith('synth-');

    if (filterType === 'outstanding' && outstanding <= 0) return false;
    if (filterType === 'settled' && outstanding > 0) return false;
    if (filterType === 'walkin' && !isWalkin) return false;
    if (filterType === 'registered' && isWalkin) return false;

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
          <p className="text-xs text-slate-500 mt-1">Track outstanding customer balances, walk-in debtors, and receipt collections in Biratnagar.</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {customers.some(c => (c.currentOutstanding || 0) > 0) && (
            <button
              onClick={() => {
                const firstDebtor = customers.find(c => (c.currentOutstanding || 0) > 0);
                if (firstDebtor) openPaymentModal(firstDebtor);
              }}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-1.5"
            >
              <CreditCard className="w-4 h-4" />
              <span>Pay Udhar / Collect Payment</span>
            </button>
          )}
          <button
            onClick={loadData}
            className="px-3.5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-navy-950 text-white rounded-3xl p-5 shadow-lg border border-navy-900">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Outstanding Udhar</span>
          <p className="text-2xl font-black text-amber-400 mt-1">NPR {totalOutstanding.toLocaleString()}</p>
          <span className="text-[11px] text-slate-400 mt-2 block">All active credit balances</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Walk-in Debtor Udhar</span>
          <p className="text-2xl font-black text-brand-600 mt-1">NPR {walkinOutstanding.toLocaleString()}</p>
          <span className="text-[11px] text-slate-500 mt-2 block">{walkinCustomers.filter(c => (c.currentOutstanding || 0) > 0).length} walk-in debtors</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Registered Customer Udhar</span>
          <p className="text-2xl font-black text-blue-600 mt-1">NPR {registeredOutstanding.toLocaleString()}</p>
          <span className="text-[11px] text-slate-500 mt-2 block">{registeredCustomers.filter(c => (c.currentOutstanding || 0) > 0).length} registered accounts</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Payments Collected</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">NPR {totalPaid.toLocaleString()}</p>
          <span className="text-[11px] text-slate-500 mt-2 block">Cash / Bank receipts</span>
        </div>
      </div>

      {/* Toolbar & Filter Tabs */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search debtor by name or phone..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: 'outstanding', label: 'Outstanding Debtors' },
            { id: 'settled', label: 'Paid Section (Fully Settled)' },
            { id: 'all', label: 'All Debtors' },
            { id: 'walkin', label: 'Walk-in Debtors' },
            { id: 'registered', label: 'Registered' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setFilterType(t.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                filterType === t.id
                  ? 'bg-navy-950 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* CUSTOMERS CREDIT TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading credit ledger data...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-3">
            <Wallet className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-bold text-navy-950 text-sm">No Debtors Found in Selected Category</p>
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
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredCustomers.map((c) => {
                  const outstanding = c.currentOutstanding || 0;
                  const isPaid = outstanding <= 0;

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
                        {isPaid ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>FULLY PAID</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>OUTSTANDING UDHAR</span>
                          </span>
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
                            <span>Pay Udhar</span>
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
              {(selectedCustomer.advanceBalance || 0) > 0 && (
                <div className="flex justify-between font-bold text-emerald-700 pt-1">
                  <span>Current Advance Balance:</span>
                  <span>Rs. {(selectedCustomer.advanceBalance || 0).toLocaleString()}</span>
                </div>
              )}
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Payment Amount (NPR) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
                {paymentAmount > (selectedCustomer.currentOutstanding || 0) && (
                  <p className="text-[11px] font-bold text-emerald-700 mt-1.5 p-2 bg-emerald-50 rounded-xl border border-emerald-200">
                    Overpayment Notice: Rs. {(paymentAmount - (selectedCustomer.currentOutstanding || 0)).toLocaleString()} will be automatically stored in Customer Advance Balance.
                  </p>
                )}
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
