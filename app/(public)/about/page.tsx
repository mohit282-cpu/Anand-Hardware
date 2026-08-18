'use me';
'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, MapPin, Wrench, Building2, Truck, FileText } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-bold text-brand-600 uppercase tracking-widest block">About Our Company</span>
        <h1 className="text-3xl sm:text-4xl font-black text-navy-950">
          Biratnagar’s Trusted Hardware & Construction Partner
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          For over two decades, Anand Hardware has been at the forefront of providing authentic building supplies, PVC piping networks, electrical wiring, cements, Asian paints, and heavy metalware across Morang and Eastern Nepal.
        </p>
      </div>

      {/* Grid Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-brand-600 font-bold">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-navy-950">Wholesale & Retail Supply</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            We cater to both large-scale commercial contractors needing site delivery of rebar and cement, as well as individual homeowners looking for premium taps, paints, and door locks.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-brand-600 font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-navy-950">Direct Factory Partnership</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            All materials are sourced directly from leading manufacturers including Panchakanya Pipes, Shivam Cement, Asian Paints, Stanley Tools, and Godrej Locks, ensuring 100% genuine quality.
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-brand-600 font-bold">
            <Truck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-navy-950">Local Delivery Network</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Our logistics fleet ensures prompt delivery directly to your construction site anywhere in Biratnagar, Itahari, Dharan, and surrounding districts.
          </p>
        </div>
      </div>

      {/* Business Details Card */}
      <div className="bg-navy-950 text-white rounded-3xl p-8 sm:p-12 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-4">
          <h2 className="text-2xl sm:text-3xl font-black">Visit Our Showroom in Biratnagar</h2>
          <p className="text-xs text-slate-300 max-w-lg leading-relaxed">
            Our main store and warehouse feature complete displays of plumbing setups, electrical switches, paints tinting machines, and structural hardware.
          </p>
          <div className="space-y-2 text-xs text-slate-300">
            <p className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-500" />
              Main Road, Ward No. 7, Biratnagar, Morang, Nepal
            </p>
            <p className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-brand-500" />
              PAN / VAT Registered Business
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
          <Link
            href="/products"
            className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition shadow"
          >
            Explore Catalog
          </Link>
          <Link
            href="/contact"
            className="px-6 py-3 bg-navy-800 hover:bg-navy-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-xl transition"
          >
            Contact Store
          </Link>
        </div>
      </div>
    </div>
  );
}
