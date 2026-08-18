'use me';
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Layers } from 'lucide-react';
import { getCategories } from '@/lib/firestore/services';
import { Category } from '@/types';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getCategories(true);
        setCategories(data);
      } catch (err) {
        console.error('Error fetching categories:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-black text-navy-950">Product Categories</h1>
        <p className="text-xs text-slate-500 mt-1">
          Explore complete hardware product lines available at Anand Hardware in Biratnagar.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-56 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.id}`}
              className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-xl transition flex flex-col group"
            >
              <div className="relative h-44 bg-slate-100 overflow-hidden">
                {cat.imageUrl ? (
                  <img
                    src={cat.imageUrl}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <Layers className="w-10 h-10 mb-1 text-slate-300" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-4 right-4">
                  <h2 className="text-lg font-black text-white group-hover:text-brand-300 transition">
                    {cat.name}
                  </h2>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                  {cat.description || 'Quality hardware and construction materials.'}
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs font-bold text-brand-600">
                  <span>Browse Products</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
