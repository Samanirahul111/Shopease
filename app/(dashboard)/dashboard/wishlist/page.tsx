"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, ShoppingCart, Trash2, Star } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useCartStore } from "@/store";

export default function WishlistPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCartStore();

  const fetchWishlist = async () => {
    try {
      const res = await axios.get("/api/wishlist");
      setItems(res.data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchWishlist(); }, []);

  const removeItem = async (productId: string) => {
    try {
      await axios.delete(`/api/wishlist?productId=${productId}`);
      setItems((prev) => prev.filter((i) => i.productId !== productId));
      toast.success("Removed from wishlist");
    } catch { toast.error("Failed to remove"); }
  };

  const moveToCart = (item: any) => {
    try {
      addItem({
        productId: item.product.id,
        name: item.product.name,
        slug: item.product.slug || item.product.id,
        image: item.product.thumbnail || item.product.images?.[0],
        price: Number(item.product.price),
        quantity: 1,
        stock: item.product.stock,
      });
      toast.success("Added to cart");
    } catch { toast.error("Failed to add to cart"); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Wishlist</h1>
        <p className="text-sm text-gray-500 mt-1">{items.length} saved item{items.length !== 1 ? "s" : ""}</p>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-72 shimmer-line rounded-2xl" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <Heart className="w-14 h-14 text-gray-200 mx-auto mb-4" />
          <p className="font-semibold text-gray-600">Your wishlist is empty</p>
          <p className="text-sm text-gray-400 mt-1">Save items you love</p>
          <Link href="/shop" className="mt-4 inline-block btn-primary">Browse Products</Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => {
            const product = item.product;
            const discount = product.comparePrice
              ? Math.round(((Number(product.comparePrice) - Number(product.price)) / Number(product.comparePrice)) * 100)
              : 0;
            return (
              <div key={item.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden group">
                <div className="relative">
                  <Link href={`/product/${product.slug}`}>
                    <img
                      src={product.thumbnail || product.images?.[0] || "https://via.placeholder.com/300"}
                      alt={product.name}
                      className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </Link>
                  {discount > 0 && (
                    <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      -{discount}%
                    </span>
                  )}
                  <button
                    onClick={() => removeItem(product.id)}
                    className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-red-50 transition"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
                <div className="p-4">
                  <Link href={`/product/${product.slug}`} className="font-semibold text-gray-900 text-sm hover:text-gray-700 line-clamp-2">
                    {product.name}
                  </Link>
                  {Number(product.avgRating) > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-3.5 h-3.5 text-yellow-400 fill-current" />
                      <span className="text-xs text-gray-500">{Number(product.avgRating).toFixed(1)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-bold text-gray-900">₹{Number(product.price).toFixed(0)}</span>
                    {product.comparePrice && (
                      <span className="text-sm text-gray-400 line-through">₹{Number(product.comparePrice).toFixed(0)}</span>
                    )}
                  </div>
                  <button
                    onClick={() => moveToCart(item)}
                    disabled={product.stock === 0}
                    className="w-full mt-3 btn-primary flex items-center justify-center gap-2 text-sm py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
