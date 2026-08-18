'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, ArrowRight, ShieldCheck, Truck, Tag, PhoneCall, CheckCircle2, PackageCheck, Layers, FileText } from 'lucide-react';
import { getCategories, getProducts } from '@/lib/firestore/services';
import { seedDemoDataIfEmpty } from '@/lib/firebase/seed';
import { Category, Product } from '@/types';
import { QuotationModal } from '@/components/public/QuotationModal';

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{ id?: string; name: string } | undefined>(undefined);

  useEffect(() => {
    async function loadData() {
      try {
        // Auto-seed demo dataset if database is brand new
        await seedDemoDataIfEmpty();
        const [catData, prodData] = await Promise.all([
          getCategories(true),
          getProducts({ onlyActive: true, featuredOnly: true, limitCount: 8 }),
        ]);
        setCategories(catData);
        setFeaturedProducts(prodData);
      } catch (err) {
        console.error('Error initializing Home page data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleOpenQuote = (product?: Product) => {
    if (product) {
      setSelectedProduct({ id: product.id, name: product.name });
    } else {
      setSelectedProduct(undefined);
    }
    setQuoteModalOpen(true);
  };

  return (
    <div className="space-y-16 pb-16">
      {/* HERO SECTION */}
      <section className="relative bg-navy-950 text-white overflow-hidden py-16 lg:py-24">
        {/* Subtle background mesh pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl space-y-6 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-brand-500" />
              Trusted Hardware Supplier in Biratnagar, Nepal
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
              Quality Building Supplies <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-amber-400 to-amber-200">
                & Construction Hardware
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              Serving contractors, plumbers, electricians, and home builders with genuine PVC pipes, electrical wiring, cements, Asian paints, tools, and door locks at competitive wholesale rates.
            </p>

            {/* Product Search Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  window.location.href = `/products?search=${encodeURIComponent(searchQuery.trim())}`;
                }
              }}
              className="flex flex-col sm:flex-row items-center gap-2 p-2 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl max-w-2xl"
            >
              <div className="relative w-full flex items-center">
                <Search className="w-5 h-5 text-slate-400 absolute left-3.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products (e.g. PVC Pipe, Wire, Cement, Lock...)"
                  className="w-full pl-11 pr-4 py-3 bg-transparent text-white placeholder-slate-400 text-sm focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl transition shadow-lg shrink-0 flex items-center justify-center gap-2"
              >
                <span>Search</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/products"
                className="px-6 py-3.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-xl shadow-lg transition hover:-translate-y-0.5"
              >
                Browse Catalog
              </Link>
              <button
                onClick={() => handleOpenQuote()}
                className="px-6 py-3.5 bg-navy-800 hover:bg-navy-700 text-slate-100 border border-slate-700 text-sm font-bold rounded-xl transition hover:-translate-y-0.5 flex items-center gap-2"
              >
                <FileText className="w-4 h-4 text-brand-400" />
                Request a Quote
              </button>
            </div>

            {/* Value Badges */}
            <div className="pt-6 grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-slate-800/80 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>100% Genuine Brands</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-brand-400 shrink-0" />
                <span>Site Delivery in Morang</span>
              </div>
              <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                <Tag className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Wholesale & Retail Rates</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold text-brand-600 uppercase tracking-widest block mb-1">Product Lines</span>
            <h2 className="text-2xl sm:text-3xl font-black text-navy-950">Shop By Category</h2>
          </div>
          <Link
            href="/categories"
            className="text-xs font-bold text-brand-700 hover:text-brand-800 flex items-center gap-1 group"
          >
            <span>View All Categories</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-44 bg-slate-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/products?category=${cat.id}`}
                className="group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition border border-slate-200/80 bg-white flex flex-col h-56"
              >
                <div className="relative h-36 w-full bg-slate-100 overflow-hidden">
                  {cat.imageUrl ? (
                    <img
                      src={cat.imageUrl}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-navy-950/20 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4">
                    <h3 className="text-lg font-bold text-white group-hover:text-brand-300 transition">
                      {cat.name}
                    </h3>
                  </div>
                </div>
                <div className="p-4 flex-1 flex items-center justify-between bg-white">
                  <p className="text-xs text-slate-500 line-clamp-1">{cat.description || 'Quality hardware supplies'}</p>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-1 transition shrink-0 ml-2" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="bg-slate-100/70 py-12 border-y border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-bold text-brand-600 uppercase tracking-widest block mb-1">Handpicked Stock</span>
              <h2 className="text-2xl sm:text-3xl font-black text-navy-950">Featured Hardware Products</h2>
            </div>
            <Link
              href="/products"
              className="text-xs font-bold text-brand-700 hover:text-brand-800 flex items-center gap-1 group"
            >
              <span>Explore All Products</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-72 bg-white rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {featuredProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-lg transition flex flex-col justify-between group"
                >
                  <div>
                    {/* Image */}
                    <div className="relative h-44 bg-slate-100 overflow-hidden flex items-center justify-center">
                      {prod.imageUrl ? (
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center text-slate-400 text-xs">
                          <Layers className="w-8 h-8 mb-1 text-slate-300" />
                          <span>Anand Hardware</span>
                        </div>
                      )}

                      {/* Featured Badge */}
                      <span className="absolute top-2 left-2 px-2.5 py-1 bg-brand-600 text-white text-[10px] font-bold rounded-lg uppercase tracking-wider shadow">
                        Featured
                      </span>

                      {/* Stock Status Badge */}
                      <span
                        className={`absolute top-2 right-2 px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider ${
                          prod.stock <= 0
                            ? 'bg-rose-100 text-rose-700'
                            : prod.stock <= prod.lowStockLevel
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {prod.stock <= 0 ? 'Out of stock' : prod.stock <= prod.lowStockLevel ? 'Low stock' : 'In stock'}
                      </span>
                    </div>

                    {/* Meta */}
                    <div className="p-4 space-y-2">
                      <span className="text-[11px] font-semibold text-brand-600 uppercase tracking-wider block">
                        {prod.categoryName || 'Hardware'}
                      </span>
                      <Link href={`/products/${prod.slug}`} className="block">
                        <h3 className="text-sm font-bold text-navy-950 group-hover:text-brand-600 transition line-clamp-2">
                          {prod.name}
                        </h3>
                      </Link>
                      <p className="text-xs text-slate-500 font-mono">SKU: {prod.sku || 'N/A'}</p>
                      <div className="pt-1 flex items-baseline gap-1">
                        <span className="text-lg font-black text-navy-950">Rs. {prod.price.toLocaleString()}</span>
                        <span className="text-xs text-slate-500 font-medium">/ {prod.unit}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-4 pt-0">
                    <button
                      onClick={() => handleOpenQuote(prod)}
                      className="w-full py-2.5 bg-navy-900 hover:bg-brand-600 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Request Quote</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* WHY CHOOSE ANAND HARDWARE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-brand-600 uppercase tracking-widest block mb-1">Our Advantage</span>
          <h2 className="text-3xl font-black text-navy-950">Why Builders & Contractors Trust Us</h2>
          <p className="text-sm text-slate-600 mt-2">
            Providing reliable quality and competitive pricing for building projects across Biratnagar and Eastern Nepal.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-brand-600 font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-navy-950">100% Genuine Supplies</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              We source directly from authorized factory distributors (Panchakanya, Shivam Cement, Asian Paints, Stanley, Godrej).
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-brand-600 font-bold">
              <Tag className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-navy-950">Wholesale Site Pricing</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Special tiered rates for bulk contractor purchases, commercial construction sites, and bulk rebar/cement orders.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-brand-600 font-bold">
              <PackageCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-navy-950">Ready Local Inventory</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Large physical warehouse stock in Biratnagar ensures no project delays due to out-of-stock materials.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-brand-600 font-bold">
              <PhoneCall className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-navy-950">Fast Quotations</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Submit your materials list online or via WhatsApp and receive a comprehensive formal quotation within hours.
            </p>
          </div>
        </div>
      </section>

      {/* CALL TO ACTION BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-navy-900 rounded-3xl p-8 sm:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-2xl">
          <div className="space-y-4 max-w-xl text-center md:text-left relative z-10">
            <h2 className="text-3xl sm:text-4xl font-black">Need Bulk Construction Materials?</h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Whether you are laying plumbing lines, wiring an apartment building, or pouring concrete, Anand Hardware is your one-stop partner in Biratnagar.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10 shrink-0">
            <button
              onClick={() => handleOpenQuote()}
              className="px-6 py-3.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-xl shadow-lg transition flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Request Formal Quotation
            </button>
            <a
              href="tel:+97721523456"
              className="px-6 py-3.5 bg-navy-800 hover:bg-navy-700 text-slate-200 text-sm font-bold rounded-xl transition border border-slate-700 flex items-center gap-2"
            >
              <PhoneCall className="w-4 h-4 text-brand-400" />
              Call Store (+977 21-523456)
            </a>
          </div>
        </div>
      </section>

      {/* Quotation Request Modal */}
      <QuotationModal
        isOpen={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
        initialProduct={selectedProduct}
      />
    </div>
  );
}
