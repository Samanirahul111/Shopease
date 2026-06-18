"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Trash2, Plus, X } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { detectSizePreset, getPresetLabel, getSizesForPreset } from "@/lib/product/sizePresets";

interface Variant {
  id?: string;
  sku: string;
  price: string;
  stock: string;
  attributes: string;
  image?: string;
  isActive?: boolean;
}

export default function AdminEditProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [form, setForm] = useState<any>({
    name: "", slug: "", description: "", shortDesc: "", sku: "",
    price: "", comparePrice: "", costPrice: "", stock: 0,
    lowStockAlert: 5, categoryId: "", brand: "", tags: [], images: [],
    thumbnail: "", status: "ACTIVE", featured: false, isBestSeller: false,
    isNew: false, metaTitle: "", metaDesc: "", weight: "",
    freeShipping: false, shippingCost: 0, taxRate: 18,
  });
  const [tagInput, setTagInput] = useState("");
  const [imageInput, setImageInput] = useState("");
  const selectedCategory = categories.find((category) => category.id === form.categoryId);
  const sizePreset = detectSizePreset(selectedCategory?.name, selectedCategory?.slug);
  const presetSizes = getSizesForPreset(sizePreset);

  useEffect(() => {
    Promise.all([
      axios.get(`/api/admin/products/${id}`),
      axios.get("/api/categories"),
    ]).then(([productRes, catRes]) => {
      const p = productRes.data.data;
      setForm({
        name: p.name || "", slug: p.slug || "", description: p.description || "",
        shortDesc: p.shortDesc || "", sku: p.sku || "",
        price: p.price || "", comparePrice: p.comparePrice || "",
        costPrice: p.costPrice || "", stock: p.stock || 0,
        lowStockAlert: p.lowStockAlert || 5, categoryId: p.categoryId || "",
        brand: p.brand || "", tags: p.tags || [], images: p.images || [],
        thumbnail: p.thumbnail || "", status: p.status || "ACTIVE",
        featured: p.featured || false, isBestSeller: p.isBestSeller || false,
        isNew: p.isNew || false, metaTitle: p.metaTitle || "",
        metaDesc: p.metaDesc || "", weight: p.weight || "",
        freeShipping: p.freeShipping || false, shippingCost: p.shippingCost || 0,
        taxRate: p.taxRate || 18,
      });
      setVariants(
        (p.variants || []).map((variant: any) => ({
          id: variant.id,
          sku: variant.sku,
          price: variant.price ? String(variant.price) : "",
          stock: String(variant.stock || 0),
          attributes: JSON.stringify(variant.attributes || {}),
          image: variant.image || "",
          isActive: variant.isActive,
        }))
      );
      setCategories(catRes.data.data || []);
    }).catch(() => router.push("/admin/products")).finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put(`/api/admin/products/${id}`, {
        ...form,
        price: Number(form.price),
        comparePrice: form.comparePrice ? Number(form.comparePrice) : undefined,
        costPrice: form.costPrice ? Number(form.costPrice) : undefined,
        stock: Number(form.stock),
        shippingCost: Number(form.shippingCost),
        taxRate: Number(form.taxRate),
        weight: form.weight ? Number(form.weight) : undefined,
        variants: variants
          .map((variant) => {
            try {
              const attributes = JSON.parse(variant.attributes || "{}");
              return {
                id: variant.id,
                name: Object.values(attributes).join(" / ") || "Variant",
                sku: variant.sku,
                price: variant.price ? Number(variant.price) : undefined,
                stock: Number(variant.stock || 0),
                image: variant.image,
                attributes,
                isActive: variant.isActive ?? true,
              };
            } catch {
              return null;
            }
          })
          .filter((variant): variant is NonNullable<typeof variant> => Boolean(variant && variant.sku)),
      });
      toast.success("Product updated");
      router.push("/admin/products");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update product");
    } finally { setSaving(false); }
  };

  const handleArchive = async () => {
    if (!confirm("Archive this product? It will no longer be visible in the store.")) return;
    try {
      await axios.delete(`/api/admin/products/${id}`);
      toast.success("Product archived");
      router.push("/admin/products");
    } catch { toast.error("Failed to archive product"); }
  };

  if (loading) return (
    <div className="space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="h-24 shimmer-line rounded-2xl" />)}</div>
  );

  const addVariant = () => {
    setVariants((current) => [...current, { sku: "", price: "", stock: "", attributes: "", isActive: true }]);
  };

  const addPresetSizes = () => {
    if (!presetSizes.length) return;

    const existingSizes = new Set(
      variants
        .map((variant) => {
          try {
            const attributes = JSON.parse(variant.attributes || "{}");
            return String(attributes.size || "").toUpperCase();
          } catch {
            return "";
          }
        })
        .filter(Boolean)
    );

    const nextVariants = presetSizes
      .filter((size) => !existingSizes.has(size.toUpperCase()))
      .map((size) => ({
        sku: form.sku ? `${form.sku}-${size}` : `SIZE-${size}`,
        price: form.price ? String(form.price) : "",
        stock: String(form.stock || 0),
        attributes: JSON.stringify({ size }),
        isActive: true,
      }));

    if (nextVariants.length === 0) {
      toast("All preset sizes are already added");
      return;
    }

    setVariants((current) => [...current, ...nextVariants]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/products" className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Edit Product</h1>
        </div>
        <button onClick={handleArchive} className="flex items-center gap-2 text-sm text-red-600 border border-red-200 px-4 py-2 rounded-xl hover:bg-red-50 transition">
          <Trash2 className="w-4 h-4" /> Archive
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <h2 className="font-semibold text-gray-900">Basic Information</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Product Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field w-full" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description *</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field w-full h-32 resize-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Short Description</label>
                <input type="text" value={form.shortDesc} onChange={(e) => setForm({ ...form, shortDesc: e.target.value })} className="input-field w-full" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">SKU *</label>
                  <input type="text" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="input-field w-full" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Brand</label>
                  <input type="text" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="input-field w-full" />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <h2 className="font-semibold text-gray-900">Pricing & Inventory</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (₹) *</label>
                  <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input-field w-full" required min="0" step="0.01" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Compare Price (₹)</label>
                  <input type="number" value={form.comparePrice} onChange={(e) => setForm({ ...form, comparePrice: e.target.value })} className="input-field w-full" min="0" step="0.01" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Cost Price (₹)</label>
                  <input type="number" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} className="input-field w-full" min="0" step="0.01" />
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Stock *</label>
                  <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} className="input-field w-full" required min="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Low Stock Alert</label>
                  <input type="number" value={form.lowStockAlert} onChange={(e) => setForm({ ...form, lowStockAlert: Number(e.target.value) })} className="input-field w-full" min="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tax Rate (%)</label>
                  <input type="number" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} className="input-field w-full" min="0" max="100" />
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <h2 className="font-semibold text-gray-900">Product Images</h2>
              <div className="flex gap-2">
                <input type="url" value={imageInput} onChange={(e) => setImageInput(e.target.value)} placeholder="Paste image URL..." className="input-field flex-1" />
                <button type="button" onClick={() => { if (imageInput) { setForm({ ...form, images: [...form.images, imageInput], thumbnail: form.thumbnail || imageInput }); setImageInput(""); } }}
                  className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700 transition">Add</button>
              </div>
              {form.images.length > 0 && (
                <div className="grid grid-cols-4 gap-3">
                  {form.images.map((img: string, i: number) => (
                    <div key={i} className="relative group aspect-square">
                      <img src={img} alt="" className="w-full h-full object-cover rounded-xl" onError={(e: any) => e.target.closest("div").remove()} />
                      <button type="button" onClick={() => setForm({ ...form, images: form.images.filter((_: string, j: number) => j !== i) })}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-xs">×</button>
                      {form.thumbnail === img && <span className="absolute bottom-1 left-1 text-xs bg-gray-900 text-white px-1.5 py-0.5 rounded">Main</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Size / Variants</h2>
                <div className="flex items-center gap-2">
                  {presetSizes.length > 0 && (
                    <button type="button" onClick={addPresetSizes} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium">
                      <Plus className="w-4 h-4" /> Add {getPresetLabel(sizePreset)}
                    </button>
                  )}
                  <button type="button" onClick={addVariant} className="flex items-center gap-1.5 text-sm text-green-600 hover:text-green-700 font-medium">
                    <Plus className="w-4 h-4" /> Add Variant
                  </button>
                </div>
              </div>

              {variants.length === 0 ? (
                <p className="text-sm text-gray-500 border border-dashed border-gray-200 rounded-xl p-4">
                  No variants yet. Add sizes for apparel and footwear products.
                </p>
              ) : (
                <div className="space-y-3">
                  {variants.map((variant, index) => (
                    <div key={variant.id || index} className="border border-gray-200 rounded-xl p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Variant {index + 1}</span>
                        <button
                          type="button"
                          onClick={() => setVariants((current) => current.filter((_, idx) => idx !== index))}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid sm:grid-cols-3 gap-3">
                        <input
                          type="text"
                          value={variant.sku}
                          onChange={(e) =>
                            setVariants((current) =>
                              current.map((item, idx) => (idx === index ? { ...item, sku: e.target.value } : item))
                            )
                          }
                          placeholder="Variant SKU"
                          className="input-field text-sm"
                        />
                        <input
                          type="text"
                          value={variant.attributes}
                          onChange={(e) =>
                            setVariants((current) =>
                              current.map((item, idx) => (idx === index ? { ...item, attributes: e.target.value } : item))
                            )
                          }
                          placeholder='{"size":"M"}'
                          className="input-field text-sm"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            value={variant.price}
                            onChange={(e) =>
                              setVariants((current) =>
                                current.map((item, idx) => (idx === index ? { ...item, price: e.target.value } : item))
                              )
                            }
                            placeholder="Price"
                            className="input-field text-sm"
                          />
                          <input
                            type="number"
                            value={variant.stock}
                            onChange={(e) =>
                              setVariants((current) =>
                                current.map((item, idx) => (idx === index ? { ...item, stock: e.target.value } : item))
                              )
                            }
                            placeholder="Stock"
                            className="input-field text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <h2 className="font-semibold text-gray-900">Tags & SEO</h2>
              <div className="flex gap-2">
                <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (tagInput.trim()) { setForm({ ...form, tags: [...form.tags, tagInput.trim()] }); setTagInput(""); } } }}
                  placeholder="Add tag and press Enter" className="input-field flex-1" />
              </div>
              <div className="flex flex-wrap gap-2">
                {form.tags.map((tag: string, i: number) => (
                  <span key={i} className="flex items-center gap-1 bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full">
                    {tag}
                    <button type="button" onClick={() => setForm({ ...form, tags: form.tags.filter((_: string, j: number) => j !== i) })} className="text-gray-400 hover:text-red-500">×</button>
                  </span>
                ))}
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Meta Title</label>
                  <input type="text" value={form.metaTitle} onChange={(e) => setForm({ ...form, metaTitle: e.target.value })} className="input-field w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Meta Description</label>
                  <input type="text" value={form.metaDesc} onChange={(e) => setForm({ ...form, metaDesc: e.target.value })} className="input-field w-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
              <h2 className="font-semibold text-gray-900">Details</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input-field w-full">
                  <option value="ACTIVE">Active</option>
                  <option value="DRAFT">Draft</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="OUT_OF_STOCK">Out of Stock</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Category *</label>
                <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="input-field w-full" required>
                  <option value="">Select category</option>
                  {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
              <div className="space-y-3">
                {[
                  { key: "featured", label: "Featured Product" },
                  { key: "isBestSeller", label: "Best Seller" },
                  { key: "isNew", label: "New Arrival" },
                  { key: "freeShipping", label: "Free Shipping" },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between">
                    <label className="text-sm text-gray-700">{label}</label>
                    <input type="checkbox" checked={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.checked })} className="w-4 h-4 rounded" />
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" disabled={saving} className="w-full btn-primary flex items-center justify-center gap-2">
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <Link href="/admin/products" className="w-full block text-center py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition">
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
