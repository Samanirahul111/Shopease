"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SlidersHorizontal, Grid2X2, List, ChevronDown, X, Search } from "lucide-react";
import ProductCard from "@/components/product/ProductCard";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

interface Product {
  id: string; name: string; slug: string; price: number; comparePrice?: number;
  thumbnail?: string; images: string[]; avgRating: number; totalReviews: number;
  stock: number; brand?: string; isNew?: boolean; isBestSeller?: boolean;
  featured?: boolean; freeShipping?: boolean;
  _count?: { variants: number };
  category: { name: string; slug: string };
}

interface Category { id: string; name: string; slug: string; }

const SORT_OPTIONS = [
  { value: "createdAt_desc", label: "Newest First" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating_desc", label: "Top Rated" },
  { value: "sold_desc", label: "Best Sellers" },
];

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Filters
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    category: searchParams.get("category") || "",
    sort: searchParams.get("sort") || "createdAt_desc",
    minPrice: "",
    maxPrice: "",
    featured: searchParams.get("featured") === "true",
    bestSeller: searchParams.get("bestSeller") === "true",
    isNew: searchParams.get("new") === "true",
  });

  const fetchProducts = useCallback(async (currentPage = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
        sort: filters.sort,
        ...(filters.search && { search: filters.search }),
        ...(filters.category && { category: filters.category }),
        ...(filters.minPrice && { minPrice: filters.minPrice }),
        ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
        ...(filters.featured && { featured: "true" }),
        ...(filters.bestSeller && { bestSeller: "true" }),
        ...(filters.isNew && { new: "true" }),
      });

      const res = await axios.get(`/api/products?${params}`);
      setProducts(res.data.data?.products || []);
      setTotal(res.data.data?.pagination?.total || 0);
      setTotalPages(res.data.data?.pagination?.pages || 1);
      setPage(currentPage);
    } catch (err) {
      console.error("Failed to fetch products", err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    axios.get("/api/categories?parentOnly=true").then((r) => setCategories(r.data.data || []));
  }, []);

  useEffect(() => { fetchProducts(1); }, [fetchProducts]);

  const updateFilter = (key: string, value: unknown) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ search: "", category: "", sort: "createdAt_desc", minPrice: "", maxPrice: "", featured: false, bestSeller: false, isNew: false });
  };

  const activeFiltersCount = [
    filters.category, filters.minPrice, filters.maxPrice,
    filters.featured, filters.bestSeller, filters.isNew,
  ].filter(Boolean).length;

  return (
    <div className="relative min-h-screen bg-gray-50/50">
      {/* Background Mesh */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[50%] h-[50%] bg-teal-200/40 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[50%] h-[50%] bg-violet-200/40 rounded-full blur-[120px]" />
      </div>

      <div className="page-container py-8 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
            {filters.category
              ? categories.find((c) => c.slug === filters.category)?.name || "Shop"
              : filters.search ? `Search: "${filters.search}"` : "All Products"}
          </h1>
          <p className="text-gray-500 font-medium mt-2">{total} products found</p>
        </div>

      <div className="flex gap-6">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block w-72 flex-shrink-0">
          <div className="glass-card p-6 sticky top-24">
            <FilterPanel
              filters={filters}
              categories={categories}
              updateFilter={updateFilter}
              clearFilters={clearFilters}
              activeFiltersCount={activeFiltersCount}
            />
          </div>
        </aside>

        {/* Products Area */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-6 gap-4 flex-wrap glass-card px-4 py-3 border border-white/50 shadow-sm">
            <div className="flex items-center gap-4">
              {/* Mobile Filter Toggle */}
              <button
                onClick={() => setIsFilterOpen(true)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white/60 border border-white/80 rounded-xl text-sm font-semibold hover:bg-white/90 shadow-sm transition-all"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                {activeFiltersCount > 0 && (
                  <span className="w-5 h-5 bg-teal-500 text-white text-xs rounded-full flex items-center justify-center shadow-sm">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={filters.search}
                  onChange={(e) => updateFilter("search", e.target.value)}
                  className="pl-9 pr-4 py-2 bg-white/60 backdrop-blur-md border border-white/80 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent w-48 shadow-sm transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Sort */}
              <div className="relative">
                <select
                  value={filters.sort}
                  onChange={(e) => updateFilter("sort", e.target.value)}
                  className="appearance-none pl-4 pr-9 py-2 bg-white/60 backdrop-blur-md border border-white/80 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-400 cursor-pointer shadow-sm transition-all"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {/* View Mode */}
              <div className="flex bg-white/60 backdrop-blur-md border border-white/80 rounded-xl overflow-hidden shadow-sm p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-white shadow-sm text-gray-900" : "text-gray-400 hover:text-gray-700 hover:bg-white/50"}`}
                >
                  <Grid2X2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-lg transition-all ${viewMode === "list" ? "bg-white shadow-sm text-gray-900" : "text-gray-400 hover:text-gray-700 hover:bg-white/50"}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Active Filters */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {filters.category && (
                <FilterTag label={`Category: ${categories.find((c) => c.slug === filters.category)?.name}`} onRemove={() => updateFilter("category", "")} />
              )}
              {filters.featured && <FilterTag label="Featured" onRemove={() => updateFilter("featured", false)} />}
              {filters.bestSeller && <FilterTag label="Best Sellers" onRemove={() => updateFilter("bestSeller", false)} />}
              {filters.isNew && <FilterTag label="New Arrivals" onRemove={() => updateFilter("isNew", false)} />}
              {(filters.minPrice || filters.maxPrice) && (
                <FilterTag
                  label={`₹${filters.minPrice || "0"} - ₹${filters.maxPrice || "∞"}`}
                  onRemove={() => { updateFilter("minPrice", ""); updateFilter("maxPrice", ""); }}
                />
              )}
              <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 font-medium px-2">
                Clear All
              </button>
            </div>
          )}

          {/* Products Grid */}
          {loading ? (
            <div className={`grid gap-4 ${viewMode === "grid" ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" : "grid-cols-1"}`}>
              {[...Array(12)].map((_, i) => (
                <div key={i} className="rounded-xl overflow-hidden">
                  <div className="aspect-square shimmer-line" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 shimmer-line rounded w-3/4" />
                    <div className="h-3 shimmer-line rounded w-1/2" />
                    <div className="h-5 shimmer-line rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="font-semibold text-gray-900 text-lg">No products found</h3>
              <p className="text-gray-500 text-sm mt-1">Try adjusting your filters or search query</p>
              <button onClick={clearFilters} className="mt-4 btn-primary">Clear Filters</button>
            </div>
          ) : (
            <>
              <div className={`grid gap-4 ${viewMode === "grid" ? "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4" : "grid-cols-1 max-w-2xl"}`}>
                {products.map((product) => (
                  <ProductCard key={product.id} {...product} hasVariants={(product._count?.variants || 0) > 0} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-10">
                  <button
                    onClick={() => fetchProducts(page - 1)}
                    disabled={page === 1}
                    className="px-5 py-2.5 bg-white/60 backdrop-blur-md border border-white/80 shadow-sm rounded-xl text-sm font-semibold text-gray-700 hover:bg-white hover:shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => fetchProducts(pageNum)}
                        className={`w-11 h-11 rounded-xl text-sm font-semibold shadow-sm transition-all ${
                          page === pageNum
                            ? "bg-gray-900 text-white shadow-md shadow-gray-900/20"
                            : "bg-white/60 backdrop-blur-md border border-white/80 text-gray-700 hover:bg-white hover:shadow-md"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => fetchProducts(page + 1)}
                    disabled={page === totalPages}
                    className="px-5 py-2.5 bg-white/60 backdrop-blur-md border border-white/80 shadow-sm rounded-xl text-sm font-semibold text-gray-700 hover:bg-white hover:shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <AnimatePresence>
        {isFilterOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setIsFilterOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              className="fixed left-0 top-0 h-full w-80 bg-white z-50 overflow-y-auto shadow-xl"
            >
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <h2 className="font-bold text-gray-900">Filters</h2>
                <button onClick={() => setIsFilterOpen(false)}>
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-5">
                <FilterPanel
                  filters={filters}
                  categories={categories}
                  updateFilter={updateFilter}
                  clearFilters={clearFilters}
                  activeFiltersCount={activeFiltersCount}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}

function FilterPanel({ filters, categories, updateFilter, clearFilters, activeFiltersCount }: {
  filters: Record<string, unknown>;
  categories: Category[];
  updateFilter: (key: string, value: unknown) => void;
  clearFilters: () => void;
  activeFiltersCount: number;
}) {
  return (
    <div className="space-y-6">
      {activeFiltersCount > 0 && (
        <button onClick={clearFilters} className="w-full text-sm text-red-500 hover:text-red-700 font-medium text-left flex items-center gap-1">
          <X className="w-4 h-4" /> Clear All Filters ({activeFiltersCount})
        </button>
      )}

      {/* Categories */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Categories</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="radio"
              name="category"
              checked={!filters.category}
              onChange={() => updateFilter("category", "")}
              className="w-4 h-4 accent-gray-900"
            />
            <span className="text-sm text-gray-700">All Categories</span>
          </label>
          {categories.map((cat) => (
            <label key={cat.id} className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="radio"
                name="category"
                checked={filters.category === cat.slug}
                onChange={() => updateFilter("category", cat.slug)}
                className="w-4 h-4 accent-gray-900"
              />
              <span className="text-sm text-gray-700">{cat.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Price Range</h3>
        <div className="flex items-center gap-3">
          <input
            type="number"
            placeholder="₹ Min"
            value={filters.minPrice as string}
            onChange={(e) => updateFilter("minPrice", e.target.value)}
            className="w-full input-field py-2 text-sm"
          />
          <span className="text-gray-400 flex-shrink-0">—</span>
          <input
            type="number"
            placeholder="₹ Max"
            value={filters.maxPrice as string}
            onChange={(e) => updateFilter("maxPrice", e.target.value)}
            className="w-full input-field py-2 text-sm"
          />
        </div>
      </div>

      {/* Type Filters */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Filter By</h3>
        <div className="space-y-2">
          {[
            { key: "featured", label: "Featured Products" },
            { key: "bestSeller", label: "Best Sellers" },
            { key: "isNew", label: "New Arrivals" },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={!!filters[key]}
                onChange={(e) => updateFilter(key, e.target.checked)}
                className="w-4 h-4 rounded accent-gray-900"
              />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function FilterTag({ label, onRemove }: { label?: string; onRemove: () => void }) {
  if (!label) return null;
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-medium">
      {label}
      <button onClick={onRemove} className="text-gray-400 hover:text-gray-700">
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="page-container py-16 text-center text-gray-500">Loading...</div>}>
      <ShopContent />
    </Suspense>
  );
}
