"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { ArrowRight, Star, ShieldCheck, Truck, RefreshCcw, Headphones, Zap, TrendingUp, Sparkles, ChevronLeft, ChevronRight, Monitor, Shirt, Home, BookOpen, Dumbbell, Heart } from "lucide-react";
import ProductCard from "@/components/product/ProductCard";
import axios from "axios";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number;
  thumbnail?: string;
  images: string[];
  avgRating: number;
  totalReviews: number;
  stock: number;
  brand?: string;
  isNew?: boolean;
  isBestSeller?: boolean;
  featured?: boolean;
  freeShipping?: boolean;
  _count?: { variants: number };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
  icon?: string;
  _count?: { products: number };
}

interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  link?: string;
  buttonText?: string;
}

const features = [
  { icon: Truck, title: "Free Delivery", desc: "On orders above ₹499" },
  { icon: ShieldCheck, title: "Secure Payment", desc: "100% secure transactions" },
  { icon: RefreshCcw, title: "Easy Returns", desc: "30-day return policy" },
  { icon: Headphones, title: "24/7 Support", desc: "Always here to help" },
];

const categoryIconMap: { [key: string]: React.ComponentType<any> } = {
  "electronics": Monitor,
  "fashion": Shirt,
  "home-kitchen": Home,
  "home & kitchen": Home,
  "home": Home,
  "books": BookOpen,
  "sports-fitness": Dumbbell,
  "sports & fitness": Dumbbell,
  "sports": Dumbbell,
  "beauty-health": Heart,
  "beauty & health": Heart,
  "beauty": Heart,
};

const categoryImageMap: { [key: string]: string } = {
  "electronics": "/images/cat-electronics.png",
  "fashion": "/images/cat-fashion.png",
  "home-kitchen": "/images/cat-home-kitchen.png",
  "home & kitchen": "/images/cat-home-kitchen.png",
  "home": "/images/cat-home-kitchen.png",
  "books": "/images/cat-books.png",
  "sports-fitness": "/images/cat-sports-fitness.png",
  "sports & fitness": "/images/cat-sports-fitness.png",
  "sports": "/images/cat-sports-fitness.png",
  "beauty-health": "/images/cat-beauty-health.png",
  "beauty & health": "/images/cat-beauty-health.png",
  "beauty": "/images/cat-beauty-health.png",
};

const getCategoryIcon = (category: Category) => {
  const slug = category.slug.toLowerCase();
  const name = category.name.toLowerCase();
  const IconComponent = categoryIconMap[slug] || categoryIconMap[name] || null;

  if (IconComponent) {
    return <IconComponent className="w-6 h-6 text-gray-700 group-hover:text-white transition-colors" />;
  }

  if (category.image) {
    return <img src={category.image} alt={category.name} className="w-8 h-8 object-cover rounded-lg" />;
  }
  return <span className="text-2xl">{category.icon || "📦"}</span>;
};

const getCategoryImage = (category: Category) => {
  const slug = category.slug.toLowerCase();
  const name = category.name.toLowerCase();
  return categoryImageMap[slug] || categoryImageMap[name] || category.image || "/images/cat-electronics.png";
};

export default function HomepageClient() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeBanner, setActiveBanner] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const fetchData = async () => {
      try {
        const [featuredRes, newRes, bestRes, catsRes] = await Promise.all([
          axios.get("/api/products?featured=true&limit=8&status=ACTIVE"),
          axios.get("/api/products?new=true&limit=8&status=ACTIVE"),
          axios.get("/api/products?bestSeller=true&limit=8&status=ACTIVE"),
          axios.get("/api/categories?parentOnly=true&withCount=true"),
        ]);
        setFeaturedProducts(featuredRes.data.data?.products || []);
        setNewArrivals(newRes.data.data?.products || []);
        setBestSellers(bestRes.data.data?.products || []);
        setCategories(catsRes.data.data || []);
      } catch (err) {
        console.error("Failed to load homepage data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Banner auto-rotation
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveBanner((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  return (
    <div className="min-h-screen relative bg-gray-50/50">
      {/* Ambient background glows for the body */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[500px] left-1/4 w-[50%] h-[40%] bg-teal-200/40 rounded-full blur-[120px] animate-[pulse_10s_infinite]" />
        <div className="absolute top-[1200px] right-1/4 w-[40%] h-[30%] bg-violet-200/35 rounded-full blur-[120px] animate-[pulse_15s_infinite_3s]" />
        <div className="absolute bottom-[600px] left-1/3 w-[45%] h-[35%] bg-emerald-200/35 rounded-full blur-[120px] animate-[pulse_12s_infinite]" />
      </div>

      {/* Hero Section */}
      <section className="relative bg-gray-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 right-20 w-72 h-72 bg-emerald-500 rounded-full blur-3xl animate-[pulse_8s_infinite]" />
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-teal-500 rounded-full blur-3xl animate-[pulse_12s_infinite_3s]" />
        </div>
        <div className="relative page-container py-20 md:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/10 rounded-full text-sm font-medium mb-6">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  New Season Collection
                </span>
                <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
                  Discover Premium
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-300"> Products</span>
                  <br />You'll Love
                </h1>
                <p className="text-lg text-gray-300 mb-8 leading-relaxed">
                  Shop the latest trends and timeless classics. Quality products, competitive prices, and seamless shopping experience.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link href="/shop" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:brightness-110 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all active:scale-95 text-base">
                    Shop Now <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link href="/shop?featured=true" className="inline-flex items-center gap-2 px-8 py-4 border-2 border-emerald-500/30 text-white rounded-xl font-semibold hover:border-emerald-500/60 hover:bg-emerald-500/5 transition-all text-base">
                    View Featured
                  </Link>
                </div>

                {/* Stats */}
                <div className="flex flex-wrap gap-8 mt-12 pt-8 border-t border-white/10">
                  {[
                    { value: "10K+", label: "Products" },
                    { value: "50K+", label: "Happy Customers" },
                    { value: "4.9★", label: "Avg Rating" },
                  ].map((stat) => (
                    <div key={stat.label}>
                      <p className="text-2xl font-bold text-emerald-400">{stat.value}</p>
                      <p className="text-sm text-gray-400">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Right side product/fashion collage */}
            <div className="lg:col-span-5 relative hidden lg:block h-[500px]">
              <div className="relative w-full h-full">
                {/* Main Large Image */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="absolute top-0 left-4 w-2/3 h-[420px] rounded-3xl overflow-hidden shadow-2xl border border-white/10 group cursor-pointer"
                >
                  <img
                    src="/images/hero-fashion-1.png"
                    alt="Premium Fashion Collection"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-green-400 bg-green-400/10 px-3 py-1 rounded-full border border-green-400/20">Streetwear</span>
                      <p className="text-lg font-bold mt-2 text-white">Urban Luxe Edit</p>
                    </div>
                  </div>
                </motion.div>

                {/* Overlapping Image 2 (Top Right) */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, x: 30 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="absolute top-8 right-0 w-1/2 h-[260px] rounded-3xl overflow-hidden shadow-2xl border border-white/10 group cursor-pointer"
                >
                  <img
                    src="/images/hero-fashion-2.png"
                    alt="Premium Style"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-green-400 bg-green-400/10 px-2.5 py-0.5 rounded-full border border-green-400/20">Essentials</span>
                      <p className="text-sm font-bold mt-1 text-white">Classic Apparel</p>
                    </div>
                  </div>
                </motion.div>

                {/* Overlapping Image 3 (Bottom Right / Center Overlay) */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="absolute bottom-4 right-8 w-5/12 h-[200px] rounded-3xl overflow-hidden shadow-2xl border border-white/10 group cursor-pointer"
                >
                  <img
                    src="/images/hero-fashion-3.png"
                    alt="Luxury Accessories"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-green-400 bg-green-400/10 px-2.5 py-0.5 rounded-full border border-green-400/20">Accessories</span>
                      <p className="text-sm font-bold mt-1 text-white">Designer Gear</p>
                    </div>
                  </div>
                </motion.div>

                {/* Ambient Glows behind the images */}
                <div className="absolute -top-10 -right-10 w-48 h-48 bg-green-500/10 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse" />
                <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Strip */}
      <section className="bg-white/40 backdrop-blur-md border-y border-gray-100/50">
        <div className="page-container py-8">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-emerald-100/50">
                  <Icon className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="page-container py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="section-title">Shop by Category</h2>
              <p className="text-gray-500 mt-1">Explore our wide range of categories</p>
            </div>
            <Link href="/shop" className="hidden md:flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.slice(0, 6).map((category, i) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
              >
                <Link
                  href={`/shop?category=${category.slug}`}
                  className="group flex flex-col items-center p-5 bg-white rounded-2xl border border-gray-100 hover:border-gray-300 hover:shadow-md transition-all duration-200 text-center"
                >
                  <div className="w-24 h-24 bg-gray-50 rounded-2xl overflow-hidden mb-4 relative border border-gray-100 shadow-sm group-hover:border-emerald-500/50 group-hover:shadow-md transition-all duration-300 flex items-center justify-center">
                    <img
                      src={getCategoryImage(category)}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-gray-700">{category.name}</p>
                  {category._count && (
                    <p className="text-xs text-gray-400 mt-0.5">{category._count.products} items</p>
                  )}
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      <ProductSection
        title="Featured Products"
        subtitle="Handpicked selections just for you"
        icon={<Star className="w-5 h-5 text-amber-400 fill-current" />}
        products={featuredProducts}
        viewAllLink="/shop?featured=true"
        loading={loading}
      />

      {/* Promo Banners */}
      <section className="page-container py-8 overflow-hidden">
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="relative bg-gradient-to-br from-gray-950 via-gray-900 to-gray-850 rounded-2xl p-8 overflow-hidden min-h-[200px] flex flex-col justify-end border border-white/5 shadow-xl"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl animate-pulse" />
            <span className="badge bg-emerald-500 text-white mb-3 w-fit">New Arrivals</span>
            <h3 className="text-2xl font-bold text-white mb-2">Fresh Collection</h3>
            <p className="text-sm text-gray-300 mb-4">Discover our latest additions</p>
            <Link href="/shop?new=true" className="inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-emerald-400 transition-colors">
              Shop Now <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="relative bg-gradient-to-br from-emerald-950 via-gray-900 to-gray-950 rounded-2xl p-8 overflow-hidden min-h-[200px] flex flex-col justify-end border border-emerald-500/15 shadow-xl"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/20 rounded-full blur-2xl animate-pulse" />
            <span className="badge bg-emerald-500 text-white mb-3 w-fit">Best Sellers</span>
            <h3 className="text-2xl font-bold text-white mb-2">Top Rated</h3>
            <p className="text-sm text-gray-300 mb-4">Shop what everyone loves</p>
            <Link href="/shop?bestSeller=true" className="inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-emerald-400 transition-colors">
              Explore <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Best Sellers */}
      <ProductSection
        title="Best Sellers"
        subtitle="Products our customers love most"
        icon={<Zap className="w-5 h-5 text-amber-500 fill-current" />}
        products={bestSellers}
        viewAllLink="/shop?bestSeller=true"
        loading={loading}
      />

      {/* New Arrivals */}
      <ProductSection
        title="New Arrivals"
        subtitle="Fresh products added this week"
        icon={<TrendingUp className="w-5 h-5 text-blue-500" />}
        products={newArrivals}
        viewAllLink="/shop?new=true"
        loading={loading}
        bgGray
      />

      {/* Testimonials */}
      <section className="page-container py-16">
        <div className="text-center mb-12">
          <h2 className="section-title">What Our Customers Say</h2>
          <p className="text-gray-500 mt-2">Join thousands of happy shoppers</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16 px-4">
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-md shadow-gray-100/40 relative overflow-hidden flex flex-col items-start transition-all duration-300 hover:shadow-lg hover:translate-y-[-4px]">
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-60" />
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-6">
              <Truck className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">50,000+</span>
            <span className="text-sm font-medium text-gray-500">Happy Shoppers</span>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-md shadow-gray-100/40 relative overflow-hidden flex flex-col items-start transition-all duration-300 hover:shadow-lg hover:translate-y-[-4px]">
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-60" />
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-6">
              <Zap className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">100,000+</span>
            <span className="text-sm font-medium text-gray-500">Successful Deliveries</span>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-md shadow-gray-100/40 relative overflow-hidden flex flex-col items-start transition-all duration-300 hover:shadow-lg hover:translate-y-[-4px]">
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-60" />
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-6">
              <Star className="w-6 h-6 text-emerald-600 fill-current" />
            </div>
            <span className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">99.2%</span>
            <span className="text-sm font-medium text-gray-500">Customer Satisfaction</span>
          </div>
        </div>

        {/* Wide Greenish Testimonial Slider */}
        <div className="mx-auto max-w-5xl px-4 relative">
          {mounted && (
            <div className="relative rounded-[2.5rem] bg-white text-gray-900 p-8 md:p-12 shadow-2xl border-2 border-emerald-500 overflow-hidden">
              {/* Background gradient decorative glow */}
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

              <Swiper
                modules={[Autoplay, Pagination, Navigation]}
                spaceBetween={40}
                slidesPerView={1}
                loop={true}
                speed={800}
                grabCursor={true}
                autoplay={{
                  delay: 4000,
                  disableOnInteraction: false,
                }}
                navigation={{
                  nextEl: ".swiper-button-next-custom",
                  prevEl: ".swiper-button-prev-custom",
                }}
                pagination={{
                  type: "progressbar",
                  el: ".custom-swiper-progress-bar",
                }}
                className="relative pb-10"
              >
                {[
                  { name: "Priya Sharma", text: "Amazing quality products and super fast delivery! Will definitely order again. The shopping experience was seamless and customer support was incredibly supportive.", rating: 5, location: "Mumbai", role: "Verified Buyer" },
                  { name: "Rahul Gupta", text: "Best online shopping experience. Great customer support and easy returns. The product quality is top-notch and exactly as described.", rating: 5, location: "Delhi", role: "Verified Buyer" },
                  { name: "Anjali Singh", text: "Love the variety and the prices are unbeatable. My go-to shopping destination! Safe packaging and highly recommended products.", rating: 5, location: "Bangalore", role: "Verified Buyer" },
                  { name: "Vikas Patel", text: "Incredible selection and the checkout was seamless. The website is extremely easy to use. Great values for money and authentic items.", rating: 4, location: "Ahmedabad", role: "Verified Buyer" },
                  { name: "Sneha Reddy", text: "Got exactly what I was looking for. The packaging was top-notch and arrived before time. The overall support is fabulous.", rating: 5, location: "Hyderabad", role: "Verified Buyer" },
                ].map((review, i) => (
                  <SwiperSlide key={i} className="h-auto">
                    <div className="flex flex-col items-start relative z-10 select-none">
                      {/* Top Row: Pill Tag & Custom Nav buttons */}
                      <div className="flex justify-between items-center w-full mb-6">
                        <div className="bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase inline-flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" /> Customer Story
                        </div>
                        <div className="flex gap-2">
                          <button className="swiper-button-prev-custom w-10 h-10 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center justify-center rounded-full cursor-pointer transition-all border border-emerald-200/60 shadow-sm active:scale-95">
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <button className="swiper-button-next-custom w-10 h-10 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center justify-center rounded-full cursor-pointer transition-all border border-emerald-200/60 shadow-sm active:scale-95">
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      {/* Stars Rating */}
                      <div className="flex items-center gap-1 mb-6">
                        {[...Array(5)].map((_, s) => (
                          <Star
                            key={s}
                            className={`w-5 h-5 ${s < review.rating
                                ? "text-amber-400 fill-current"
                                : "text-gray-200"
                              }`}
                          />
                        ))}
                      </div>

                      {/* Quote Text */}
                      <p className="text-gray-800 text-lg md:text-xl font-medium leading-relaxed text-left italic mb-8 max-w-4xl">
                        "{review.text}"
                      </p>

                      {/* Author Profile */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-2">
                        <div className="w-14 h-14 bg-gradient-to-tr from-emerald-800 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg border border-emerald-500/20 shrink-0">
                          <span className="text-white text-lg font-bold">{review.name[0]}</span>
                        </div>
                        <div className="text-left">
                          <p className="text-base font-semibold text-emerald-800 tracking-wide">{review.name}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-xs text-emerald-600 font-medium">{review.location}</span>
                            <span className="w-1 h-1 bg-emerald-200 rounded-full hidden sm:block" />
                            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                              {review.role}
                            </span>
                            <span className="text-[10px] text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/60">
                              Verified Purchase
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>

              {/* Progress Bar Container */}
              <div className="absolute bottom-6 left-8 right-8 md:left-12 md:right-12 h-1 bg-emerald-100 rounded-full overflow-hidden">
                <div className="custom-swiper-progress-bar h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300" />
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
};

function ProductSection({
  title, subtitle, icon, products, viewAllLink, loading, bgGray,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  products: Product[];
  viewAllLink: string;
  loading: boolean;
  bgGray?: boolean;
}) {
  return (
    <section className={`${bgGray ? "bg-white/40 backdrop-blur-md" : ""} py-16`}>
      <div className="page-container">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {icon}
              <h2 className="section-title">{title}</h2>
            </div>
            <p className="text-gray-500">{subtitle}</p>
          </div>
          <Link href={viewAllLink} className="hidden md:flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
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
        ) : products.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 lg:gap-6"
          >
            {products.map((product) => (
              <motion.div key={product.id} variants={itemVariants}>
                <ProductCard {...product} hasVariants={(product._count?.variants || 0) > 0} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p className="text-sm">No products available yet</p>
          </div>
        )}

        <div className="md:hidden text-center mt-6">
          <Link href={viewAllLink} className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
