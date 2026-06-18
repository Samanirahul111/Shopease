"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, X, Upload, Save, Eye, Trash2 } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { detectSizePreset, getPresetLabel, getSizesForPreset } from "@/lib/product/sizePresets";

interface Category { id: string; name: string; slug: string; }
interface Variant { id?: string; sku: string; price: string; stock: string; attributes: string; image?: string; }

export default function ProductFormPage() {
  const router = useRouter();
  const [loading, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [form, setForm] = useState({
    name: "", description: "", shortDesc: "", sku: "", price: "",
    comparePrice: "", costPrice: "", stock: "", lowStockAlert: "5",
    categoryId: "", brand: "", tags: "", weight: "",
    metaTitle: "", metaDesc: "", metaKeywords: "",
    featured: false, isBestSeller: false, isNew: false,
    taxRate: "18", freeShipping: false, shippingCost: "0",
    status: "DRAFT", thumbnail: "", images: [] as string[],
  });
  const [tagInput, setTagInput] = useState("");

  const selectedCategory = categories.find((category) => category.id === form.categoryId);
  const sizePreset = detectSizePreset(selectedCategory?.name, selectedCategory?.slug);
  const presetSizes = getSizesForPreset(sizePreset);

  useEffect(() => {
    axios.get("/api/categories").then((r) => setCategories(r.data.data || []));
  }, []);

  const addTag = () => {
    if (tagInput.trim() && !form.tags.split(",").includes(tagInput.trim())) {
      setForm((f) => ({ ...f, tags: f.tags ? `${f.tags},${tagInput.trim()}` : tagInput.trim() }));
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setForm((f) => ({ ...f, tags: f.tags.split(",").filter((t) => t !== tag).join(",") }));
  };

  const addImage = () => {
    const url = prompt("Enter image URL:");
    if (url) setForm((f) => ({ ...f, images: [...f.images, url] }));
  };

  const addVariant = () => {
    setVariants((v) => [...v, { sku: "", price: "", stock: "", attributes: "" }]);
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
        price: form.price || "",
        stock: form.stock || "0",
        attributes: JSON.stringify({ size }),
      }));

    if (nextVariants.length === 0) {
      toast("All preset sizes are already added");
      return;
    }

    setVariants((current) => [...current, ...nextVariants]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        comparePrice: form.comparePrice ? parseFloat(form.comparePrice) : undefined,
        costPrice: form.costPrice ? parseFloat(form.costPrice) : undefined,
        stock: parseInt(form.stock),
        lowStockAlert: parseInt(form.lowStockAlert),
        taxRate: parseFloat(form.taxRate),
        shippingCost: parseFloat(form.shippingCost),
        weight: form.weight ? parseFloat(form.weight) : undefined,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        thumbnail: form.thumbnail || form.images[0],
        variants: variants
          .map((variant) => {
            try {
              const attributes = JSON.parse(variant.attributes || "{}");
              return {
                name: Object.values(attributes).join(" / ") || "Variant",
                sku: variant.sku,
                price: variant.price ? parseFloat(variant.price) : undefined,
                stock: parseInt(variant.stock || "0", 10),
                attributes,
                image: variant.image,
                isActive: true,
              };
            } catch {
              return null;
            }
          })
          .filter((variant): variant is NonNullable<typeof variant> => Boolean(variant && variant.sku)),
      };

      await axios.post("/api/products", payload);
      toast.success("Product created successfully!");
      router.push("/admin/products");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create product");
    } finally {
      setSaving(false);
    }
  };

  const tags = form.tags ? form.tags.split(",").filter(Boolean) : [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Add New Product</h1>
            <p className="text-gray-500 text-sm">Fill in the details to add a new product</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, status: "DRAFT" }))}
            className="btn-secondary"
          >
            Save as Draft
          </button>
          <button
            form="product-form"
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            Publish Product
          </button>
        </div>
      </div>

      <form id="product-form" onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <h2 className="font-bold text-gray-900">Basic Information</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Product Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Enter product name"
                  required
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Short Description</label>
                <input
                  type="text"
                  value={form.shortDesc}
                  onChange={(e) => setForm({ ...form, shortDesc: e.target.value })}
                  placeholder="Brief product summary (shown in listings)"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Description *</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Detailed product description..."
                  required
                  rows={6}
                  className="input-field resize-none"
                />
              </div>
            </div>

            {/* Images */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-gray-900">Product Images</h2>
                <button type="button" onClick={addImage} className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">
                  <Plus className="w-4 h-4" /> Add Image URL
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Thumbnail URL</label>
                <input
                  type="url"
                  value={form.thumbnail}
                  onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="input-field"
                />
              </div>
              {form.images.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {form.images.map((img, i) => (
                    <div key={i} className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden group">
                      <img src={img} alt={`Image ${i}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }))}
                        className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pricing */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <h2 className="font-bold text-gray-900">Pricing</h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Selling Price (₹) *</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="0.00"
                    required
                    min="0"
                    step="0.01"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Compare Price (₹)</label>
                  <input
                    type="number"
                    value={form.comparePrice}
                    onChange={(e) => setForm({ ...form, comparePrice: e.target.value })}
                    placeholder="MRP"
                    min="0"
                    step="0.01"
                    className="input-field"
                  />
                  <p className="text-xs text-gray-400 mt-1">Shown as crossed out price</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Cost Price (₹)</label>
                  <input
                    type="number"
                    value={form.costPrice}
                    onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                    placeholder="Your cost"
                    min="0"
                    step="0.01"
                    className="input-field"
                  />
                  <p className="text-xs text-gray-400 mt-1">For profit tracking only</p>
                </div>
              </div>
            </div>

            {/* Inventory */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <h2 className="font-bold text-gray-900">Inventory</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">SKU *</label>
                  <input
                    type="text"
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    placeholder="SE-PRD-001"
                    required
                    className="input-field font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Stock Quantity *</label>
                  <input
                    type="number"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    placeholder="0"
                    required
                    min="0"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Low Stock Alert</label>
                  <input
                    type="number"
                    value={form.lowStockAlert}
                    onChange={(e) => setForm({ ...form, lowStockAlert: e.target.value })}
                    placeholder="5"
                    min="0"
                    className="input-field"
                  />
                  <p className="text-xs text-gray-400 mt-1">Alert when stock reaches this level</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Weight (kg)</label>
                  <input
                    type="number"
                    value={form.weight}
                    onChange={(e) => setForm({ ...form, weight: e.target.value })}
                    placeholder="0.5"
                    min="0"
                    step="0.01"
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            {/* Variants */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-gray-900">Product Variants</h2>
                <div className="flex items-center gap-2">
                  {presetSizes.length > 0 && (
                    <button type="button" onClick={addPresetSizes} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
                      <Plus className="w-4 h-4" /> Add {getPresetLabel(sizePreset)}
                    </button>
                  )}
                  <button type="button" onClick={addVariant} className="flex items-center gap-2 text-sm text-green-600 hover:text-green-700 font-medium">
                    <Plus className="w-4 h-4" /> Add Variant
                  </button>
                </div>
              </div>
              {variants.length === 0 ? (
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-500 text-sm">
                  No variants added. Add variants for different sizes, colors, etc.
                </div>
              ) : (
                <div className="space-y-4">
                  {variants.map((v, i) => (
                    <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-700">Variant {i + 1}</span>
                        <button
                          type="button"
                          onClick={() => setVariants((prev) => prev.filter((_, idx) => idx !== i))}
                          className="text-red-400 hover:text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <input
                          type="text"
                          value={v.sku}
                          onChange={(e) => setVariants((prev) => prev.map((item, idx) => idx === i ? { ...item, sku: e.target.value } : item))}
                          placeholder="Variant SKU"
                          className="input-field text-sm font-mono"
                        />
                        <input
                          type="text"
                          value={v.attributes}
                          onChange={(e) => setVariants((prev) => prev.map((item, idx) => idx === i ? { ...item, attributes: e.target.value } : item))}
                          placeholder='{"size":"M","color":"Blue"}'
                          className="input-field text-sm"
                        />
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={v.price}
                            onChange={(e) => setVariants((prev) => prev.map((item, idx) => idx === i ? { ...item, price: e.target.value } : item))}
                            placeholder="Price"
                            className="input-field text-sm"
                          />
                          <input
                            type="number"
                            value={v.stock}
                            onChange={(e) => setVariants((prev) => prev.map((item, idx) => idx === i ? { ...item, stock: e.target.value } : item))}
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

            {/* SEO */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <h2 className="font-bold text-gray-900">SEO & Meta</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Meta Title</label>
                <input type="text" value={form.metaTitle} onChange={(e) => setForm({ ...form, metaTitle: e.target.value })} placeholder="SEO title" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Meta Description</label>
                <textarea value={form.metaDesc} onChange={(e) => setForm({ ...form, metaDesc: e.target.value })} placeholder="SEO description" rows={3} className="input-field resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Keywords</label>
                <input type="text" value={form.metaKeywords} onChange={(e) => setForm({ ...form, metaKeywords: e.target.value })} placeholder="keyword1, keyword2..." className="input-field" />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
              <h2 className="font-bold text-gray-900">Product Status</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input-field">
                  <option value="DRAFT">Draft</option>
                  <option value="ACTIVE">Active (Live)</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>

              <div className="space-y-3 border-t border-gray-100 pt-4">
                {[
                  { key: "featured", label: "Featured Product" },
                  { key: "isBestSeller", label: "Best Seller" },
                  { key: "isNew", label: "New Arrival" },
                  { key: "freeShipping", label: "Free Shipping" },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm text-gray-700">{label}</span>
                    <div
                      onClick={() => setForm((f) => ({ ...f, [key]: !f[key as keyof typeof f] }))}
                      className={`w-10 h-5.5 rounded-full transition-colors cursor-pointer relative flex items-center ${
                        form[key as keyof typeof form] ? "bg-gray-900" : "bg-gray-200"
                      }`}
                    >
                      <span className={`w-4 h-4 bg-white rounded-full absolute transition-transform shadow ${
                        form[key as keyof typeof form] ? "translate-x-5" : "translate-x-0.5"
                      }`} />
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Category & Brand */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
              <h2 className="font-bold text-gray-900">Organization</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Category *</label>
                <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} required className="input-field">
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Brand</label>
                <input type="text" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="Brand name" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tags</label>
                <div className="flex gap-2 mb-2 flex-wrap">
                  {tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="text-gray-400 hover:text-gray-700"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    placeholder="Add tag + Enter"
                    className="input-field flex-1 text-sm"
                  />
                  <button type="button" onClick={addTag} className="px-3 py-2 bg-gray-100 rounded-xl text-sm hover:bg-gray-200">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Shipping & Tax */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
              <h2 className="font-bold text-gray-900">Shipping & Tax</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Shipping Cost (₹)</label>
                <input
                  type="number"
                  value={form.shippingCost}
                  onChange={(e) => setForm({ ...form, shippingCost: e.target.value })}
                  className="input-field"
                  min="0"
                  step="0.01"
                  disabled={form.freeShipping}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tax Rate (%)</label>
                <input
                  type="number"
                  value={form.taxRate}
                  onChange={(e) => setForm({ ...form, taxRate: e.target.value })}
                  className="input-field"
                  min="0"
                  max="100"
                  step="0.01"
                />
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
