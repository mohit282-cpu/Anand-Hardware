'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Printer, Wrench, CheckCircle2, CreditCard } from 'lucide-react';
import { getPaymentById, getBusinessSettings } from '@/lib/firestore/services';
import { Payment, BusinessSettings } from '@/types';

export default function PaymentReceiptPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [payment, setPayment] = useState<Payment | null>(null);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        const [payData, bizSettings] = await Promise.all([
          getPaymentById(id),
          getBusinessSettings(),
        ]);
        setPayment(payData);
        setSettings(bizSettings);
      } catch (err) {
        console.error('Error loading payment receipt:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-500">Loading payment receipt...</div>;
  }

  if (!payment) {
    return (
      <div className="p-12 text-center space-y-4">
        <h2 className="text-lg font-bold text-navy-950">Receipt Not Found</h2>
        <Link href="/admin/payments" className="px-4 py-2 bg-brand-600 text-white font-bold text-xs rounded-xl shadow">
          Back to Payments
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-12">
      {/* Top Action Bar */}
      <div className="print:hidden flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 text-slate-600 hover:bg-white rounded-xl border border-slate-200"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-black text-navy-950">Payment Receipt #{payment.receiptNumber}</h1>
            <p className="text-xs text-slate-500">Customer: {payment.customerName}</p>
          </div>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-navy-950 hover:bg-brand-600 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-2"
        >
          <Printer className="w-4 h-4" />
          <span>Print Receipt</span>
        </button>
      </div>

      {/* PRINTABLE RECEIPT CARD */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-lg text-slate-800 space-y-6 print:shadow-none print:border-none print:p-0">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-200 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-black">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-navy-950 tracking-tight">{settings?.businessName || 'ANAND HARDWARE'}</h2>
              <p className="text-[11px] text-slate-500">{settings?.address || 'Main Road, Biratnagar, Morang, Nepal'}</p>
              <p className="text-[11px] text-slate-500">Phone: {settings?.phone} • {settings?.taxId}</p>
            </div>
          </div>

          <div className="text-right space-y-1">
            <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg uppercase tracking-wider block">OFFICIAL RECEIPT</span>
            <span className="text-xs font-mono font-bold text-navy-950 block">#{payment.receiptNumber}</span>
            <span className="text-[11px] text-slate-500 block">Date: {new Date(payment.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Payment Summary Box */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 text-xs">
          <div className="flex justify-between border-b border-slate-200 pb-2">
            <span className="text-slate-500">Received From:</span>
            <span className="font-bold text-navy-950">{payment.customerName} ({payment.customerPhone})</span>
          </div>

          <div className="flex justify-between border-b border-slate-200 pb-2">
            <span className="text-slate-500">Payment Method:</span>
            <span className="font-bold text-slate-800">{payment.paymentMethod}</span>
          </div>

          {payment.note && (
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Reference / Note:</span>
              <span className="font-semibold text-slate-700">{payment.note}</span>
            </div>
          )}

          <div className="flex justify-between border-b border-slate-200 pb-2">
            <span className="text-slate-500">Previous Udhar Outstanding:</span>
            <span className="font-bold text-slate-800">Rs. {payment.previousOutstanding.toLocaleString()}</span>
          </div>

          <div className="flex justify-between text-sm py-1 font-black text-emerald-700 bg-emerald-50 px-3 rounded-xl">
            <span>Amount Received Today:</span>
            <span>NPR {payment.amount.toLocaleString()}</span>
          </div>

          <div className="flex justify-between pt-1 font-bold text-amber-800">
            <span>Remaining Udhar Outstanding:</span>
            <span>NPR {payment.remainingOutstanding.toLocaleString()}</span>
          </div>
        </div>

        {/* Signatures */}
        <div className="pt-8 flex justify-between text-xs text-slate-500">
          <div className="text-center space-y-6">
            <div className="w-32 border-b border-slate-300 mx-auto" />
            <p className="font-bold">Customer Signature</p>
          </div>
          <div className="text-center space-y-6">
            <div className="w-32 border-b border-slate-300 mx-auto" />
            <p className="font-bold">Authorized Receiver</p>
          </div>
        </div>
      </div>
    </div>
  );
}
