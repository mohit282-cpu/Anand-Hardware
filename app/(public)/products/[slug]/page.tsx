import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ChevronRight, Layers, FileText, Phone, MessageSquare, ShieldCheck, CheckCircle2, AlertCircle, PackageCheck } from 'lucide-react';
import { getProductBySlugServer } from '@/lib/supabase/server-queries';
import { getProducts } from '@/lib/supabase/services';
import { Product } from '@/types';

// ISR: Revalidate every 60 seconds
export const revalidate = 60;

// generateStaticParams runs at build time (no request scope / no cookies)
// so it must use the browser client, not the server client
export async function generateStaticParams() {
  const products = await getProducts({ onlyActive: true });
  return products.map((p) => ({
    slug: p.slug || p.id,
  }));
}

interface ProductDetailPageProps {
  params: {
    slug: string;
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = params;
  const product = await getProductBySlugServer(slug);

  if (!product) {
    notFound();
  }

  // Parse specs if object or valid JSON string
  let specsObj: Record<string, string> = {};
  if (product.specifications) {
    if (typeof product.specifications === 'object') {
      specsObj = product.specifications;
    } else if (typeof product.specifications === 'string') {
      try {
        specsObj = JSON.parse(product.specifications);
      } catch (e) {
        specsObj = { Specifications: product.specifications };
      }
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link href="/" className="hover:text-brand-600 transition">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/products" className="hover:text-brand-600 transition">Products</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-navy-950 font-bold truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Product Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* Left Column: Image */}
        <div className="relative h-80 sm:h-96 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300">
              <PackageCheck className="w-20 h-20" />
            </div>
          )}
          {product.stock > 0 ? (
            <span className="absolute top-4 left-4 px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full uppercase tracking-wider shadow">
              In Stock ({product.stock} {product.unit})
            </span>
          ) : (
            <span className="absolute top-4 left-4 px-3 py-1 bg-rose-600 text-white text-xs font-bold rounded-full uppercase tracking-wider shadow">
              Out of Stock
            </span>
          )}
        </div>

        {/* Right Column: Information & Actions */}
        <div className="space-y-6 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-50 text-brand-700 text-xs font-bold rounded-lg border border-brand-200">
              <ShieldCheck className="w-4 h-4 text-brand-600" />
              <span>Authentic Product Guarantee</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-navy-950 tracking-tight leading-tight">
              {product.name}
            </h1>

            <p className="text-xs text-slate-400 font-mono">
              SKU: <span className="font-bold text-slate-700">{product.sku}</span>
            </p>

            <div className="pt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-brand-600">
                Rs. {product.price.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500 font-medium">per {product.unit}</span>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
              {product.description}
            </p>
          </div>

          {/* Contact / Inquiry CTA Box */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-navy-950 text-white rounded-xl flex items-center justify-center font-bold">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-navy-950">Need Wholesale Pricing or Site Delivery?</h4>
                <p className="text-[11px] text-slate-500">Contact our sales representative in Biratnagar.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={`tel:+9779801234567`}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" />
                <span>Call Store (+977 9801234567)</span>
              </a>

              <Link
                href="/contact"
                className="flex-1 py-3 px-4 bg-navy-950 hover:bg-brand-600 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Send Direct Inquiry</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Specifications Table */}
      {Object.keys(specsObj).length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-navy-950 uppercase tracking-wider border-b border-slate-100 pb-2">
            Technical Specifications
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {Object.entries(specsObj).map(([key, val]) => (
              <div key={key} className="flex justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 font-medium">
                <span className="text-slate-500">{key}:</span>
                <span className="font-bold text-navy-950">{val}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
