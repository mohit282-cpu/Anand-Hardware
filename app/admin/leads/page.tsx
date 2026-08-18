'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Inbox, Search, Filter, Phone, Mail, FileSpreadsheet, CheckCircle2, Clock, ArrowRight, RefreshCw } from 'lucide-react';
import { getLeads, updateLeadStatus } from '@/lib/supabase/services';
import { Lead, LeadStatus } from '@/types';

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getLeads();
      setLeads(data);
    } catch (err) {
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (id: string, status: LeadStatus) => {
    try {
      await updateLeadStatus(id, status);
      setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    } catch (err) {
      console.error('Error updating lead status:', err);
    }
  };

  const filteredLeads = leads.filter(l => {
    if (statusFilter !== 'ALL' && l.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        l.customerName.toLowerCase().includes(q) ||
        l.phone.toLowerCase().includes(q) ||
        l.productName.toLowerCase().includes(q) ||
        (l.company && l.company.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-navy-950">Inquiry & Lead CRM</h1>
          <p className="text-xs text-slate-500 mt-1">Track quotation requests submitted by customers on the public website.</p>
        </div>
        <button onClick={loadData} className="p-2 text-slate-600 bg-white border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 self-start">
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Leads</span>
        </button>
      </div>

      {/* Toolbar & Filter Tabs */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer, phone, or product..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto text-xs font-bold">
            {['ALL', 'NEW', 'CONTACTED', 'QUOTATION', 'WON', 'LOST'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  statusFilter === st ? 'bg-white text-navy-950 shadow-sm' : 'text-slate-500 hover:text-navy-950'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* LEADS LIST / TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading leads...</div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-2">
            <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-bold text-navy-950 text-sm">No Inquiries Found</p>
            <p>No customer quotation requests match the current status filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Contact Phone</th>
                  <th className="py-3.5 px-4">Requested Item & Qty</th>
                  <th className="py-3.5 px-4">Inquiry Notes</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-navy-950 block">{lead.customerName}</span>
                      {lead.company && <span className="text-[10px] text-slate-500 block">{lead.company}</span>}
                    </td>

                    <td className="py-3.5 px-4 text-slate-700 font-mono">
                      <a href={`tel:${lead.phone}`} className="hover:text-brand-600 font-bold">
                        {lead.phone}
                      </a>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-navy-950 block">{lead.productName}</span>
                      <span className="text-[11px] text-brand-600 font-semibold block">Qty: {lead.quantity}</span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                      {lead.message || <span className="text-slate-400 italic">No notes provided</span>}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <select
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                        className={`text-xs font-bold py-1 px-2.5 rounded-xl border focus:outline-none ${
                          lead.status === 'NEW'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : lead.status === 'CONTACTED'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : lead.status === 'QUOTATION'
                            ? 'bg-purple-50 text-purple-800 border-purple-200'
                            : lead.status === 'WON'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                      >
                        <option value="NEW">NEW</option>
                        <option value="CONTACTED">CONTACTED</option>
                        <option value="QUOTATION">QUOTATION</option>
                        <option value="WON">WON</option>
                        <option value="LOST">LOST</option>
                      </select>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/admin/quotations/new?customerName=${encodeURIComponent(lead.customerName)}&phone=${encodeURIComponent(lead.phone)}&company=${encodeURIComponent(lead.company || '')}&productName=${encodeURIComponent(lead.productName)}&quantity=${lead.quantity}`}
                        className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-[11px] rounded-lg transition inline-flex items-center gap-1 shadow-sm"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>Create Quotation</span>
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
