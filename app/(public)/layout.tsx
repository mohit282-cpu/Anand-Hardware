'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Phone, MapPin, Clock, Menu, X, ShieldCheck, FileText, Wrench } from 'lucide-react';
import { QuotationModal } from '@/components/public/QuotationModal';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Products Catalog', href: '/products' },
    { name: 'Categories', href: '/categories' },
    { name: 'About Us', href: '/about' },
    { name: 'Contact Us', href: '/contact' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Banner Bar */}
      <div className="bg-navy-950 text-slate-300 text-xs py-2 px-4 border-b border-navy-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-brand-500" />
              Main Road, Ward 7, Biratnagar, Nepal
            </span>
            <span className="hidden md:flex items-center gap-1.5 border-l border-navy-800 pl-4">
              <Clock className="w-3.5 h-3.5 text-brand-500" />
              Sun - Fri: 8:00 AM - 7:00 PM
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a href="tel:+97721523456" className="flex items-center gap-1.5 font-medium hover:text-white transition">
              <Phone className="w-3.5 h-3.5 text-brand-500" />
              +977 21-523456
            </a>
            <span className="text-slate-600">|</span>
            <Link href="/admin/login" className="text-slate-400 hover:text-brand-500 transition">
              Staff Login
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 bg-navy-900 rounded-xl flex items-center justify-center text-brand-500 shadow-lg group-hover:scale-105 transition">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-navy-950 block">ANAND HARDWARE</span>
              <span className="text-[10px] font-semibold tracking-widest text-brand-600 uppercase block">Building Supplies & Hardware</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                    isActive
                      ? 'bg-navy-900 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-navy-950'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Header Action Button */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => setQuoteModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-xl shadow-md transition hover:-translate-y-0.5"
            >
              <FileText className="w-4 h-4" />
              Request Quote
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-2.5 rounded-xl text-sm font-semibold ${
                    isActive ? 'bg-navy-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
            <div className="pt-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setQuoteModalOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-brand-600 text-white font-bold rounded-xl text-sm shadow-md"
              >
                <FileText className="w-4 h-4" />
                Request Quote
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-navy-950 text-slate-300 pt-14 pb-8 border-t border-navy-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-navy-900">
            {/* Business Info */}
            <div className="space-y-4 md:col-span-1">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-brand-600 rounded-lg flex items-center justify-center text-white">
                  <Wrench className="w-5 h-5" />
                </div>
                <span className="text-lg font-black tracking-tight text-white">ANAND HARDWARE</span>
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
                <li><Link href="/about" className="hover:text-brand-500 transition">About Anand Hardware</Link></li>
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
                  <span>Main Road, Ward No. 7, Biratnagar, Morang, Nepal</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-brand-500 shrink-0" />
                  <span>+977 21-523456 / +977 9801234567</span>
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-brand-500 shrink-0" />
                  <span>Sun - Fri: 8:00 AM - 7:00 PM</span>
                </li>
                <li className="pt-2 text-[11px] text-slate-500">
                  PAN / VAT Registered Business
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <p>© {new Date().getFullYear()} Anand Hardware, Biratnagar. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link href="/admin/login" className="hover:text-slate-300 transition">Admin Portal</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Global Quotation Request Modal */}
      <QuotationModal
        isOpen={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
      />
    </div>
  );
}
