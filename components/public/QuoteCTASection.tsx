'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FileText, PhoneCall, ArrowRight, ShieldCheck } from 'lucide-react';
import { QuotationModal } from '@/components/public/QuotationModal';

export function QuoteCTASection() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-navy-950 text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-2xl border border-navy-900">
          {/* Subtle background mesh pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 border border-brand-500/30 text-brand-400 text-xs font-bold">
                <ShieldCheck className="w-4 h-4 text-brand-400" />
                <span>Contractor & Bulk Supply Services</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
                Need Materials for Your Building Project?
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl font-normal">
                Get an official, custom quotation for wholesale, bulk contractor orders, or large commercial building requirements in Biratnagar and Morang district.
              </p>
            </div>

            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-center">
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="px-6 py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-black text-sm rounded-xl transition shadow-lg flex items-center justify-center gap-2 hover:-translate-y-0.5"
              >
                <FileText className="w-4 h-4" />
                <span>Request a Quote</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <Link
                href="/contact"
                className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 border border-white/20"
              >
                <PhoneCall className="w-4 h-4 text-brand-400" />
                <span>Contact Store Sales</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <QuotationModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
