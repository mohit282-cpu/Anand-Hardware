'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PackageCheck, ArrowRight, FileText, CheckCircle2 } from 'lucide-react';
import { Product } from '@/types';
import { QuotationModal } from '@/components/public/QuotationModal';

interface ProductCardProps {
  product: Product;
}

export function FeaturedProductCard({ product }: ProductCardProps) {
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);

  return (
    <>
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group hover:-translate-y-1">
        {/* Product Image */}
        <div className="relative h-52 bg-slate-100 overflow-hidden">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover group-hover:scale-105 transition duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100">
              <PackageCheck className="w-12 h-12 stroke-[1.5]" />
              <span className="text-[11px] font-semibold mt-1">Anand Hardware</span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            {product.stock > 0 ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-black rounded-full uppercase tracking-wider shadow-md">
                <CheckCircle2 className="w-3 h-3" />
                In Stock
              </span>
            ) : (
              <span className="px-2.5 py-1 bg-slate-700 text-white text-[10px] font-black rounded-full uppercase tracking-wider shadow-md">
                Out of Stock
              </span>
            )}
          </div>

          {product.brand && (
            <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-navy-950/80 backdrop-blur-md text-white text-[10px] font-bold rounded-lg shadow">
              {product.brand}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <span>SKU: {product.sku}</span>
              {product.unit && <span>/ {product.unit}</span>}
            </div>

            <h3 className="text-base font-black text-navy-950 line-clamp-1 group-hover:text-brand-600 transition">
              <Link href={`/products/${product.slug || product.id}`}>
                {product.name}
              </Link>
            </h3>

            {product.description && (
              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-medium">
                {product.description}
              </p>
            )}
          </div>

          {/* Pricing & Actions */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Price</span>
              <div>
                <span className="text-lg font-black text-navy-950">
                  Rs. {product.price.toLocaleString()}
                </span>
                <span className="text-xs text-slate-500 font-normal"> / {product.unit || 'pcs'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Link
                href={`/products/${product.slug || product.id}`}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-navy-950 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1"
              >
                <span>View Product</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => setQuoteModalOpen(true)}
                className="py-2.5 px-3 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 shadow-sm"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Request Quote</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <QuotationModal
        isOpen={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
        initialProduct={{ id: product.id, name: product.name }}
      />
    </>
  );
}
