'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Phone, MapPin, Clock, Menu, X, FileText, Wrench, UserCheck, MessageSquare } from 'lucide-react';
import { QuotationModal } from '@/components/public/QuotationModal';
import { BusinessSettings } from '@/types';

interface PublicHeaderProps {
  settings?: BusinessSettings;
}

export function PublicHeader({ settings }: PublicHeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);

  const [logoError, setLogoError] = useState(false);

  const businessName = settings?.businessName || 'ANAND HARDWARE';
  const address = settings?.address || 'Main Road, Ward 7, Biratnagar, Nepal';
  const phone = settings?.phone || '+977 21-523456';
  const whatsapp = settings?.whatsapp;
  const openingHours = settings?.openingHours || 'Sun – Fri: 8:00 AM – 7:00 PM';
  const logoUrl = settings?.logoUrl;

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Products', href: '/products' },
    { name: 'Categories', href: '/categories' },
    { name: 'About Us', href: '/about' },
    { name: 'Contact Us', href: '/contact' },
  ];

  return (
    <>
      {/* Top Banner Bar */}
      <div className="bg-navy-950 text-slate-300 text-xs py-2 px-4 border-b border-navy-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-center sm:justify-start">
            <span className="flex items-center gap-1.5 text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-brand-500 shrink-0" />
              <span>{address}</span>
            </span>
            <span className="hidden md:flex items-center gap-1.5 border-l border-navy-800 pl-4 text-slate-300">
              <Clock className="w-3.5 h-3.5 text-brand-500 shrink-0" />
              <span>{openingHours}</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href={`tel:${phone.replace(/[^0-9+]/g, '')}`}
              className="flex items-center gap-1.5 font-medium hover:text-white transition"
            >
              <Phone className="w-3.5 h-3.5 text-brand-500 shrink-0" />
              <span>{phone}</span>
            </a>
            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1.5 font-medium text-emerald-400 hover:text-emerald-300 transition"
              >
                <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                <span>WhatsApp</span>
              </a>
            )}
            <span className="text-slate-700">|</span>
            <Link
              href="/admin/login"
              className="flex items-center gap-1 text-slate-400 hover:text-brand-400 transition font-medium"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Staff Portal</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            {logoUrl && !logoError ? (
              <div className="relative w-11 h-11 bg-white rounded-xl flex items-center justify-center p-1 shadow-md border border-slate-200 group-hover:scale-105 transition overflow-hidden">
                <img
                  src={logoUrl}
                  alt={businessName}
                  className="w-full h-full object-contain"
                  onError={() => setLogoError(true)}
                />
              </div>
            ) : (
              <div className="w-11 h-11 bg-navy-950 rounded-xl flex items-center justify-center text-brand-500 shadow-md group-hover:scale-105 transition">
                <Wrench className="w-6 h-6" />
              </div>
            )}
            <div>
              <span className="text-xl font-black tracking-tight text-navy-950 block leading-none uppercase">
                {businessName}
              </span>
              <span className="text-[10px] font-bold tracking-widest text-brand-600 uppercase block mt-1">
                Building Supplies & Hardware
              </span>
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
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                    isActive
                      ? 'bg-navy-950 text-white shadow-sm'
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
              type="button"
              onClick={() => setQuoteModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-xl shadow-md transition hover:-translate-y-0.5"
            >
              <FileText className="w-4 h-4" />
              <span>REQUEST QUOTE</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition"
            aria-label="Toggle Navigation Menu"
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
                  className={`block px-4 py-2.5 rounded-xl text-sm font-bold ${
                    isActive ? 'bg-navy-950 text-white' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setQuoteModalOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-sm shadow-md"
              >
                <FileText className="w-4 h-4" />
                <span>REQUEST QUOTE</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Global Quotation Request Modal */}
      <QuotationModal
        isOpen={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
      />
    </>
  );
}
