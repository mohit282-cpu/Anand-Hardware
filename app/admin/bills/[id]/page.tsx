'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Printer, Wrench, CheckCircle2, Clock, XCircle, FileSpreadsheet } from 'lucide-react';
import { getInvoiceById, getBusinessSettings } from '@/lib/supabase/services';
import { Invoice, BusinessSettings } from '@/types';

export default function InvoiceDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        const [invData, bizSettings] = await Promise.all([
          getInvoiceById(id),
          getBusinessSettings(),
        ]);
        setInvoice(invData);
        setSettings(bizSettings);
      } catch (err) {
        console.error('Error loading invoice details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-500">Loading invoice document...</div>;
  }

  if (!invoice) {
    return (
      <div className="p-12 text-center space-y-4">
        <h2 className="text-lg font-bold text-navy-950">Invoice Not Found</h2>
        <Link href="/admin/bills" className="px-4 py-2 bg-brand-600 text-white font-bold text-xs rounded-xl shadow">
          Back to Bills
        </Link>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Action Bar (hidden on print) */}
      <div className="print:hidden flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 text-slate-600 hover:bg-white rounded-xl border border-slate-200"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-black text-navy-950">Invoice #{invoice.invoiceNumber}</h1>
            <p className="text-xs text-slate-500">Fiscal Year: {invoice.financialYear || 'Current'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-navy-950 hover:bg-brand-600 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print Invoice</span>
          </button>
        </div>
      </div>

      {/* PRINTABLE A4 INVOICE CARD */}
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-lg text-slate-800 space-y-8 print:shadow-none print:border-none print:p-0">
        {/* Header Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-200 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-navy-950 text-brand-400 rounded-2xl flex items-center justify-center font-black text-xl">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-navy-950 tracking-tight">{settings?.businessName || 'ANAND HARDWARE'}</h2>
              <p className="text-xs text-slate-500">{settings?.address || 'Main Road, Biratnagar, Morang, Nepal'}</p>
              <p className="text-xs text-slate-500">Phone: {settings?.phone} • {settings?.taxId}</p>
            </div>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <span className="text-2xl font-black text-brand-600 block tracking-tight">SALES INVOICE</span>
            <span className="text-xs font-mono font-bold text-navy-950 block">#{invoice.invoiceNumber}</span>
            <span className="text-xs text-slate-500 block">Date: {new Date(invoice.createdAt).toLocaleDateString()}</span>
            <span className="text-xs font-semibold text-slate-600 block">Nepal FY: {invoice.financialYear || '2082/83'}</span>
          </div>
        </div>

        {/* Customer & Status Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Billed To Customer</span>
            <h3 className="text-sm font-bold text-navy-950">{invoice.customer.name}</h3>
            {invoice.customer.company && <p className="text-xs font-semibold text-slate-700">{invoice.customer.company}</p>}
            <p className="text-xs text-slate-600">Phone: {invoice.customer.phone}</p>
            {invoice.customer.address && <p className="text-xs text-slate-600">Address: {invoice.customer.address}</p>}
          </div>

          <div className="sm:text-right space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Payment Status</span>
            <div className="inline-block">
              <span className={`px-3 py-1 text-xs font-black rounded-lg uppercase tracking-wider ${
                invoice.status === 'PAID'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : invoice.status === 'PARTIALLY_PAID'
                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                  : invoice.status === 'CREDIT'
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : invoice.status === 'CANCELLED'
                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                  : 'bg-slate-200 text-slate-800'
              }`}>
                {invoice.status.replace('_', ' ')}
              </span>
            </div>
            {invoice.status === 'CANCELLED' && invoice.cancellationReason && (
              <p className="text-[11px] text-rose-600 font-semibold mt-1">
                Reason: {invoice.cancellationReason}
              </p>
            )}
          </div>
        </div>

        {/* Itemized Table */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Item Description</th>
                <th className="py-3 px-4 text-center">Qty</th>
                <th className="py-3 px-4 text-right">Unit Price</th>
                <th className="py-3 px-4 text-right">Subtotal (NPR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {invoice.items.map((item, index) => (
                <tr key={index}>
                  <td className="py-3 px-4 font-mono text-slate-400">{index + 1}</td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-navy-950 block">{item.productName}</span>
                    {item.sku && <span className="text-[10px] text-slate-500 font-mono">SKU: {item.sku}</span>}
                  </td>
                  <td className="py-3 px-4 text-center font-bold">{item.quantity} {item.unit}</td>
                  <td className="py-3 px-4 text-right">Rs. {item.unitPrice.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right font-black text-navy-950">Rs. {item.subtotal.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Summary & Breakdown */}
        <div className="flex flex-col sm:flex-row justify-between gap-6 pt-4 border-t border-slate-200">
          <div className="max-w-xs text-xs space-y-2 text-slate-600">
            <p className="font-bold text-slate-800 uppercase tracking-wider">Terms & Conditions:</p>
            <p>1. Goods once sold are non-refundable unless damaged on delivery.</p>
            <p>2. Credit balance must be settled within agreed terms.</p>
            {invoice.notes && <p className="italic text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200">Note: {invoice.notes}</p>}
          </div>

          <div className="w-full sm:w-72 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Items Subtotal:</span>
              <span className="font-bold text-slate-900">Rs. {invoice.subtotal.toLocaleString()}</span>
            </div>

            {invoice.discount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Discount:</span>
                <span className="font-bold">- Rs. {invoice.discount.toLocaleString()}</span>
              </div>
            )}

            {invoice.tax > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>VAT ({invoice.tax}%):</span>
                <span className="font-bold text-slate-900">Rs. {(((invoice.subtotal - invoice.discount) * invoice.tax) / 100).toLocaleString()}</span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-300 flex justify-between items-baseline">
              <span className="text-sm font-bold text-navy-950 uppercase">Grand Total:</span>
              <span className="text-xl font-black text-brand-600">Rs. {invoice.total.toLocaleString()}</span>
            </div>

            <div className="pt-2 border-t border-slate-200 space-y-1 font-semibold">
              <div className="flex justify-between text-emerald-700">
                <span>Amount Paid:</span>
                <span>Rs. {invoice.paidAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-amber-700">
                <span>Remaining Udhar (Credit):</span>
                <span>Rs. {invoice.creditAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="pt-12 flex justify-between text-xs text-slate-500">
          <div className="text-center space-y-8">
            <div className="w-40 border-b border-slate-300 mx-auto" />
            <p className="font-bold">Customer Signature</p>
          </div>
          <div className="text-center space-y-8">
            <div className="w-40 border-b border-slate-300 mx-auto" />
            <p className="font-bold">For Anand Hardware</p>
          </div>
        </div>
      </div>
    </div>
  );
}
