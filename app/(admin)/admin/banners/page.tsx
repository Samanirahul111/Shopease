"use client";

import { useState, useEffect } from "react";
import { Image, Plus, Trash2, ToggleLeft, ToggleRight, X, ExternalLink } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

const positions = ["HOME_HERO", "HOME_PROMO", "CATEGORY_TOP"];
const emptyForm = { title: "", subtitle: "", image: "", mobileImage: "", link: "", buttonText: "", position: "HOME_HERO", sortOrder: 0, isActive: true };

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchBanners = () => {
    axios.get("/api/admin/banners").then((res) => setBanners(res.data.data || [])).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { fetchBanners(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editId) {
        await axios.put("/api/admin/banners", { id: editId, ...form });
        toast.success("Banner updated");
      } else {
        await axios.post("/api/admin/banners", form);
        toast.success("Banner created");
      }
      setShowForm(false); setEditId(null); setForm(emptyForm);
      fetchBanners();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to save banner");
    } finally { setSubmitting(false); }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try { await axios.put("/api/admin/banners", { id, isActive: !isActive }); fetchBanners(); }
    catch { toast.error("Failed to update"); }
  };

  const deleteBanner = async (id: string) => {
    if (!confirm("Delete this banner?")) return;
    try { await axios.delete(`/api/admin/banners?id=${id}`); toast.success("Banner deleted"); fetchBanners(); }
    catch { toast.error("Failed to delete"); }
  };

  const handleEdit = (b: any) => {
    setEditId(b.id);
    setForm({ title: b.title, subtitle: b.subtitle || "", image: b.image, mobileImage: b.mobileImage || "",
      link: b.link || "", buttonText: b.buttonText || "", position: b.position, sortOrder: b.sortOrder, isActive: b.isActive });
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Banners & CMS</h1>
          <p className="text-sm text-gray-500 mt-1">Manage homepage and promotional banners</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Banner
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900">{editId ? "Edit Banner" : "New Banner"}</h2>
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field w-full" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
              <input type="text" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} className="input-field w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image URL *</label>
              <input type="url" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className="input-field w-full" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Image URL</label>
              <input type="url" value={form.mobileImage} onChange={(e) => setForm({ ...form, mobileImage: e.target.value })} className="input-field w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Link URL</label>
              <input type="text" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} className="input-field w-full" placeholder="/shop or https://..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
              <input type="text" value={form.buttonText} onChange={(e) => setForm({ ...form, buttonText: e.target.value })} className="input-field w-full" placeholder="Shop Now" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
              <select value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className="input-field w-full">
                {positions.map((p) => <option key={p} value={p}>{p.replace("_", " ")}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
              <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} className="input-field w-full" min="0" />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="button" onClick={() => { setShowForm(false); setEditId(null); }}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition">Cancel</button>
              <button type="submit" disabled={submitting} className="flex-1 btn-primary">
                {submitting ? "Saving..." : editId ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {loading ? (
          [...Array(3)].map((_, i) => <div key={i} className="h-32 shimmer-line rounded-2xl" />)
        ) : banners.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
            <Image className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">No banners yet</p>
          </div>
        ) : banners.map((banner) => (
          <div key={banner.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex">
            <div className="w-40 h-28 flex-shrink-0">
              <img src={banner.image} alt={banner.title} className="w-full h-full object-cover" onError={(e: any) => { e.target.src = "https://via.placeholder.com/160x112"; }} />
            </div>
            <div className="flex-1 p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-gray-900">{banner.title}</p>
                {banner.subtitle && <p className="text-sm text-gray-500 mt-0.5">{banner.subtitle}</p>}
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{banner.position}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${banner.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {banner.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {banner.link && (
                  <a href={banner.link} target="_blank" rel="noreferrer" className="p-1.5 hover:bg-gray-100 rounded-lg transition">
                    <ExternalLink className="w-4 h-4 text-gray-500" />
                  </a>
                )}
                <button onClick={() => handleEdit(banner)} className="p-1.5 hover:bg-gray-100 rounded-lg transition text-sm text-gray-600 font-medium px-3">Edit</button>
                <button onClick={() => toggleActive(banner.id, banner.isActive)} className="p-1.5 hover:bg-gray-100 rounded-lg transition">
                  {banner.isActive ? <ToggleRight className="w-5 h-5 text-green-600" /> : <ToggleLeft className="w-5 h-5 text-gray-400" />}
                </button>
                <button onClick={() => deleteBanner(banner.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition">
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
