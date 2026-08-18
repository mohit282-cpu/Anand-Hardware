import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, ArrowRight, ShieldCheck, Truck, Tag, PhoneCall, CheckCircle2, PackageCheck, Layers, FileText } from 'lucide-react';
import { getCategories, getProducts } from '@/lib/firestore/services';
import { Category, Product } from '@/types';

// Incremental Static Regeneration (ISR): Cache & revalidate every 1 hour (3600s)
export const revalidate = 3600;

export default async function HomePage() {
  const [categories, featuredProducts] = await Promise.all([
    getCategories(true),
    getProducts({ onlyActive: true, featured: true, limitCount: 8 }),
  ]);

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

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
              Quality Construction Materials & Hardware Supplies
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
              From heavy-duty Panchakanya PVC pipes & Asian Paints to Shivam Cement, electrical wiring, and high-security door locks. Wholesale & retail site delivery across Morang district.
            </p>

            {/* Quick Search Bar */}
            <div className="pt-2">
              <form action="/products" method="GET" className="bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20 flex flex-col sm:flex-row items-center gap-2 max-w-2xl">
                <div className="relative flex-1 w-full">
                  <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
                  <input
                    type="text"
                    name="search"
                    placeholder="Search CPVC pipes, cement, paints, wires..."
                    className="w-full pl-12 pr-4 py-3 bg-white text-navy-950 rounded-xl text-sm font-semibold placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg"
                >
                  <span>Search Products</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* Trust Badges */}
            <div className="pt-6 grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-slate-800 text-xs font-medium text-slate-400">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-brand-500" />
                <span>On-Site Delivery in Biratnagar</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-brand-500" />
                <span>100% Genuine Brands</span>
              </div>
              <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                <Tag className="w-4 h-4 text-brand-500" />
                <span>Wholesale & Contractor Rates</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED CATEGORIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-navy-950 tracking-tight">Explore Building Categories</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">Select a hardware category to filter authentic supplies.</p>
          </div>
          <Link
            href="/categories"
            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View All Categories</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.slice(0, 5).map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug || cat.id}`}
              className="group bg-white rounded-2xl p-5 border border-slate-200 hover:border-brand-500/50 hover:shadow-lg transition flex flex-col items-center text-center space-y-3"
            >
              <div className="w-16 h-16 bg-slate-100 group-hover:bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 transition relative overflow-hidden">
                {cat.imageUrl ? (
                  <Image
                    src={cat.imageUrl}
                    alt={cat.name}
                    fill
                    sizes="64px"
                    className="object-cover rounded-2xl group-hover:scale-110 transition"
                  />
                ) : (
                  <Layers className="w-8 h-8" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-navy-950 group-hover:text-brand-600 transition">{cat.name}</h3>
                {cat.description && (
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{cat.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED PRODUCTS SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-navy-950 tracking-tight">Featured Building Materials</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">High-demand items in stock at our Biratnagar warehouse.</p>
          </div>
          <Link
            href="/products"
            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Browse Full Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((prod) => (
            <div
              key={prod.id}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition flex flex-col group"
            >
              {/* Product Image */}
              <div className="relative h-48 bg-slate-100 overflow-hidden">
                {prod.imageUrl ? (
                  <Image
                    src={prod.imageUrl}
                    alt={prod.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 transition duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <PackageCheck className="w-12 h-12" />
                  </div>
                )}
                {prod.stock > 0 ? (
                  <span className="absolute top-3 left-3 px-2.5 py-1 bg-emerald-500 text-white text-[10px] font-bold rounded-full uppercase tracking-wider shadow">
                    In Stock
                  </span>
                ) : (
                  <span className="absolute top-3 left-3 px-2.5 py-1 bg-slate-600 text-white text-[10px] font-bold rounded-full uppercase tracking-wider shadow">
                    Out of Stock
                  </span>
                )}
              </div>

              {/* Product Details */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wider">
                    SKU: {prod.sku}
                  </span>
                  <h3 className="text-base font-bold text-navy-950 line-clamp-1 group-hover:text-brand-600 transition">
                    <Link href={`/products/${prod.slug || prod.id}`}>
                      {prod.name}
                    </Link>
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {prod.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Price</span>
                    <span className="text-lg font-black text-navy-950">
                      Rs. {prod.price.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-500 font-normal"> / {prod.unit}</span>
                  </div>

                  <Link
                    href={`/products/${prod.slug || prod.id}`}
                    className="px-3.5 py-2 bg-navy-950 hover:bg-brand-600 text-white text-xs font-bold rounded-xl transition flex items-center gap-1 shadow"
                  >
                    <span>Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* WHY CHOOSE ANAND HARDWARE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-navy-950 text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-2xl">
          <div className="max-w-2xl space-y-4 relative z-10">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Why Contractors & Builders Choose Anand Hardware
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              We provide direct manufacturer supplies from top national and international brands. Get wholesale pricing for bulk construction projects with fast site delivery across Morang district.
            </p>
            <div className="pt-4 flex flex-wrap gap-4">
              <Link
                href="/contact"
                className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition shadow-lg flex items-center gap-2"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Contact Store Sales</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
