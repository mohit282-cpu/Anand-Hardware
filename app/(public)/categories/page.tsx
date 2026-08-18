import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Layers, ArrowRight, PackageCheck } from 'lucide-react';
import { getCategories } from '@/lib/supabase/services';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CategoriesPage() {
  const categories = await getCategories(true);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-black text-navy-950 tracking-tight">Product Categories</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Browse Anand Hardware’s core supply categories for construction, plumbing, electrical, and finishing projects.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/products?category=${cat.slug || cat.id}`}
            className="group bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:border-brand-500/50 transition flex flex-col justify-between space-y-4"
          >
            <div className="space-y-4">
              <div className="relative h-44 w-full bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
                {cat.imageUrl ? (
                  <Image
                    src={cat.imageUrl}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <Layers className="w-12 h-12 text-brand-600" />
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-lg font-bold text-navy-950 group-hover:text-brand-600 transition">
                  {cat.name}
                </h2>
                {cat.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                    {cat.description}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-brand-600 group-hover:text-brand-700">
              <span>View Category Supplies</span>
              <ArrowRight className="w-4 h-4 transition group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
