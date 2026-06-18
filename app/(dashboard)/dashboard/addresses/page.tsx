"use client";

import { useState, useEffect } from "react";
import { MapPin, Plus, Edit2, Trash2, X, LocateFixed } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

const emptyForm = {
  label: "Home", fullName: "", phone: "", addressLine1: "", addressLine2: "",
  city: "", state: "", postalCode: "", country: "India", isDefault: false,
};

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);

  const fetchAddresses = async () => {
    try {
      const res = await axios.get("/api/user/addresses");
      setAddresses(res.data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAddresses(); }, []);

  const handleEdit = (addr: any) => {
    setEditId(addr.id);
    setForm({ label: addr.label, fullName: addr.fullName, phone: addr.phone, addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 || "", city: addr.city, state: addr.state,
      postalCode: addr.postalCode, country: addr.country, isDefault: addr.isDefault });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editId) {
        await axios.put(`/api/user/addresses`, { id: editId, ...form });
        toast.success("Address updated");
      } else {
        await axios.post("/api/user/addresses", form);
        toast.success("Address added");
      }
      setShowForm(false); setEditId(null); setForm(emptyForm);
      fetchAddresses();
    } catch (err: any) {
      const message = err.response?.data?.message;
      const errors = err.response?.data?.errors;
      const firstFieldError = errors ? Object.values(errors).flat()[0] : null;
      toast.error((firstFieldError as string) || message || "Failed to save address");
    } finally { setSubmitting(false); }
  };

  const fillFromCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported on this browser");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await axios.get("/api/location/reverse", {
            params: { lat: latitude, lon: longitude },
          });

          const location = res.data?.data || {};
          setForm((prev) => ({
            ...prev,
            addressLine1: location.addressLine1 || prev.addressLine1,
            city: location.city || prev.city,
            state: location.state || prev.state,
            postalCode: location.postalCode || prev.postalCode,
            country: location.country || prev.country,
          }));
          toast.success("Location fetched. Please verify and save.");
        } catch (error: any) {
          toast.error(error?.response?.data?.message || "Failed to fetch location");
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        toast.error("Unable to access your location");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this address?")) return;
    try {
      await axios.delete(`/api/user/addresses?id=${id}`);
      toast.success("Address deleted");
      fetchAddresses();
    } catch { toast.error("Failed to delete address"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Saved Addresses</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your delivery addresses</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm); }}
          className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Address
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900">{editId ? "Edit Address" : "New Address"}</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fillFromCurrentLocation}
                disabled={locating}
                className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-60 flex items-center gap-1.5"
              >
                <LocateFixed className="w-3.5 h-3.5" />
                {locating ? "Detecting..." : "Use Current Location"}
              </button>
              <button onClick={() => { setShowForm(false); setEditId(null); }} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
              <select value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className="input-field w-full">
                <option>Home</option><option>Work</option><option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input type="text" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="input-field w-full" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field w-full" required />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
              <input type="text" value={form.addressLine1} onChange={(e) => setForm({ ...form, addressLine1: e.target.value })} className="input-field w-full" required />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2 (Optional)</label>
              <input type="text" value={form.addressLine2} onChange={(e) => setForm({ ...form, addressLine2: e.target.value })} className="input-field w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="input-field w-full" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input type="text" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="input-field w-full" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
              <input type="text" value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} className="input-field w-full" required />
            </div>
            <div className="flex items-center gap-2 sm:col-span-2 mt-1">
              <input type="checkbox" id="isDefault" checked={form.isDefault}
                onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                className="w-4 h-4 rounded" />
              <label htmlFor="isDefault" className="text-sm text-gray-700">Set as default address</label>
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="button" onClick={() => { setShowForm(false); setEditId(null); }}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition">Cancel</button>
              <button type="submit" disabled={submitting} className="flex-1 btn-primary">
                {submitting ? "Saving..." : editId ? "Update" : "Add Address"}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-40 shimmer-line rounded-2xl" />)}
        </div>
      ) : addresses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <MapPin className="w-14 h-14 text-gray-200 mx-auto mb-4" />
          <p className="font-semibold text-gray-600">No addresses saved</p>
          <p className="text-sm text-gray-400 mt-1">Add an address for faster checkout</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div key={addr.id} className={`bg-white rounded-2xl border p-5 relative ${addr.isDefault ? "border-gray-900" : "border-gray-100"}`}>
              {addr.isDefault && (
                <span className="absolute top-4 right-4 text-xs font-medium bg-gray-900 text-white px-2 py-0.5 rounded-full">Default</span>
              )}
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-semibold text-gray-900">{addr.label}</span>
              </div>
              <div className="text-sm text-gray-600 space-y-0.5">
                <p className="font-medium text-gray-900">{addr.fullName}</p>
                <p>{addr.addressLine1}</p>
                {addr.addressLine2 && <p>{addr.addressLine2}</p>}
                <p>{addr.city}, {addr.state} {addr.postalCode}</p>
                <p>{addr.phone}</p>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => handleEdit(addr)} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition">
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
                <button onClick={() => handleDelete(addr.id)} className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 px-3 py-1.5 border border-red-100 rounded-xl hover:bg-red-50 transition">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
