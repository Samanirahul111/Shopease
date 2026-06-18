"use client";

import { useState, useEffect } from "react";
import { Save, Settings, Store, Mail, Globe, Shield } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

const defaultSettings = [
  { group: "general", key: "site_name", label: "Site Name", type: "string", placeholder: "ShopEase" },
  { group: "general", key: "site_tagline", label: "Site Tagline", type: "string", placeholder: "Your one-stop shop" },
  { group: "general", key: "site_email", label: "Support Email", type: "string", placeholder: "support@store.com" },
  { group: "general", key: "site_phone", label: "Support Phone", type: "string", placeholder: "+91 9876543210" },
  { group: "general", key: "site_currency", label: "Currency", type: "string", placeholder: "INR" },
  { group: "shipping", key: "free_shipping_threshold", label: "Free Shipping Above (₹)", type: "number", placeholder: "999" },
  { group: "shipping", key: "default_shipping_cost", label: "Default Shipping Cost (₹)", type: "number", placeholder: "49" },
  { group: "orders", key: "min_order_amount", label: "Minimum Order Amount (₹)", type: "number", placeholder: "0" },
  { group: "orders", key: "cod_available", label: "COD Available", type: "boolean", placeholder: "true" },
  { group: "orders", key: "online_payments_available", label: "Online Payments Available", type: "boolean", placeholder: "true" },
  { group: "orders", key: "razorpay_enabled", label: "Razorpay Enabled", type: "boolean", placeholder: "true" },
  { group: "orders", key: "stripe_enabled", label: "Stripe Enabled", type: "boolean", placeholder: "true" },
  { group: "orders", key: "wallet_enabled", label: "Wallet Payment Enabled", type: "boolean", placeholder: "true" },
  { group: "wallet", key: "min_withdrawal_amount", label: "Min Withdrawal Amount (₹)", type: "number", placeholder: "100" },
  { group: "wallet", key: "referral_bonus", label: "Referral Bonus (₹)", type: "number", placeholder: "50" },
  { group: "notifications", key: "admin_email_notifications", label: "Admin Email Notifications", type: "boolean", placeholder: "true" },
  { group: "notifications", key: "telegram_notifications", label: "Telegram Notifications", type: "boolean", placeholder: "false" },
];

const groupIcons: Record<string, typeof Settings> = {
  general: Store, shipping: Globe, orders: Shield, wallet: Settings, notifications: Mail,
};

export default function AdminSettingsPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axios.get("/api/admin/settings").then((res) => {
      const flat: Record<string, string> = {};
      Object.values(res.data.data || {}).forEach((group: any) => {
        group.forEach((s: any) => { flat[s.key] = s.value; });
      });
      const defaults: Record<string, string> = {};
      defaultSettings.forEach((s) => { defaults[s.key] = flat[s.key] ?? s.placeholder; });
      setValues(defaults);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const settings = defaultSettings.map((s) => ({
        key: s.key, value: values[s.key] ?? "", type: s.type, group: s.group,
      }));
      await axios.put("/api/admin/settings", { settings });
      toast.success("Settings saved successfully");
    } catch { toast.error("Failed to save settings"); }
    finally { setSaving(false); }
  };

  const groups = Array.from(new Set(defaultSettings.map((s) => s.group)));

  if (loading) return (
    <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-48 shimmer-line rounded-2xl" />)}</div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Configure your store settings</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save All"}
        </button>
      </div>

      {groups.map((group) => {
        const GroupIcon = groupIcons[group] || Settings;
        const groupSettings = defaultSettings.filter((s) => s.group === group);
        return (
          <div key={group} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-3 p-5 border-b border-gray-100">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <GroupIcon className="w-4 h-4 text-gray-700" />
              </div>
              <h2 className="font-semibold text-gray-900 capitalize">{group} Settings</h2>
            </div>
            <div className="p-5 grid sm:grid-cols-2 gap-5">
              {groupSettings.map((setting) => (
                <div key={setting.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{setting.label}</label>
                  {setting.type === "boolean" ? (
                    <select
                      value={values[setting.key] || "false"}
                      onChange={(e) => setValues({ ...values, [setting.key]: e.target.value })}
                      className="input-field w-full"
                    >
                      <option value="true">Enabled</option>
                      <option value="false">Disabled</option>
                    </select>
                  ) : (
                    <input
                      type={setting.type === "number" ? "number" : "text"}
                      value={values[setting.key] || ""}
                      onChange={(e) => setValues({ ...values, [setting.key]: e.target.value })}
                      placeholder={setting.placeholder}
                      className="input-field w-full"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
