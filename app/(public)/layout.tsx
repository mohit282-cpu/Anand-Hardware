import React from 'react';
import Link from 'next/link';
import { Phone, MapPin, Clock, ShieldCheck, Wrench, Mail } from 'lucide-react';
import { PublicHeader } from '@/components/public/PublicHeader';
import { getBusinessSettingsServer } from '@/lib/supabase/server-queries';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const settings = await getBusinessSettingsServer();

  const businessName = settings?.businessName || 'ANAND HARDWARE';
  const address = settings?.address || 'Main Road, Ward No. 7, Biratnagar, Morang, Nepal';
  const phone = settings?.phone || '+977 21-523456';
  const email = settings?.email || 'info@anandhardware.com';
  const whatsapp = settings?.whatsapp;
  const openingHours = settings?.openingHours || 'Sun - Fri: 8:00 AM - 7:00 PM';
  const taxId = settings?.taxId || '';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Interactive Public Header (Client Component) */}
      <PublicHeader settings={settings} />

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Dynamic Footer */}
      <footer className="bg-navy-950 text-slate-300 pt-14 pb-8 border-t border-navy-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-navy-900">
            {/* Business Info */}
            <div className="space-y-4 md:col-span-1">
              <div className="flex items-center gap-2">
                {settings?.logoUrl ? (
                  <div className="w-9 h-9 bg-white rounded-lg p-0.5 flex items-center justify-center overflow-hidden">
                    <img src={settings.logoUrl} alt={businessName} className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="w-9 h-9 bg-brand-600 rounded-lg flex items-center justify-center text-white">
                    <Wrench className="w-5 h-5" />
                  </div>
                )}
                <span className="text-lg font-black tracking-tight text-white uppercase">{businessName}</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Biratnagar’s premier hardware & construction materials supplier. Serving contractors, builders, plumbers, electricians, and homeowners with authentic products at wholesale rates.
              </p>
              <div className="flex items-center gap-1.5 text-xs text-brand-500 font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>100% Genuine Supplies Guaranteed</span>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Quick Links</h4>
              <ul className="space-y-2 text-xs">
                <li><Link href="/" className="hover:text-brand-500 transition">Home</Link></li>
                <li><Link href="/products" className="hover:text-brand-500 transition">Products Catalog</Link></li>
                <li><Link href="/categories" className="hover:text-brand-500 transition">Product Categories</Link></li>
                <li><Link href="/about" className="hover:text-brand-500 transition">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-brand-500 transition">Contact Us</Link></li>
              </ul>
            </div>

            {/* Hardware Categories */}
            <div>
              <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Product Lines</h4>
              <ul className="space-y-2 text-xs">
                <li><Link href="/products?category=plumbing-pipes" className="hover:text-brand-500 transition">Plumbing & PVC Pipes</Link></li>
                <li><Link href="/products?category=electrical-wiring" className="hover:text-brand-500 transition">Electrical & Wiring</Link></li>
                <li><Link href="/products?category=building-materials" className="hover:text-brand-500 transition">Cement & Rebar</Link></li>
                <li><Link href="/products?category=paints-finishes" className="hover:text-brand-500 transition">Asian Paints & Emulsions</Link></li>
                <li><Link href="/products?category=hardware-locks" className="hover:text-brand-500 transition">Door Locks & Metalware</Link></li>
              </ul>
            </div>

            {/* Contact Information */}
            <div>
              <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Store Location</h4>
              <ul className="space-y-3 text-xs">
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                  <span>{address}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-brand-500 shrink-0" />
                  <span>{phone} {whatsapp ? `/ ${whatsapp}` : ''}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-brand-500 shrink-0" />
                  <span>{email}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-brand-500 shrink-0" />
                  <span>{openingHours}</span>
                </li>
                {taxId && (
                  <li className="pt-2 text-[11px] text-slate-400 font-mono">
                    PAN / VAT ID: {taxId}
                  </li>
                )}
              </ul>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <p>© {new Date().getFullYear()} {businessName}. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link href="/admin/login" className="hover:text-slate-300 transition">Admin Portal</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
