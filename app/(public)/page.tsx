import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import {
  ShieldCheck,
  Truck,
  Tag,
  CheckCircle2,
  Package,
  Layers,
  ArrowRight,
  Award,
  BadgePercent,
  Wrench,
  Sparkles
} from 'lucide-react';
import { getCategoriesWithCountServer, getFeaturedProductsServer, getDistinctBrandsServer } from '@/lib/supabase/server-queries';
import { HeroSearch } from '@/components/public/HeroSearch';
import { FeaturedProductCard } from '@/components/public/FeaturedProductCard';
import { QuoteCTASection } from '@/components/public/QuoteCTASection';

export const metadata: Metadata = {
  title: 'Anand Hardware | Building Materials & Hardware Supplier in Biratnagar',
  description:
    'Biratnagar premier hardware & construction materials supplier. Panchakanya PVC pipes, Asian Paints, Shivam Cement, electrical wiring, sanitaryware, door locks, and tools with site delivery across Morang, Nepal.',
};

// ISR: Revalidate every 60 seconds — fast enough for featured toggles
export const revalidate = 60;

export default async function HomePage() {
  const [categories, featuredProducts, distinctBrands] = await Promise.all([
    getCategoriesWithCountServer(true),
    getFeaturedProductsServer(8),
    getDistinctBrandsServer(),
  ]);

  // Fallback brand list if database has no brands yet
  const brandsList =
    distinctBrands.length > 0
      ? distinctBrands
      : ['Panchakanya PVC', 'Asian Paints', 'Shivam Cement', 'Schneider Electric', 'Supreme Pipes', 'Dorex Locks'];

  return (
    <div className="space-y-12 sm:space-y-16 pb-16">
      {/* --------------------------------------------------------- */}
      {/* 1. HERO SECTION (Desktop Two-Column Layout)               */}
      {/* --------------------------------------------------------- */}
      <section className="relative bg-navy-950 text-white overflow-hidden py-12 lg:py-16">
        {/* Subtle background grid pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* LEFT COLUMN: Text & Search */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-bold tracking-wide">
                <ShieldCheck className="w-4 h-4 text-brand-500 shrink-0" />
                <span>Trusted Hardware Supplier in Biratnagar, Nepal</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                Quality Construction Materials & Hardware Supplies
              </h1>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal max-w-2xl">
                Direct supplier of Panchakanya PVC pipes, Asian Paints, Shivam Cement, electrical wiring, sanitaryware, and door hardware. Serving contractors, builders, and homeowners across Morang district.
              </p>

              {/* Interactive Product Search */}
              <div className="pt-2">
                <HeroSearch />
              </div>

              {/* Hero Trust Points */}
              <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-slate-800/80 text-xs font-semibold text-slate-300">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-brand-500 shrink-0" />
                  <span>On-Site Delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0" />
                  <span>100% Genuine</span>
                </div>
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-brand-500 shrink-0" />
                  <span>Wholesale Rates</span>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-brand-500 shrink-0" />
                  <span>Wide Selection</span>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Real Featured Product Visual Composition */}
            <div className="lg:col-span-5 relative">
              <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 border border-slate-800 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-brand-500" />
                    Featured Products
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-brand-500/20 text-brand-400 border border-brand-500/30 rounded-full">
                    Admin Curated
                  </span>
                </div>

                {featuredProducts.length > 0 ? (
                  <>
                    {featuredProducts.slice(0, 3).map((item) => (
                      <Link
                        key={item.id}
                        href={`/products/${item.slug || item.id}`}
                        className="group bg-slate-800/50 hover:bg-slate-800 rounded-2xl p-3.5 border border-slate-700/60 transition flex items-center gap-4"
                      >
                        <div className="w-16 h-16 bg-slate-950 rounded-xl overflow-hidden relative shrink-0">
                          {item.imageUrl ? (
                            <Image
                              src={item.imageUrl}
                              alt={item.name}
                              fill
                              sizes="64px"
                              className="object-cover group-hover:scale-110 transition duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-600">
                              <Package className="w-8 h-8" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-bold text-brand-400 uppercase block tracking-wider">
                            {item.brand || 'Hardware'}
                          </span>
                          <h4 className="text-xs font-bold text-white truncate group-hover:text-brand-400 transition">
                            {item.name}
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Rs. {item.price.toLocaleString()} / {item.unit || 'pcs'}
                          </p>
                        </div>
                        <div className="w-7 h-7 bg-slate-700 group-hover:bg-brand-600 rounded-lg flex items-center justify-center text-white shrink-0 transition">
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </Link>
                    ))}

                    <Link
                      href="/products"
                      className="w-full py-2.5 bg-brand-600/20 hover:bg-brand-600/30 text-brand-400 border border-brand-500/30 rounded-xl text-xs font-bold text-center transition block"
                    >
                      Browse Full Product Catalog →
                    </Link>
                  </>
                ) : (
                  <div className="p-6 text-center space-y-3 bg-slate-800/40 rounded-2xl border border-slate-700/50">
                    <Wrench className="w-8 h-8 text-brand-400 mx-auto opacity-80" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">No Featured Items Selected</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Toggle &quot;Featured&quot; in Admin Product Management to highlight products here.
                    </p>
                    <Link
                      href="/products"
                      className="inline-block px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl transition"
                    >
                      Browse All Products Catalog →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- */}
      {/* 2. CATEGORY SECTION ("Explore Building Categories")        */}
      {/* --------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-navy-950 tracking-tight">
              Explore Building Categories
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
              Find the right materials for your project.
            </p>
          </div>
          <Link
            href="/categories"
            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 self-start sm:self-auto group"
          >
            <span>View All Categories</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
          </Link>
        </div>

        {categories.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {categories.slice(0, 8).map((cat) => (
              <Link
                key={cat.id}
                href={`/products?category=${cat.slug || cat.id}`}
                className="group bg-white rounded-2xl p-5 border border-slate-200 hover:border-brand-500/50 hover:shadow-xl transition duration-300 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="w-full h-32 bg-slate-100 rounded-xl relative overflow-hidden flex items-center justify-center text-slate-400 group-hover:bg-brand-50 transition">
                    {cat.imageUrl ? (
                      <Image
                        src={cat.imageUrl}
                        alt={cat.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <Layers className="w-10 h-10 text-slate-300 group-hover:text-brand-500 transition" />
                    )}
                    <span className="absolute top-2 right-2 px-2 py-0.5 bg-navy-950/80 backdrop-blur-md text-white text-[10px] font-bold rounded-md">
                      {cat.productCount} Items
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-navy-950 group-hover:text-brand-600 transition">
                      {cat.name}
                    </h3>
                    {cat.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed font-normal">
                        {cat.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-2 flex items-center text-xs font-bold text-brand-600 group-hover:text-brand-700 gap-1">
                  <span>View Products</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-slate-500 text-sm">
            Unable to load categories. Please try refreshing.
          </div>
        )}
      </section>

      {/* --------------------------------------------------------- */}
      {/* 3. FEATURED PRODUCTS SECTION ("Featured Building Materials")*/}
      {/* --------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-navy-950 tracking-tight">
              Featured Building Materials
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
              Popular products set as featured by Anand Hardware admin.
            </p>
          </div>
          <Link
            href="/products"
            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 self-start sm:self-auto group"
          >
            <span>Browse Full Catalog</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
          </Link>
        </div>

        {featuredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <FeaturedProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
            <Package className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-navy-950">No Featured Products Set</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No products have been toggled as &quot;Featured&quot; in the Admin Products dashboard yet.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-navy-950 hover:bg-brand-600 text-white font-bold text-xs rounded-xl transition shadow"
            >
              <span>View Entire Product Catalog</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </section>

      {/* --------------------------------------------------------- */}
      {/* 4. TRUSTED BRANDS                                         */}
      {/* --------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <div className="text-center space-y-1">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Trusted Brands Supplied
            </h3>
            <p className="text-sm font-bold text-navy-950">
              Authentic materials from Nepal&apos;s top hardware manufacturers
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-2">
            {brandsList.map((brandName, i) => (
              <div
                key={i}
                className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-2xs hover:bg-brand-50 hover:border-brand-500/40 hover:text-brand-700 transition"
              >
                {brandName}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- */}
      {/* 5. WHY CHOOSE ANAND HARDWARE                              */}
      {/* --------------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-navy-950 tracking-tight">
            Why Contractors & Builders Choose Anand Hardware
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Dedicated supply partner for residential, commercial, and infrastructure projects in Morang.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition space-y-3">
            <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-navy-950">100% Genuine Supplies</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-normal">
              Direct factory distribution guarantees original Panchakanya PVC, Asian Paints, and Shivam Cement without quality compromise.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition space-y-3">
            <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center">
              <BadgePercent className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-navy-950">Wholesale Contractor Pricing</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-normal">
              Special tiered rates for bulk purchases, registered contractors, plumbers, electricians, and real estate developers.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition space-y-3">
            <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-navy-950">Direct On-Site Delivery</h3>
            <p className="text-xs text-slate-500 leading-relaxed font-normal">
              Prompt site dispatch across Biratnagar and surrounding areas in Morang district to keep your construction timeline on schedule.
            </p>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- */}
      {/* 6. BULK / PROJECT QUOTE CTA                               */}
      {/* --------------------------------------------------------- */}
      <QuoteCTASection />
    </div>
  );
}
