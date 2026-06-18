"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShoppingCart, Heart, Share2, Star, ChevronRight, Truck, RefreshCcw,
  ShieldCheck, Package, Plus, Minus, ZoomIn, Check, ArrowLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore, useCartStore, useWishlistStore } from "@/store";
import ProductCard from "@/components/product/ProductCard";
import axios from "axios";
import toast from "react-hot-toast";

interface Variant {
  id: string;
  name: string;
  sku: string;
  price?: number;
  stock: number;
  image?: string;
  attributes: Record<string, string>;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDesc?: string;
  price: number;
  comparePrice?: number;
  thumbnail?: string;
  images: string[];
  stock: number;
  sku: string;
  brand?: string;
  tags: string[];
  avgRating: number;
  totalReviews: number;
  totalSold: number;
  isNew?: boolean;
  isBestSeller?: boolean;
  freeShipping?: boolean;
  shippingCost: number;
  variants: Variant[];
  category: { name: string; slug: string };
  reviews: Review[];
  _count?: { variants: number };
}

interface Review {
  id: string;
  rating: number;
  title?: string;
  content?: string;
  createdAt: string;
  isVerified: boolean;
  user: { name: string; avatar?: string };
}

export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { addItem } = useCartStore();
  const { toggle, isWishlisted } = useWishlistStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [activeTab, setActiveTab] = useState("description");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`/api/products/${slug}`);
        setProduct(res.data.data.product);
        setRelatedProducts(res.data.data.related || []);
        if (res.data.data.product.variants?.length > 0) {
          setSelectedVariant(res.data.data.product.variants[0]);
        }

        // Track recently viewed
        if (isAuthenticated) {
          axios.post("/api/user/recently-viewed", { productId: res.data.data.product.id }).catch(() => {});
        }
      } catch {
        toast.error("Product not found");
        router.push("/shop");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug]);

  const handleAddToCart = async () => {
    if (!product) return;
    if (!isAuthenticated) { toast.error("Please sign in to add to cart"); return; }

    const availableStock = selectedVariant?.stock ?? product.stock;
    if (availableStock === 0) return;

    setIsAddingToCart(true);
    try {
      const res = await axios.post("/api/cart", {
        productId: product.id,
        variantId: selectedVariant?.id,
        quantity,
      });
      const cartItemId = res.data?.data?.id;
      addItem({
        id: cartItemId,
        productId: product.id,
        variantId: selectedVariant?.id,
        name: product.name,
        slug: product.slug,
        image: product.thumbnail || product.images[0],
        price: selectedVariant?.price ?? product.price,
        quantity,
        stock: availableStock,
        attributes: selectedVariant?.attributes,
      });
      toast.success("Added to cart!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to add to cart");
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    router.push("/checkout");
  };

  const handleWishlist = async () => {
    if (!product) return;
    if (!isAuthenticated) {
      toast.error("Please sign in to wishlist items");
      return;
    }
    toggle(product.id);
    try {
      await axios.post("/api/wishlist", { productId: product.id });
    } catch {}
  };

  if (loading) {
    return (
      <div className="page-container py-10">
        <div className="grid md:grid-cols-2 gap-10">
          <div className="space-y-4">
            <div className="aspect-square shimmer-line rounded-2xl" />
            <div className="flex gap-2">
              {[...Array(4)].map((_, i) => <div key={i} className="w-20 h-20 shimmer-line rounded-xl" />)}
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-8 shimmer-line rounded w-3/4" />
            <div className="h-6 shimmer-line rounded w-1/4" />
            <div className="h-4 shimmer-line rounded" />
            <div className="h-4 shimmer-line rounded w-5/6" />
            <div className="h-12 shimmer-line rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const images = product.images?.length ? product.images : [product.thumbnail].filter(Boolean) as string[];
  const currentPrice = selectedVariant?.price ?? product.price;
  const currentStock = selectedVariant?.stock ?? product.stock;
  const hasSizeVariants = product.variants?.some((variant) => Boolean(variant.attributes?.size));
  const discountPercent = product.comparePrice && product.comparePrice > currentPrice
    ? Math.round(((product.comparePrice - currentPrice) / product.comparePrice) * 100)
    : 0;

  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      <div className="border-b border-gray-100 bg-gray-50">
        <div className="page-container py-3">
          <nav className="flex items-center gap-1.5 text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-900">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/shop" className="hover:text-gray-900">Shop</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href={`/shop?category=${product.category.slug}`} className="hover:text-gray-900">
              {product.category.name}
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-900 font-medium line-clamp-1">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="page-container py-8">
        {/* Back Button */}
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="grid md:grid-cols-2 gap-10 lg:gap-16">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div
              className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden cursor-zoom-in"
              onClick={() => setIsZoomed(!isZoomed)}
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={selectedImage}
                  src={images[selectedImage]}
                  alt={product.name}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full object-cover"
                />
              </AnimatePresence>
              <div className="absolute top-3 right-3 bg-white/80 p-2 rounded-xl">
                <ZoomIn className="w-4 h-4 text-gray-600" />
              </div>
              {discountPercent > 0 && (
                <div className="absolute top-3 left-3">
                  <span className="badge bg-red-500 text-white font-bold text-sm px-3 py-1">
                    -{discountPercent}%
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                      selectedImage === i ? "border-gray-900 shadow-sm" : "border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <img src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Brand */}
            {product.brand && (
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{product.brand}</p>
            )}

            {/* Name */}
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">{product.name}</h1>

            {/* Rating & Sales */}
            <div className="flex items-center gap-4 flex-wrap">
              {product.totalReviews > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className={`w-4 h-4 ${star <= Math.round(product.avgRating) ? "text-amber-400 fill-current" : "text-gray-200 fill-current"}`} />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{Number(product.avgRating).toFixed(1)}</span>
                  <span className="text-sm text-gray-400">({product.totalReviews} reviews)</span>
                </div>
              )}
              {product.totalSold > 0 && (
                <span className="text-sm text-gray-500">{product.totalSold}+ sold</span>
              )}
            </div>

            {/* Price */}
            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold text-gray-900">₹{Number(currentPrice).toFixed(2)}</span>
              {product.comparePrice && Number(product.comparePrice) > Number(currentPrice) && (
                <span className="text-xl text-gray-400 line-through">₹{Number(product.comparePrice).toFixed(2)}</span>
              )}
              {discountPercent > 0 && (
                <span className="badge bg-green-100 text-green-700 text-sm font-semibold px-3 py-1">
                  Save {discountPercent}%
                </span>
              )}
            </div>

            {/* Short Description */}
            {product.shortDesc && (
              <p className="text-gray-600 leading-relaxed">{product.shortDesc}</p>
            )}

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">{hasSizeVariants ? "Select Size:" : "Options:"}</h3>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      disabled={variant.stock === 0}
                      className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                        selectedVariant?.id === variant.id
                          ? "border-gray-900 bg-gray-900 text-white"
                          : variant.stock === 0
                          ? "border-gray-200 text-gray-300 cursor-not-allowed line-through"
                          : "border-gray-200 hover:border-gray-400 text-gray-700"
                      }`}
                    >
                      {variant.attributes?.size || Object.values(variant.attributes || {}).join(" / ")}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-11 h-11 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 h-11 flex items-center justify-center text-sm font-semibold border-x border-gray-200">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => Math.min(currentStock, q + 1))}
                  disabled={quantity >= currentStock}
                  className="w-11 h-11 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="text-sm">
                {currentStock > 0 ? (
                  currentStock <= 10 ? (
                    <span className="text-orange-500 font-medium">Only {currentStock} left!</span>
                  ) : (
                    <span className="text-green-600 font-medium flex items-center gap-1">
                      <Check className="w-4 h-4" /> In Stock
                    </span>
                  )
                ) : (
                  <span className="text-red-500 font-medium">Out of Stock</span>
                )}
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleAddToCart}
                disabled={isAddingToCart || currentStock === 0}
                className="flex-1 btn-primary py-4 text-base flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isAddingToCart ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <ShoppingCart className="w-5 h-5" />
                )}
                {currentStock === 0 ? "Out of Stock" : "Add to Cart"}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={currentStock === 0}
                className="flex-1 btn-outline py-4 text-base disabled:opacity-50"
              >
                Buy Now
              </button>
              <button
                onClick={handleWishlist}
                className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center transition-all ${
                  isWishlisted(product.id)
                    ? "border-red-300 bg-red-50 text-red-500"
                    : "border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500"
                }`}
              >
                <Heart className={`w-5 h-5 ${isWishlisted(product.id) ? "fill-current" : ""}`} />
              </button>
            </div>

            {/* SKU */}
            <p className="text-xs text-gray-400">SKU: {selectedVariant?.sku || product.sku}</p>

            {/* Shipping Info */}
            <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
              {product.freeShipping ? (
                <div className="flex items-center gap-3 text-sm">
                  <Truck className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-green-700 font-medium">Free Delivery</span>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-sm">
                  <Truck className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <span className="text-gray-700">Shipping: ₹{Number(product.shippingCost).toFixed(2)} (Free above ₹499)</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <RefreshCcw className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <span className="text-gray-700">30-day return policy</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <ShieldCheck className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <span className="text-gray-700">Secure checkout guaranteed</span>
              </div>
            </div>

            {/* Tags */}
            {product.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <Link key={tag} href={`/shop?tags=${tag}`} className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs rounded-full hover:bg-gray-200 transition-colors">
                    #{tag}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tabs: Description, Reviews */}
        <div className="mt-16">
          <div className="flex border-b border-gray-200 gap-6">
            {["description", "reviews"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-semibold capitalize transition-colors ${
                  activeTab === tab
                    ? "text-gray-900 border-b-2 border-gray-900 -mb-px"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab === "reviews" ? `Reviews (${product.totalReviews})` : "Description"}
              </button>
            ))}
          </div>

          <div className="mt-8">
            {activeTab === "description" ? (
              <div className="prose prose-gray max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: product.description.replace(/\n/g, "<br/>") }} />
            ) : (
              <ReviewsSection product={product} />
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="section-title mb-6">Related Products</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {relatedProducts.slice(0, 5).map((p) => (
                <ProductCard key={p.id} {...p} hasVariants={(p._count?.variants || 0) > 0} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewsSection({ product }: { product: Product }) {
  const ratingDist = [5, 4, 3, 2, 1].map((r) => ({
    rating: r,
    count: product.reviews?.filter((rev) => rev.rating === r).length || 0,
  }));

  return (
    <div className="space-y-8">
      {/* Rating Summary */}
      <div className="flex gap-10 flex-wrap">
        <div className="text-center">
          <p className="text-6xl font-bold text-gray-900">{Number(product.avgRating).toFixed(1)}</p>
          <div className="flex items-center justify-center gap-0.5 mt-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className={`w-5 h-5 ${s <= Math.round(product.avgRating) ? "text-amber-400 fill-current" : "text-gray-200 fill-current"}`} />
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-1">{product.totalReviews} reviews</p>
        </div>
        <div className="flex-1 space-y-2 min-w-48">
          {ratingDist.map(({ rating, count }) => (
            <div key={rating} className="flex items-center gap-3">
              <span className="text-sm w-4 text-gray-600">{rating}</span>
              <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full"
                  style={{ width: product.totalReviews ? `${(count / product.totalReviews) * 100}%` : "0%" }}
                />
              </div>
              <span className="text-sm text-gray-500 w-6">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-6 divide-y divide-gray-100">
        {product.reviews?.map((review) => (
          <div key={review.id} className="pt-6 first:pt-0">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0">
                  {review.user.avatar ? (
                    <img src={review.user.avatar} alt={review.user.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-white text-sm font-bold">{review.user.name[0]}</span>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900">{review.user.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? "text-amber-400 fill-current" : "text-gray-200 fill-current"}`} />
                    ))}
                    {review.isVerified && (
                      <span className="ml-2 text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        <Check className="w-3 h-3" /> Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <span className="text-xs text-gray-400">
                {new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>
            {review.title && <p className="font-semibold text-gray-900 mb-1">{review.title}</p>}
            {review.content && <p className="text-gray-700 text-sm leading-relaxed">{review.content}</p>}
          </div>
        ))}

        {(!product.reviews || product.reviews.length === 0) && (
          <div className="py-12 text-center text-gray-500">
            <Star className="w-10 h-10 mx-auto text-gray-200 mb-3" />
            <p>No reviews yet. Be the first to review this product!</p>
          </div>
        )}
      </div>
    </div>
  );
}
