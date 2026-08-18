'use me';
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronRight, Layers, FileText, Phone, MessageSquare, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { getProductBySlug } from '@/lib/firestore/services';
import { Product } from '@/types';
import { QuotationModal } from '@/components/public/QuotationModal';

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      if (!slug) return;
      setLoading(true);
      try {
        const data = await getProductBySlug(slug);
        setProduct(data);
      } catch (err) {
        console.error('Error loading product details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="h-96 bg-white rounded-2xl border border-slate-200 animate-pulse" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-slate-400 mx-auto" />
        <h2 className="text-2xl font-bold text-navy-950">Product Not Found</h2>
        <p className="text-xs text-slate-500">The product you are looking for does not exist or may have been deactivated.</p>
        <Link
          href="/products"
          className="inline-block px-5 py-2.5 bg-brand-600 text-white font-bold text-xs rounded-xl shadow"
        >
          Return to Catalog
        </Link>
      </div>
    );
  }

  // Parse specs if valid JSON string
  let specsObj: Record<string, string> = {};
  if (typeof product.specifications === 'string' && product.specifications.trim()) {
    try {
      specsObj = JSON.parse(product.specifications);
    } catch {
      // Not JSON, treat as raw text
    }
  } else if (typeof product.specifications === 'object') {
    specsObj = product.specifications || {};
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link href="/" className="hover:text-navy-950 transition">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/products" className="hover:text-navy-950 transition">Products</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900 font-bold line-clamp-1">{product.name}</span>
      </nav>

      {/* Main Detail Grid */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-sm grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Product Image */}
        <div className="relative h-80 sm:h-96 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 flex items-center justify-center">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="flex flex-col items-center text-slate-400 text-sm">
              <Layers className="w-12 h-12 mb-2 text-slate-300" />
              <span>Anand Hardware — Biratnagar</span>
            </div>
          )}

          {/* Stock Badge */}
          <span
            className={`absolute top-4 right-4 px-3 py-1 text-xs font-bold rounded-xl uppercase tracking-wider ${
              product.stock <= 0
                ? 'bg-rose-100 text-rose-700 border border-rose-200'
                : product.stock <= product.lowStockLevel
                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}
          >
            {product.stock <= 0 ? 'Out of stock' : product.stock <= product.lowStockLevel ? 'Low stock' : 'In stock'}
          </span>
        </div>

        {/* Product Info & Actions */}
        <div className="space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-brand-50 text-brand-700 text-xs font-bold rounded-lg border border-brand-200">
                {product.categoryName || 'Hardware'}
              </span>
              {product.brand && (
                <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg">
                  Brand: {product.brand}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-navy-950">{product.name}</h1>

            <p className="text-xs font-mono text-slate-500">
              SKU: <span className="font-semibold text-slate-800">{product.sku || 'N/A'}</span>
            </p>

            {/* Price Box */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-baseline justify-between">
              <div>
                <span className="text-xs text-slate-500 font-medium block">Wholesale / Unit Rate</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-2xl sm:text-3xl font-black text-navy-950">Rs. {product.price.toLocaleString()}</span>
                  <span className="text-xs text-slate-500 font-semibold">/ {product.unit}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Available in Warehouse
                </span>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Description</h3>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                {product.description || 'High quality hardware product supplied directly by Anand Hardware, Biratnagar, Nepal.'}
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => setQuoteModalOpen(true)}
              className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" />
              <span>Request Official Quotation</span>
            </button>

            <div className="grid grid-cols-2 gap-3">
              <a
                href="tel:+97721523456"
                className="py-3 bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
              >
                <Phone className="w-3.5 h-3.5 text-brand-400" />
                <span>Call Store</span>
              </a>
              <a
                href="https://wa.me/9779801234567"
                target="_blank"
                rel="noreferrer"
                className="py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp Inquiry</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Specifications Breakdown */}
      {Object.keys(specsObj).length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-4">
          <h2 className="text-lg font-black text-navy-950 border-b border-slate-100 pb-3">Technical Specifications</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(specsObj).map(([key, val]) => (
              <div key={key} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
                <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">{key}</span>
                <span className="text-sm font-bold text-navy-950 block mt-0.5">{val}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quotation Request Modal */}
      <QuotationModal
        isOpen={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
        initialProduct={{ id: product.id, name: product.name }}
      />
    </div>
  );
}
