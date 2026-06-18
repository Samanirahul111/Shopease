"use client";

import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ShoppingCart, Heart, User, Menu, X,
  ChevronDown, Bell, Package, LogOut, LayoutDashboard,
  Settings, Truck, ShieldCheck,
} from "lucide-react";
import { useAuthStore, useCartStore } from "@/store";
import axios from "axios";
import toast from "react-hot-toast";

interface Category {
  id: string;
  name: string;
  slug: string;
  children?: Category[];
}

const Navbar = memo(function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isAdmin, logout } = useAuthStore();
  const { items, isOpen, openCart, closeCart } = useCartStore();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ products: Array<{ id: string; name: string; slug: string; thumbnail?: string }>; categories: Category[] } | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    axios.get("/api/categories?parentOnly=true&withCount=true")
      .then((r) => setCategories(r.data.data || []))
      .catch(() => { });
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    clearTimeout(searchTimeout.current);
    if (query.trim().length < 2) { setSearchResults(null); return; }
    searchTimeout.current = setTimeout(async () => {
      try {
        const r = await axios.get(`/api/search?q=${encodeURIComponent(query)}&limit=6`);
        setSearchResults(r.data.data);
      } catch { }
    }, 300);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery)}`);
      setSearchResults(null);
      setIsSearchFocused(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post("/api/auth/logout");
      logout();
      router.push("/");
      toast.success("Logged out successfully");
    } catch {
      logout();
      router.push("/");
    }
  };

  const cartCount = itemCount || 0;

  return (
    <>
      {/* Announcement Bar */}
      <div className="bg-gray-900 text-white text-xs py-2 text-center">
        <p className="flex items-center justify-center gap-2">
          <Truck className="w-3.5 h-3.5" />
          Free shipping on orders above ₹499 &nbsp;|&nbsp;
          <ShieldCheck className="w-3.5 h-3.5" />
          30-day easy returns
        </p>
      </div>

      {/* Main Navbar */}
      <header
        className={`sticky top-0 z-50 bg-white transition-all duration-200 ${isScrolled ? "shadow-md" : "border-b border-gray-100"
          }`}
      >
        <div className="page-container">
          <nav className="flex items-center h-16 gap-4">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0 flex items-center gap-1.5 group">
              <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                <Package className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                Shop<span className="text-green-600">Ease</span>
              </span>
            </Link>

            {/* Desktop Categories */}
            <nav className="hidden lg:flex items-center gap-0.5 ml-4">
              <Link
                href="/shop"
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${pathname === "/shop" ? "text-gray-900 bg-gray-100" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
              >
                Shop
              </Link>
              {categories.slice(0, 5).map((cat) => (
                <div key={cat.id} className="relative group">
                  <Link href={`/shop?category=${cat.slug}`} className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
                    {cat.name}
                    {cat.children?.length ? <ChevronDown className="w-3.5 h-3.5" /> : null}
                  </Link>
                  {cat.children?.length ? (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      {cat.children.map((child) => (
                        <Link
                          key={child.id}
                          href={`/shop?category=${child.slug}`}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </nav>

            {/* Search Bar */}
            <div ref={searchRef} className="flex-1 max-w-md relative hidden md:block mx-6">
              <form onSubmit={handleSearchSubmit}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setTimeout(() => setIsSearchFocused(false), 150)}
                    className="w-full h-10 pl-10 pr-4 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-gray-400 focus:outline-none transition-all shadow-sm"
                  />
                </div>
              </form>

              {/* Search Results Dropdown */}
              <AnimatePresence>
                {isSearchFocused && searchResults && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 max-h-96 overflow-y-auto"
                  >
                    {searchResults.categories?.length > 0 && (
                      <div className="px-4 py-2">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Categories</p>
                        {searchResults.categories.map((cat) => (
                          <Link
                            key={cat.id}
                            href={`/shop?category=${cat.slug}`}
                            className="flex items-center gap-2 py-1.5 text-sm text-gray-700 hover:text-gray-900"
                          >
                            <Search className="w-3.5 h-3.5 text-gray-400" />
                            {cat.name}
                          </Link>
                        ))}
                      </div>
                    )}
                    {searchResults.products?.length > 0 && (
                      <div className="px-4 py-2">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Products</p>
                        {searchResults.products.map((p) => (
                          <Link
                            key={p.id}
                            href={`/product/${p.slug}`}
                            className="flex items-center gap-3 py-2 hover:bg-gray-50 rounded-lg px-1"
                          >
                            {p.thumbnail && (
                              <img src={p.thumbnail} alt={p.name} className="w-10 h-10 object-cover rounded-lg" />
                            )}
                            <span className="text-sm text-gray-700">{p.name}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                    {searchResults.products?.length === 0 && searchResults.categories?.length === 0 && (
                      <div className="px-4 py-6 text-center text-sm text-gray-500">No results found</div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2 ml-auto">
              {/* Wishlist */}
              <Link
                href={isAuthenticated ? "/wishlist" : "/login"}
                className="relative w-10 h-10 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all active:scale-95"
              >
                <Heart className="w-5 h-5" />
              </Link>

              {/* Cart */}
              <button
                onClick={openCart}
                className="relative w-10 h-10 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all active:scale-95"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-gray-900 text-white text-[10px] rounded-full flex items-center justify-center font-bold shadow-sm">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </button>

              {/* User Menu */}
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full object-cover border-2 border-gray-200" />
                    ) : (
                      <div className="w-7 h-7 bg-gray-900 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{user?.name?.[0]?.toUpperCase()}</span>
                      </div>
                    )}
                    <span className="hidden md:block text-sm font-medium max-w-[100px] truncate">{user?.name}</span>
                    <ChevronDown className="w-4 h-4 hidden md:block" />
                  </button>

                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -5 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -5 }}
                          className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50"
                        >
                          <div className="px-4 py-2 border-b border-gray-100 mb-1">
                            <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                          </div>

                          {isAdmin && (
                            <Link href="/admin" className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium">
                              <LayoutDashboard className="w-4 h-4" /> Admin Panel
                            </Link>
                          )}
                          <Link href="/dashboard" className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                            <User className="w-4 h-4" /> My Account
                          </Link>
                          <Link href="/dashboard/orders" className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                            <Package className="w-4 h-4" /> My Orders
                          </Link>
                          <Link href="/dashboard/profile" className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                            <Settings className="w-4 h-4" /> Settings
                          </Link>
                          <div className="border-t border-gray-100 mt-1 pt-1">
                            <button
                              onClick={handleLogout}
                              className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <LogOut className="w-4 h-4" /> Sign Out
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="hidden md:flex items-center gap-2 h-10 px-5 text-sm font-medium bg-gray-900 text-white rounded-xl hover:bg-gray-700 transition-all active:scale-95 shadow-sm"
                >
                  <User className="w-4 h-4" /> Sign In
                </Link>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </nav>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden border-t border-gray-100 bg-white overflow-hidden"
            >
              <div className="page-container py-4 space-y-2">
                {/* Mobile Search */}
                <form onSubmit={handleSearchSubmit} className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
                  />
                </form>

                <Link href="/shop" className="block py-2 text-sm font-medium text-gray-700 hover:text-gray-900">All Products</Link>
                {categories.map((cat) => (
                  <Link key={cat.id} href={`/shop?category=${cat.slug}`} className="block py-2 text-sm text-gray-600 hover:text-gray-900">
                    {cat.name}
                  </Link>
                ))}

                {!isAuthenticated && (
                  <div className="pt-2 border-t border-gray-100 flex gap-2">
                    <Link href="/login" className="flex-1 btn-primary text-center py-2">Sign In</Link>
                    <Link href="/register" className="flex-1 btn-secondary text-center py-2">Register</Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Cart Drawer */}
      <CartDrawer />
    </>
  );
});

function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity } = useCartStore();
  const subtotal = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  const router = useRouter();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={closeCart}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-sm bg-white z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                Shopping Cart {items.length > 0 && <span className="text-sm font-normal text-gray-500">({items.length})</span>}
              </h2>
              <button onClick={closeCart} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center">
                    <ShoppingCart className="w-8 h-8 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Your cart is empty</p>
                    <p className="text-sm text-gray-500 mt-1">Add some products to get started</p>
                  </div>
                  <button onClick={closeCart} className="btn-primary">
                    Continue Shopping
                  </button>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="flex items-start gap-3">
                    <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                      {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/product/${item.slug}`} onClick={closeCart} className="text-sm font-medium text-gray-900 hover:text-gray-700 line-clamp-2 block">
                        {item.name}
                      </Link>
                      {item.attributes && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {Object.entries(item.attributes).map(([k, v]) => `${k}: ${v}`).join(", ")}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border border-gray-200 rounded-lg">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-l-lg text-sm"
                          >−</button>
                          <span className="w-8 h-8 flex items-center justify-center text-sm font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= item.stock}
                            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-r-lg text-sm disabled:opacity-40"
                          >+</button>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</span>
                          <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-gray-100 p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Subtotal</span>
                  <span className="text-lg font-bold text-gray-900">₹{subtotal.toFixed(2)}</span>
                </div>
                {subtotal < 499 && (
                  <div className="bg-green-50 rounded-xl p-3">
                    <p className="text-xs text-green-700 text-center">
                      Add ₹{(499 - subtotal).toFixed(2)} more for free shipping!
                    </p>
                    <div className="mt-2 bg-green-200 rounded-full h-1.5">
                      <div
                        className="bg-green-600 h-1.5 rounded-full transition-all"
                        style={{ width: `${Math.min((subtotal / 499) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
                <button
                  onClick={() => { router.push("/checkout"); closeCart(); }}
                  className="w-full btn-primary py-3.5 text-base"
                >
                  Checkout
                </button>
                <button onClick={() => { router.push("/cart"); closeCart(); }} className="w-full text-sm text-center text-gray-500 hover:text-gray-900 transition-colors">
                  View Cart
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default Navbar;
