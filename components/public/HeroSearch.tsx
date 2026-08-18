'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, ArrowRight, Package, Tag } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface Suggestion {
  id: string;
  name: string;
  slug: string;
  sku: string;
  categoryName?: string;
  brand?: string;
  price?: number;
}

export function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search for suggestions
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from('products')
          .select('id, name, slug, sku, category_name, brand, price')
          .or(`name.ilike.%${trimmed}%,sku.ilike.%${trimmed}%,brand.ilike.%${trimmed}%`)
          .eq('active', true)
          .limit(5);

        if (data) {
          setSuggestions(
            data.map((p: any) => ({
              id: p.id,
              name: p.name,
              slug: p.slug || p.id,
              sku: p.sku,
              categoryName: p.category_name,
              brand: p.brand,
              price: Number(p.price) || 0,
            }))
          );
          setIsOpen(true);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/products?search=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl">
      <form
        onSubmit={handleSubmit}
        className="bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20 flex flex-col sm:flex-row items-center gap-2 shadow-2xl"
      >
        <div className="relative flex-1 w-full">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.trim().length >= 2 && setIsOpen(true)}
            placeholder="Search PVC pipes, cement, paints, wires..."
            className="w-full pl-12 pr-4 py-3 bg-white text-navy-950 rounded-xl text-sm font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-inner"
          />
        </div>
        <button
          type="submit"
          className="w-full sm:w-auto px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-black text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg shrink-0"
        >
          <span>Search Products</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* Autocomplete Suggestion Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden text-slate-900">
          <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">Search Suggestions</span>
            {loading && <span>Searching...</span>}
          </div>

          {suggestions.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {suggestions.map((item) => (
                <Link
                  key={item.id}
                  href={`/products/${item.slug}`}
                  onClick={() => setIsOpen(false)}
                  className="p-3 hover:bg-brand-50/60 transition flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-brand-600 shrink-0 group-hover:bg-brand-600 group-hover:text-white transition">
                      <Package className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-navy-950 truncate group-hover:text-brand-600 transition">
                        {item.name}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        {item.brand && <span className="font-semibold">{item.brand}</span>}
                        {item.sku && <span>SKU: {item.sku}</span>}
                      </div>
                    </div>
                  </div>
                  {typeof item.price === 'number' && item.price > 0 && (
                    <span className="text-xs font-black text-navy-950 shrink-0">
                      Rs. {item.price.toLocaleString()}
                    </span>
                  )}
                </Link>
              ))}
              <button
                type="button"
                onClick={handleSubmit}
                className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 text-brand-600 font-bold text-xs text-center transition flex items-center justify-center gap-1.5"
              >
                <span>View all results for &quot;{query}&quot;</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            !loading && (
              <div className="p-4 text-center text-xs text-slate-500">
                No matching products found for &quot;{query}&quot;. Press Enter to view search page.
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
