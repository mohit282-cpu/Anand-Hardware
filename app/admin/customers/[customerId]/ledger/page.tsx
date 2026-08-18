'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Printer, History, Wallet, CheckCircle2, Wrench } from 'lucide-react';
import { getCustomerLedger, getCustomers, getBusinessSettings } from '@/lib/supabase/services';
import { Customer, CustomerLedgerEntry, BusinessSettings } from '@/types';

export default function CustomerLedgerPage() {
  const params = useParams();
  const customerId = params?.customerId as string;
  const router = useRouter();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<CustomerLedgerEntry[]>([]);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!customerId) return;
      try {
        const [custList, entries, bizSettings] = await Promise.all([
          getCustomers(),
          getCustomerLedger(customerId),
          getBusinessSettings(),
        ]);
        const matched = custList.find(c => c.id === customerId);
        setCustomer(matched || null);
        setLedgerEntries(entries);
        setSettings(bizSettings);
      } catch (err) {
        console.error('Error loading customer ledger:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [customerId]);

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-500">Loading customer ledger statement...</div>;
  }

  if (!customer) {
    return (
      <div className="p-12 text-center space-y-4">
        <h2 className="text-lg font-bold text-navy-950">Customer Account Not Found</h2>
        <Link href="/admin/credit" className="px-4 py-2 bg-brand-600 text-white font-bold text-xs rounded-xl shadow">
          Back to Credit Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Bar (Hidden on print) */}
      <div className="print:hidden flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 text-slate-600 hover:bg-white rounded-xl border border-slate-200"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-black text-navy-950">Customer Ledger Statement</h1>
            <p className="text-xs text-slate-500">{customer.name} • {customer.phone}</p>
          </div>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-navy-950 hover:bg-brand-600 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-2"
        >
          <Printer className="w-4 h-4" />
          <span>Print Statement</span>
        </button>
      </div>

      {/* PRINTABLE STATEMENT CARD */}
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-lg text-slate-800 space-y-8 print:shadow-none print:border-none print:p-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-200 pb-6">
          <div>
            <h2 className="text-2xl font-black text-navy-950 tracking-tight">{settings?.businessName || 'ANAND HARDWARE'}</h2>
            <p className="text-xs text-slate-500">{settings?.address || 'Main Road, Biratnagar, Morang, Nepal'}</p>
            <p className="text-xs text-slate-500">Phone: {settings?.phone} • {settings?.taxId}</p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-2xl font-black text-brand-600 block tracking-tight">STATEMENT OF ACCOUNT</span>
            <span className="text-xs text-slate-500 block">Generated: {new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {/* Customer Account Summary Box */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-200 text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Customer Account</span>
            <p className="font-bold text-navy-950 text-sm">{customer.name}</p>
            {customer.company && <p className="font-semibold text-slate-700">{customer.company}</p>}
            <p className="text-slate-600">{customer.phone}</p>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">All Time Purchases</span>
            <p className="font-black text-navy-950 text-base">Rs. {(customer.totalPurchases || 0).toLocaleString()}</p>
            <p className="text-emerald-700 font-bold">Total Paid: Rs. {(customer.totalPaid || 0).toLocaleString()}</p>
          </div>

          <div className="sm:text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Current Outstanding Balance</span>
            <p className="font-black text-amber-700 text-xl">
              Rs. {(customer.currentOutstanding || 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Ledger Transactions Table */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Transaction Details</th>
                <th className="py-3 px-4 text-right">Debit (Sale)</th>
                <th className="py-3 px-4 text-right">Credit (Paid)</th>
                <th className="py-3 px-4 text-right">Running Balance (NPR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {ledgerEntries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No ledger transactions recorded yet.
                  </td>
                </tr>
              ) : (
                ledgerEntries.map((entry) => {
                  const isDebit = entry.amount > 0;
                  return (
                    <tr key={entry.id}>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-navy-950 block">{entry.description}</span>
                        <span className="text-[10px] text-slate-400 font-mono">Ref: {entry.referenceType} ({entry.createdBy || 'Staff'})</span>
                      </td>

                      <td className="py-3 px-4 text-right font-bold text-navy-950">
                        {isDebit ? `Rs. ${entry.amount.toLocaleString()}` : '—'}
                      </td>

                      <td className="py-3 px-4 text-right font-bold text-emerald-700">
                        {!isDebit ? `Rs. ${Math.abs(entry.amount).toLocaleString()}` : '—'}
                      </td>

                      <td className="py-3 px-4 text-right font-black text-amber-800">
                        Rs. {entry.balance.toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Signatures */}
        <div className="pt-8 flex justify-between text-xs text-slate-500">
          <div className="text-center space-y-6">
            <div className="w-36 border-b border-slate-300 mx-auto" />
            <p className="font-bold">Customer Acknowledgment</p>
          </div>
          <div className="text-center space-y-6">
            <div className="w-36 border-b border-slate-300 mx-auto" />
            <p className="font-bold">Anand Hardware Account</p>
          </div>
        </div>
      </div>
    </div>
  );
}
