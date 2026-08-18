'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Receipt,
  Plus,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
  AlertTriangle,
  Printer
} from 'lucide-react';
import { getInvoices, confirmInvoice, cancelInvoice } from '@/lib/supabase/services';
import { Invoice, InvoiceStatus } from '@/types';
import { useAuth } from '@/components/auth/AuthProvider';

export default function AdminBillsPage() {
  const { userProfile } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Cancel Modal State
  const [cancelModalId, setCancelModalId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getInvoices();
      setInvoices(data);
    } catch (err) {
      console.error('Error loading invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleConfirm = async (id: string) => {
    if (!confirm('Are you sure you want to confirm this bill? This will release stock from inventory and update customer account balance.')) {
      return;
    }
    try {
      await confirmInvoice(id, userProfile?.displayName || userProfile?.email || 'Admin Staff');
      setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: inv.creditAmount > 0 ? 'CREDIT' : 'PAID' } : inv));
      alert('Bill confirmed successfully!');
    } catch (err: any) {
      console.error('Failed to confirm bill:', err);
      alert(err.message || 'Failed to confirm bill.');
    }
  };

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelModalId || !cancelReason.trim()) return;

    setCancelling(true);
    try {
      await cancelInvoice(cancelModalId, cancelReason, userProfile?.displayName || userProfile?.email || 'Admin Staff');
      setInvoices(prev => prev.map(inv => inv.id === cancelModalId ? { ...inv, status: 'CANCELLED', cancellationReason: cancelReason } : inv));
      setCancelModalId(null);
      setCancelReason('');
      alert('Bill cancelled and inventory restored.');
    } catch (err: any) {
      console.error('Failed to cancel bill:', err);
      alert(err.message || 'Failed to cancel bill.');
    } finally {
      setCancelling(false);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    if (statusFilter !== 'ALL' && inv.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.customer.name.toLowerCase().includes(q) ||
        inv.customer.phone.toLowerCase().includes(q) ||
        (inv.financialYear && inv.financialYear.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case 'PAID':
        return <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">PAID</span>;
      case 'PARTIALLY_PAID':
        return <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-blue-100 text-blue-800 border border-blue-200">PARTIAL</span>;
      case 'CREDIT':
        return <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-amber-100 text-amber-800 border border-amber-200">CREDIT (UDHAR)</span>;
      case 'CONFIRMED':
        return <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-teal-100 text-teal-800 border border-teal-200">CONFIRMED</span>;
      case 'DRAFT':
        return <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-slate-100 text-slate-700 border border-slate-200">DRAFT</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-rose-100 text-rose-700 border border-rose-200">CANCELLED</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-navy-950">Billing & Invoice Management</h1>
          <p className="text-xs text-slate-500 mt-1">Issue official cash/credit invoices with automated Nepal FY numbering.</p>
        </div>
        <Link
          href="/admin/bills/new"
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2 self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Bill / POS</span>
        </Link>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by invoice #, customer name, phone..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">DRAFT</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="CREDIT">CREDIT (UDHAR)</option>
            <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
            <option value="PAID">PAID</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
          <button onClick={loadData} className="p-2 text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* INVOICES TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading billing records...</div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-3">
            <Receipt className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-bold text-navy-950 text-sm">No Invoices Found</p>
            <Link
              href="/admin/bills/new"
              className="inline-block px-4 py-2 bg-brand-600 text-white font-bold text-xs rounded-xl shadow"
            >
              Create First Bill
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-3.5 px-4">Invoice #</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4 text-right">Grand Total (NPR)</th>
                  <th className="py-3.5 px-4 text-right">Paid / Credit</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-navy-950">
                      <Link href={`/admin/bills/${inv.id}`} className="hover:text-brand-600">
                        {inv.invoiceNumber}
                      </Link>
                      <span className="text-[10px] text-slate-400 block font-sans">
                        {new Date(inv.createdAt).toLocaleDateString()} • FY {inv.financialYear || 'Current'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-navy-950 block">{inv.customer.name}</span>
                      <span className="text-[11px] text-slate-500">{inv.customer.phone}</span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-black text-navy-950 text-sm">
                      Rs. {inv.total.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 text-right text-[11px]">
                      <span className="text-emerald-700 font-bold block">Paid: Rs. {inv.paidAmount.toLocaleString()}</span>
                      {inv.creditAmount > 0 && (
                        <span className="text-rose-700 font-bold block">Credit: Rs. {inv.creditAmount.toLocaleString()}</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {getStatusBadge(inv.status)}
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-2">
                      <Link
                        href={`/admin/bills/${inv.id}`}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-navy-950 text-xs font-bold rounded-lg transition inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Print</span>
                      </Link>

                      {inv.status === 'DRAFT' && (
                        <button
                          onClick={() => handleConfirm(inv.id)}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition inline-flex items-center gap-1 shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Confirm</span>
                        </button>
                      )}

                      {inv.status !== 'CANCELLED' && (
                        <button
                          onClick={() => setCancelModalId(inv.id)}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-lg transition inline-flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Cancel</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cancellation Modal */}
      {cancelModalId && (
        <div className="fixed inset-0 z-50 bg-navy-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-navy-950">Cancel Invoice</h3>
            </div>
            <p className="text-xs text-slate-600">
              Cancelling a confirmed bill will restore stock levels to inventory and reverse customer credit balances. Historical record will be retained.
            </p>
            <form onSubmit={handleCancelSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Cancellation <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  placeholder="e.g. Customer returned items / Wrong billing items"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelModalId(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={cancelling}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow disabled:opacity-50"
                >
                  {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
