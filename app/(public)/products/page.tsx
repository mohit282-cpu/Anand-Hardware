'use me';
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, Filter, Layers, FileText, Check, SlidersHorizontal, RefreshCw } from 'lucide-react';
import { getCategories, getProducts } from '@/lib/firestore/services';
import { Category, Product } from '@/types';
import { QuotationModal } from '@/components/public/QuotationModal';

function ProductsCatalogContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';
  const initialSearch = searchParams.get('search') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [featuredOnly, setFeaturedOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'name'>('newest');

  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{ id?: string; name: string } | undefined>(undefined);

  useEffect(() => {
    async function loadCatalog() {
      setLoading(true);
      try {
        const [catData, prodData] = await Promise.all([
          getCategories(true),
          getProducts({ onlyActive: true }),
        ]);
        setCategories(catData);
        setProducts(prodData);
      } catch (err) {
        console.error('Error loading products catalog:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCatalog();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category Filter
      if (selectedCategory !== 'all') {
        if (p.categoryId !== selectedCategory && p.slug !== selectedCategory) {
          return false;
        }
      }
      // Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = p.name.toLowerCase().includes(q);
        const matchSku = p.sku.toLowerCase().includes(q);
        const matchBrand = p.brand.toLowerCase().includes(q);
        const matchCat = p.categoryName.toLowerCase().includes(q);
        const matchDesc = p.description.toLowerCase().includes(q);
        if (!matchName && !matchSku && !matchBrand && !matchCat && !matchDesc) {
          return false;
        }
      }
      // In Stock Only Filter
      if (inStockOnly && p.stock <= 0) {
        return false;
      }
      // Featured Only Filter
      if (featuredOnly && !p.featured) {
        return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [products, selectedCategory, searchQuery, inStockOnly, featuredOnly, sortBy]);

  const handleOpenQuote = (product?: Product) => {
    if (product) {
      setSelectedProduct({ id: product.id, name: product.name });
    } else {
      setSelectedProduct(undefined);
    }
    setQuoteModalOpen(true);
  };

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setInStockOnly(false);
    setFeaturedOnly(false);
    setSortBy('newest');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Title */}
      <div className="border-b border-slate-200 pb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-navy-950">Product Catalog</h1>
            <p className="text-xs text-slate-500 mt-1">
              Browse genuine hardware supplies, construction materials, pipes, wiring, and tools in Biratnagar.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Showing {filteredProducts.length} items</span>
          </div>
        </div>
      </div>

      {/* SEARCH AND FILTERS TOOLBAR */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search Input */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by product name, SKU, brand, or specs..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          {/* Category Selector */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Selector */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
            >
              <option value="newest">Sort by: Newest Arrivals</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name">Product Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Filter Toggles Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700">
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
              />
              <span>In-Stock Only</span>
            </label>

            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={featuredOnly}
                onChange={(e) => setFeaturedOnly(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
              />
              <span>Featured Products</span>
            </label>
          </div>

          <button
            onClick={handleResetFilters}
            className="text-xs font-bold text-slate-500 hover:text-brand-600 flex items-center gap-1.5 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset All Filters
          </button>
        </div>
      </div>

      {/* PRODUCT GRID */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="h-80 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <SlidersHorizontal className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-navy-950">No Products Matched Your Criteria</h3>
          <p className="text-xs text-slate-500">
            Try adjusting your search query, clearing category filters, or turning off the in-stock constraint.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-5 py-2.5 bg-brand-600 text-white font-bold text-xs rounded-xl shadow hover:bg-brand-700 transition"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((prod) => (
            <div
              key={prod.id}
              className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-lg transition flex flex-col justify-between group"
            >
              <div>
                {/* Product Image */}
                <div className="relative h-48 bg-slate-100 overflow-hidden flex items-center justify-center">
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

                  {/* Stock Status Badge */}
                  <span
                    className={`absolute top-2 right-2 px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider ${
                      prod.stock <= 0
                        ? 'bg-rose-100 text-rose-700 border border-rose-200'
                        : prod.stock <= prod.lowStockLevel
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {prod.stock <= 0 ? 'Out of stock' : prod.stock <= prod.lowStockLevel ? 'Low stock' : 'In stock'}
                  </span>
                </div>

                {/* Info */}
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-brand-600 uppercase tracking-wider">
                      {prod.categoryName || 'Hardware'}
                    </span>
                    {prod.brand && (
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {prod.brand}
                      </span>
                    )}
                  </div>

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

      {/* Quotation Request Modal */}
      <QuotationModal
        isOpen={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
        initialProduct={selectedProduct}
      />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <React.Suspense fallback={<div className="p-12 text-center text-xs text-slate-500">Loading catalog...</div>}>
      <ProductsCatalogContent />
    </React.Suspense>
  );
}
