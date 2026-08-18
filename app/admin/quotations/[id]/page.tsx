'use me';
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Printer, Wrench, CheckCircle2, AlertCircle, FileSpreadsheet, Phone, MapPin, Mail } from 'lucide-react';
import { getQuotationById, updateQuotationStatus, getBusinessSettings } from '@/lib/firestore/services';
import { Quotation, QuotationStatus, BusinessSettings } from '@/types';

export default function ViewQuotationPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id) return;
      setLoading(true);
      try {
        const [qData, sData] = await Promise.all([
          getQuotationById(id),
          getBusinessSettings(),
        ]);
        setQuotation(qData);
        setSettings(sData);
      } catch (err) {
        console.error('Error loading quotation:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleStatusChange = async (status: QuotationStatus) => {
    if (!quotation) return;
    try {
      await updateQuotationStatus(quotation.id, status);
      setQuotation(prev => prev ? { ...prev, status } : null);
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading quotation document...</div>;
  }

  if (!quotation) {
    return (
      <div className="max-w-xl mx-auto p-12 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-slate-400 mx-auto" />
        <h2 className="text-xl font-bold text-navy-950">Quotation Not Found</h2>
        <Link href="/admin/quotations" className="inline-block px-4 py-2 bg-brand-600 text-white font-bold text-xs rounded-xl shadow">
          Back to Quotations
        </Link>
      </div>
    );
  }

  const createdDate = new Date(quotation.createdAt).toLocaleDateString();
  const validUntil = new Date(new Date(quotation.createdAt).getTime() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString();

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Top Controls (Hidden during print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/admin/quotations')}
            className="p-2 text-slate-600 bg-white hover:bg-slate-100 rounded-xl border border-slate-200"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-navy-950">Quotation {quotation.quotationNumber}</h1>
            <p className="text-xs text-slate-500">Official Pricing & Specification Document</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={quotation.status}
            onChange={(e) => handleStatusChange(e.target.value as QuotationStatus)}
            className="text-xs font-bold py-2 px-3 bg-white border border-slate-200 rounded-xl focus:outline-none"
          >
            <option value="DRAFT">Status: DRAFT</option>
            <option value="SENT">Status: SENT</option>
            <option value="ACCEPTED">Status: ACCEPTED</option>
            <option value="REJECTED">Status: REJECTED</option>
            <option value="EXPIRED">Status: EXPIRED</option>
          </select>

          <button
            onClick={handlePrint}
            className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* PRINTABLE QUOTATION DOCUMENT CONTAINER */}
      <div className="print-container bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-lg space-y-8">
        {/* Header Branding */}
        <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-200 pb-6 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-navy-950 rounded-xl flex items-center justify-center text-brand-500 font-bold">
                <Wrench className="w-5 h-5" />
              </div>
              <span className="text-2xl font-black text-navy-950 tracking-tight">
                {settings?.businessName || 'ANAND HARDWARE'}
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              {settings?.address || 'Main Road, Ward No. 7, Biratnagar, Morang, Nepal'}
            </p>
            <div className="text-[11px] text-slate-600 space-y-0.5 font-mono">
              <p>Phone: {settings?.phone || '+977 21-523456'}</p>
              <p>Email: {settings?.email || 'info@anandhardware.com'}</p>
              <p className="font-bold text-navy-950">{settings?.taxId || 'PAN: 302948576 / VAT Registered'}</p>
            </div>
          </div>

          <div className="text-right space-y-1 sm:self-start">
            <span className="text-xs font-bold text-brand-600 uppercase tracking-widest block">Official Quotation</span>
            <span className="text-2xl font-black text-navy-950 font-mono block">{quotation.quotationNumber}</span>
            <div className="text-xs text-slate-500 font-medium pt-1 space-y-0.5">
              <p>Date: <span className="font-bold text-slate-800">{createdDate}</span></p>
              <p>Valid Until: <span className="font-bold text-slate-800">{validUntil}</span></p>
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Quotation Issued To</span>
            <p className="font-bold text-navy-950 text-sm">{quotation.customer.name}</p>
            {quotation.customer.company && (
              <p className="font-semibold text-slate-700">{quotation.customer.company}</p>
            )}
            <p className="text-slate-600 mt-1 font-mono">Phone: {quotation.customer.phone}</p>
            {quotation.customer.email && <p className="text-slate-600">Email: {quotation.customer.email}</p>}
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Site / Delivery Address</span>
            <p className="text-slate-700 leading-relaxed font-medium">
              {quotation.customer.address || 'Biratnagar / Morang District'}
            </p>
          </div>
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-navy-950 text-white uppercase tracking-wider font-bold">
              <tr>
                <th className="py-3 px-4 rounded-l-xl">#</th>
                <th className="py-3 px-4">Item Description</th>
                <th className="py-3 px-4 text-center">Unit</th>
                <th className="py-3 px-4 text-right">Qty</th>
                <th className="py-3 px-4 text-right">Unit Price (NPR)</th>
                <th className="py-3 px-4 text-right rounded-r-xl">Subtotal (NPR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {quotation.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-3 px-4 text-slate-400 font-bold">{idx + 1}</td>
                  <td className="py-3 px-4 font-bold text-navy-950">
                    {item.productName}
                    {item.sku && <span className="text-[10px] font-mono text-slate-500 block">SKU: {item.sku}</span>}
                  </td>
                  <td className="py-3 px-4 text-center text-slate-600">{item.unit}</td>
                  <td className="py-3 px-4 text-right font-bold text-navy-950">{item.quantity}</td>
                  <td className="py-3 px-4 text-right text-slate-700">Rs. {item.unitPrice.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right font-black text-navy-950">
                    Rs. {item.subtotal.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total Summary */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-t border-slate-200 pt-6">
          <div className="space-y-2 text-xs text-slate-600 max-w-sm">
            <h4 className="font-bold text-navy-950 uppercase tracking-wider">Terms & Conditions</h4>
            <ul className="list-disc pl-4 space-y-1 text-[11px]">
              <li>Prices are quoted in Nepalese Rupees (NPR) and include local tax as specified.</li>
              <li>Delivery timelines are subject to warehouse stock confirmation at order placement.</li>
              <li>Please reference quotation number <strong>{quotation.quotationNumber}</strong> when placing orders.</li>
            </ul>
            {quotation.notes && (
              <div className="pt-2">
                <span className="font-bold text-slate-800 block">Notes:</span>
                <p className="text-slate-600 italic">{quotation.notes}</p>
              </div>
            )}
          </div>

          <div className="w-full sm:w-72 bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-bold text-navy-950">Rs. {quotation.subtotal.toLocaleString()}</span>
            </div>
            {quotation.discount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Discount:</span>
                <span className="font-bold">- Rs. {quotation.discount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>VAT / Local Tax ({quotation.tax}%):</span>
              <span className="font-bold text-navy-950">
                Rs. {(((quotation.subtotal - quotation.discount) * quotation.tax) / 100).toLocaleString()}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline text-sm">
              <span className="font-black text-navy-950">Grand Total:</span>
              <span className="font-black text-brand-700 text-lg">Rs. {quotation.total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Signature Block */}
        <div className="pt-12 flex justify-between items-end text-xs text-slate-500">
          <div className="text-center">
            <div className="w-36 border-b border-slate-300 mb-1" />
            <span>Customer Acceptance Signature</span>
          </div>

          <div className="text-center">
            <p className="font-bold text-navy-950 block mb-1">For Anand Hardware</p>
            <div className="w-36 border-b border-slate-300 mb-1" />
            <span>Authorized Signature</span>
          </div>
        </div>
      </div>
    </div>
  );
}
