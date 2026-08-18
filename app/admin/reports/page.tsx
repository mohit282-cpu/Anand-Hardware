'use client';

import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Calendar,
  Wallet,
  TrendingUp,
  Receipt,
  Boxes,
  FileSpreadsheet,
  RefreshCw,
  Printer,
  CheckCircle2
} from 'lucide-react';
import { getFinancialReports } from '@/lib/supabase/services';
import { getAvailableFinancialYears, getNepalFY } from '@/lib/utils/nepalFY';

export default function FinancialReportsPage() {
  const currentFY = getNepalFY();
  const availableYears = getAvailableFinancialYears();
  const [selectedFYKey, setSelectedFYKey] = useState<string>(currentFY.fyKey);

  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sales' | 'credit' | 'inventory' | 'quotations'>('sales');

  useEffect(() => {
    async function loadReport() {
      setLoading(true);
      try {
        const data = await getFinancialReports(selectedFYKey);
        setReportData(data);
      } catch (err) {
        console.error('Error loading financial report:', err);
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, [selectedFYKey]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header & Year Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-navy-950">Financial & Sales Analytics</h1>
          <p className="text-xs text-slate-500 mt-1">Audit sales revenue, credit balances, inventory turnover, and conversion rates by Nepal FY.</p>
        </div>

        <div className="flex items-center gap-3 self-start">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm text-xs font-semibold">
            <Calendar className="w-4 h-4 text-brand-600" />
            <span>Nepal FY:</span>
            <select
              value={selectedFYKey}
              onChange={(e) => setSelectedFYKey(e.target.value)}
              className="font-bold text-navy-950 bg-transparent focus:outline-none"
            >
              {availableYears.map(y => {
                const key = y.replace('/', '-');
                return (
                  <option key={key} value={key}>
                    {y} {key === currentFY.fyKey ? '(Current)' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-navy-950 hover:bg-brand-600 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-1.5 print:hidden"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* TABS HEADER */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2 print:hidden">
        <button
          onClick={() => setActiveTab('sales')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
            activeTab === 'sales'
              ? 'bg-brand-600 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Sales & Invoicing Report</span>
        </button>

        <button
          onClick={() => setActiveTab('credit')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
            activeTab === 'credit'
              ? 'bg-brand-600 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Credit & Udhar Report</span>
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
            activeTab === 'inventory'
              ? 'bg-brand-600 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Inventory Audit</span>
        </button>

        <button
          onClick={() => setActiveTab('quotations')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
            activeTab === 'quotations'
              ? 'bg-brand-600 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Quotation Conversion</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500">Calculating financial metrics for FY {selectedFYKey.replace('-', '/')}...</div>
      ) : (
        <div className="space-y-6">
          {/* TAB 1: SALES REPORT */}
          {activeTab === 'sales' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-navy-950 text-white p-5 rounded-3xl shadow-lg border border-navy-900">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Invoiced Sales</span>
                  <p className="text-2xl font-black text-brand-400 mt-1">NPR {(reportData?.totalSales || 0).toLocaleString()}</p>
                  <span className="text-[11px] text-slate-400 mt-2 block">FY {reportData?.fyString} Revenue</span>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Cash Collected</span>
                  <p className="text-2xl font-black text-emerald-600 mt-1">NPR {(reportData?.totalCollected || 0).toLocaleString()}</p>
                  <span className="text-[11px] text-slate-500 mt-2 block">Realized Payments</span>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Confirmed Invoices</span>
                  <p className="text-2xl font-black text-navy-950 mt-1">{reportData?.confirmedBillsCount || 0}</p>
                  <span className="text-[11px] text-slate-500 mt-2 block">{reportData?.draftBillsCount || 0} Pending Drafts</span>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Credit Sales Value</span>
                  <p className="text-2xl font-black text-amber-600 mt-1">NPR {(reportData?.creditSales || 0).toLocaleString()}</p>
                  <span className="text-[11px] text-slate-500 mt-2 block">Sales issued on credit</span>
                </div>
              </div>

              {/* Invoices List */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-navy-950 uppercase tracking-wider">Billed Invoices for FY {reportData?.fyString}</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold">
                      <tr>
                        <th className="py-3 px-4">Invoice #</th>
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4 text-right">Total Amount</th>
                        <th className="py-3 px-4 text-right">Paid</th>
                        <th className="py-3 px-4 text-right">Credit</th>
                        <th className="py-3 px-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {reportData?.invoices?.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-slate-400">No invoices recorded for this financial year.</td>
                        </tr>
                      ) : (
                        reportData?.invoices?.map((inv: any) => (
                          <tr key={inv.id}>
                            <td className="py-3 px-4 font-mono font-bold text-navy-950">{inv.invoiceNumber}</td>
                            <td className="py-3 px-4 font-bold text-slate-800">{inv.customer?.name}</td>
                            <td className="py-3 px-4 text-right font-black text-navy-950">Rs. {inv.total.toLocaleString()}</td>
                            <td className="py-3 px-4 text-right text-emerald-700 font-bold">Rs. {inv.paidAmount.toLocaleString()}</td>
                            <td className="py-3 px-4 text-right text-amber-700 font-bold">Rs. {inv.creditAmount.toLocaleString()}</td>
                            <td className="py-3 px-4 text-center">
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-700">{inv.status}</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CREDIT REPORT */}
          {activeTab === 'credit' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-amber-950 text-white p-6 rounded-3xl shadow-lg border border-amber-900">
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">Total Outstanding Udhar</span>
                  <p className="text-3xl font-black text-amber-400 mt-2">NPR {(reportData?.totalOutstanding || 0).toLocaleString()}</p>
                  <p className="text-xs text-amber-200 mt-2">Receivable from Anand Hardware clients in Biratnagar.</p>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Collected FY Payments</span>
                  <p className="text-3xl font-black text-emerald-600 mt-2">NPR {(reportData?.totalCollected || 0).toLocaleString()}</p>
                  <p className="text-xs text-slate-500 mt-2">Total cash / transfer receipts recorded.</p>
                </div>
              </div>

              {/* Payments Log */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-navy-950 uppercase tracking-wider">Payment Receipts for FY {reportData?.fyString}</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold">
                      <tr>
                        <th className="py-3 px-4">Receipt #</th>
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4 text-center">Method</th>
                        <th className="py-3 px-4 text-right">Amount Received</th>
                        <th className="py-3 px-4 text-right">Remaining Outstanding</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {reportData?.payments?.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-400">No payment receipts recorded for this financial year.</td>
                        </tr>
                      ) : (
                        reportData?.payments?.map((p: any) => (
                          <tr key={p.id}>
                            <td className="py-3 px-4 font-mono font-bold text-navy-950">{p.receiptNumber}</td>
                            <td className="py-3 px-4 font-bold text-slate-800">{p.customerName}</td>
                            <td className="py-3 px-4 text-center font-bold text-slate-600">{p.paymentMethod}</td>
                            <td className="py-3 px-4 text-right font-black text-emerald-700">Rs. {p.amount.toLocaleString()}</td>
                            <td className="py-3 px-4 text-right font-bold text-amber-700">Rs. {p.remainingOutstanding.toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: INVENTORY AUDIT */}
          {activeTab === 'inventory' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-navy-950 uppercase tracking-wider">Recent Stock Movement Transactions</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Product</th>
                      <th className="py-3 px-4 text-center">Type</th>
                      <th className="py-3 px-4 text-center">Qty</th>
                      <th className="py-3 px-4">Reason / Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {reportData?.recentTransactions?.map((tx: any) => (
                      <tr key={tx.id}>
                        <td className="py-3 px-4 font-mono text-slate-400">{new Date(tx.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 px-4 font-bold text-navy-950">{tx.productName}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                            tx.type === 'STOCK_IN' || tx.type === 'RETURN'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-black">{tx.quantity}</td>
                        <td className="py-3 px-4 text-slate-600">{tx.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: QUOTATION CONVERSION */}
          {activeTab === 'quotations' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase">Total Quotations Issued</span>
                <p className="text-3xl font-black text-navy-950">{reportData?.quotationTotal || 0}</p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase">Accepted / Billed</span>
                <p className="text-3xl font-black text-emerald-600">{reportData?.quotationAccepted || 0}</p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase">Conversion Rate</span>
                <p className="text-3xl font-black text-brand-600">
                  {reportData?.quotationTotal > 0
                    ? `${Math.round((reportData.quotationAccepted / reportData.quotationTotal) * 100)}%`
                    : '0%'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
