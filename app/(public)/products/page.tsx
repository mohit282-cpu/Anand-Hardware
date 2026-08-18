import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Filter, Layers, FileText, CheckCircle2, ArrowRight, PackageCheck, SlidersHorizontal } from 'lucide-react';
import { getCategoriesServer, getProductsServer } from '@/lib/supabase/server-queries';
import { Category, Product } from '@/types';

// ISR: Revalidate every 60 seconds
export const revalidate = 60;

interface ProductsPageProps {
  searchParams: {
    category?: string;
    search?: string;
    page?: string;
  };
}

export default async function ProductsCatalogPage({ searchParams }: ProductsPageProps) {
  const selectedCategory = searchParams.category || 'all';
  const searchQuery = (searchParams.search || '').trim().toLowerCase();

  const [categories, allProducts] = await Promise.all([
    getCategoriesServer(true),
    getProductsServer({
      onlyActive: true,
      categoryId: selectedCategory !== 'all' ? selectedCategory : undefined,
      limitCount: 48,
    }),
  ]);

  // Server-side search filtering
  const filteredProducts = allProducts.filter((p) => {
    if (!searchQuery) return true;
    const matchName = p.name.toLowerCase().includes(searchQuery);
    const matchSku = p.sku.toLowerCase().includes(searchQuery);
    const matchDesc = p.description.toLowerCase().includes(searchQuery);
    return matchName || matchSku || matchDesc;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-navy-950 tracking-tight">Products Catalog</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Explore authentic hardware, CPVC pipes, Asian paints, cement, and electrical supplies in Biratnagar.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <form action="/products" method="GET" className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            name="search"
            defaultValue={searchParams.search || ''}
            placeholder="Search by name, SKU, or specs..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
          {selectedCategory !== 'all' && (
            <input type="hidden" name="category" value={selectedCategory} />
          )}
        </form>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <Link
            href="/products"
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              selectedCategory === 'all'
                ? 'bg-navy-950 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Products
          </Link>
          {categories.map((cat) => {
            const isCatActive = selectedCategory === cat.slug || selectedCategory === cat.id;
            return (
              <Link
                key={cat.id}
                href={`/products?category=${cat.slug || cat.id}${searchParams.search ? `&search=${searchParams.search}` : ''}`}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                  isCatActive
                    ? 'bg-navy-950 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat.name}
              </Link>
            );
          })}
        </div>
      </div>

      {/* PRODUCTS GRID */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
          <PackageCheck className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-navy-950">No Matching Products Found</h3>
          <p className="text-xs text-slate-500">Try adjusting your search terms or selecting a different category.</p>
          <Link href="/products" className="inline-block px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-xl shadow">
            Reset Catalog Filters
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((prod) => (
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

              {/* Product Info */}
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
      )}
    </div>
  );
}
