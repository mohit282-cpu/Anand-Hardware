'use me';
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileSpreadsheet, Plus, Search, Eye, Printer, CheckCircle2, RefreshCw } from 'lucide-react';
import { getQuotations, updateQuotationStatus } from '@/lib/firestore/services';
import { Quotation, QuotationStatus } from '@/types';

export default function AdminQuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getQuotations();
      setQuotations(data);
    } catch (err) {
      console.error('Error loading quotations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (id: string, status: QuotationStatus) => {
    try {
      await updateQuotationStatus(id, status);
      setQuotations(prev => prev.map(q => q.id === id ? { ...q, status } : q));
    } catch (err) {
      console.error('Error updating quotation status:', err);
    }
  };

  const filteredQuotations = quotations.filter((q) => {
    if (statusFilter !== 'ALL' && q.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const sq = searchQuery.toLowerCase().trim();
      return (
        q.quotationNumber.toLowerCase().includes(sq) ||
        q.customer.name.toLowerCase().includes(sq) ||
        q.customer.phone.toLowerCase().includes(sq)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-navy-950">Quotation Management</h1>
          <p className="text-xs text-slate-500 mt-1">Create, print, and track formal customer quotations.</p>
        </div>
        <Link
          href="/admin/quotations/new"
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2 self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Quotation</span>
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
            placeholder="Search by quote #, customer name, or phone..."
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
            <option value="SENT">SENT</option>
            <option value="ACCEPTED">ACCEPTED</option>
            <option value="REJECTED">REJECTED</option>
            <option value="EXPIRED">EXPIRED</option>
          </select>
          <button onClick={loadData} className="p-2 text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* QUOTATIONS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading quotations...</div>
        ) : filteredQuotations.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-3">
            <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-bold text-navy-950 text-sm">No Quotations Found</p>
            <Link
              href="/admin/quotations/new"
              className="inline-block px-4 py-2 bg-brand-600 text-white font-bold text-xs rounded-xl shadow"
            >
              Create Quotation
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-3.5 px-4">Quote Number</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4 text-center">Items Count</th>
                  <th className="py-3.5 px-4 text-right">Grand Total (NPR)</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredQuotations.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-navy-950">
                      <Link href={`/admin/quotations/${q.id}`} className="hover:text-brand-600">
                        {q.quotationNumber}
                      </Link>
                      <span className="text-[10px] text-slate-400 block font-sans">
                        {new Date(q.createdAt).toLocaleDateString()}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-navy-950 block">{q.customer.name}</span>
                      <span className="text-[11px] text-slate-500">{q.customer.phone}</span>
                    </td>

                    <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                      {q.items.length} items
                    </td>

                    <td className="py-3.5 px-4 text-right font-black text-navy-950">
                      Rs. {q.total.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <select
                        value={q.status}
                        onChange={(e) => handleStatusChange(q.id, e.target.value as QuotationStatus)}
                        className="text-xs font-bold py-1 px-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
                      >
                        <option value="DRAFT">DRAFT</option>
                        <option value="SENT">SENT</option>
                        <option value="ACCEPTED">ACCEPTED</option>
                        <option value="REJECTED">REJECTED</option>
                        <option value="EXPIRED">EXPIRED</option>
                      </select>
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-2">
                      <Link
                        href={`/admin/quotations/${q.id}`}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-navy-950 text-xs font-bold rounded-lg transition inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View / Print</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
