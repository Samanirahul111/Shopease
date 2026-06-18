"use client";

import Link from "next/link";
import { Heart, ShoppingCart, Star, Eye, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { memo, useState } from "react";
import toast from "react-hot-toast";
import { useAuthStore, useCartStore, useWishlistStore } from "@/store";
import axios from "axios";
import { useRouter } from "next/navigation";

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number;
  thumbnail?: string;
  images?: string[];
  avgRating?: number;
  totalReviews?: number;
  stock: number;
  brand?: string;
  isNew?: boolean;
  isBestSeller?: boolean;
  featured?: boolean;
  freeShipping?: boolean;
  hasVariants?: boolean;
}

const ProductCard = memo(function ProductCard({
  id, name, slug, price: rawPrice, comparePrice: rawComparePrice, thumbnail, images = [],
  avgRating = 0, totalReviews = 0, stock, brand, isNew,
  isBestSeller, featured, freeShipping, hasVariants,
}: ProductCardProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { addItem } = useCartStore();
  const { toggle, isWishlisted } = useWishlistStore();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isHover, setIsHover] = useState(false);

  // Prisma Decimal fields arrive as strings via JSON — coerce to number
  const price = Number(rawPrice);
  const comparePrice = rawComparePrice ? Number(rawComparePrice) : undefined;

  const discountPercent = comparePrice && comparePrice > price
    ? Math.round(((comparePrice - price) / comparePrice) * 100)
    : 0;

  const displayImage = thumbnail || images[0];
  const hoverImage = images[1] || displayImage;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error("Please sign in to add to cart");
      return;
    }

    if (hasVariants) {
      toast("Select size/options on product page");
      router.push(`/product/${slug}`);
      return;
    }

    if (stock === 0) return;

    setIsAddingToCart(true);
    try {
      await axios.post("/api/cart", { productId: id, quantity: 1 });
      addItem({
        productId: id,
        name,
        slug,
        image: displayImage,
        price,
        quantity: 1,
        stock,
      });
      toast.success("Added to cart!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to add to cart");
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error("Please sign in to wishlist items");
      return;
    }

    toggle(id);
    try {
      await axios.post("/api/wishlist", { productId: id });
    } catch {}
  };

  const wishlisted = isWishlisted(id);

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="product-card"
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
    >
      <Link href={`/product/${slug}`} className="block">
        {/* Image Container */}
        <div className="relative aspect-square bg-white/20 overflow-hidden product-image-wrapper">
          {displayImage ? (
            <img
              src={isHover && hoverImage !== displayImage ? hoverImage : displayImage}
              alt={name}
              className="w-full h-full object-cover transition-all duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <ShoppingCart className="w-12 h-12" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {discountPercent > 0 && (
              <span className="badge bg-red-500 text-white text-xs font-bold">
                -{discountPercent}%
              </span>
            )}
            {isNew && !discountPercent && (
              <span className="badge bg-blue-500 text-white text-xs font-semibold">
                New
              </span>
            )}
            {isBestSeller && (
              <span className="badge bg-amber-500 text-white text-xs font-semibold">
                <Zap className="w-3 h-3 inline mr-0.5" />Best Seller
              </span>
            )}
            {stock === 0 && (
              <span className="badge bg-gray-500 text-white text-xs font-semibold">
                Out of Stock
              </span>
            )}
          </div>

          {/* Wishlist Button */}
          <button
            onClick={handleWishlist}
            className={`absolute top-3 right-3 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${
              wishlisted
                ? "bg-red-50 text-red-500 shadow-sm"
                : "bg-white/90 text-gray-500 hover:text-red-500 hover:bg-white opacity-0 group-hover:opacity-100 shadow-sm"
            }`}
            style={{ opacity: wishlisted ? 1 : isHover ? 1 : 0 }}
          >
            <Heart className={`w-4 h-4 ${wishlisted ? "fill-current" : ""}`} />
          </button>

          {/* Quick View / Add to Cart Overlay */}
          <div
            className="absolute bottom-3 left-3 right-3 transition-all duration-200"
            style={{ opacity: isHover ? 1 : 0, transform: `translateY(${isHover ? 0 : 8}px)` }}
          >
            <button
              onClick={handleAddToCart}
              disabled={isAddingToCart || stock === 0}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-sm ${
                stock === 0
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95 hover:shadow-lg hover:shadow-emerald-600/20"
              }`}
            >
              {isAddingToCart ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <ShoppingCart className="w-4 h-4" />
              )}
              {stock === 0 ? "Out of Stock" : "Add to Cart"}
            </button>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4">
          {brand && (
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">{brand}</p>
          )}
          <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug mb-2 hover:text-gray-700 transition-colors">
            {name}
          </h3>

          {/* Rating */}
          {totalReviews > 0 && (
            <div className="flex items-center gap-1.5 mb-2">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-3.5 h-3.5 ${
                      star <= Math.round(avgRating)
                        ? "text-amber-400 fill-current"
                        : "text-gray-200 fill-current"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500">({totalReviews})</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-gray-900">₹{price.toFixed(2)}</span>
            {comparePrice && comparePrice > price && (
              <span className="text-sm text-gray-400 line-through">₹{comparePrice.toFixed(2)}</span>
            )}
          </div>

          {freeShipping && (
            <p className="text-xs text-green-600 font-medium mt-1">Free Shipping</p>
          )}
        </div>
      </Link>
    </motion.div>
  );
});

export default ProductCard;
