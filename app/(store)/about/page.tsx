import Link from "next/link";
import { ShieldCheck, Truck, HeadphonesIcon, Star, Users, Award } from "lucide-react";

export const metadata = { title: "About Us" };

export default function AboutPage() {
  const values = [
    { icon: ShieldCheck, title: "Quality First", desc: "Every product is carefully curated and quality-checked before listing." },
    { icon: Truck, title: "Fast Delivery", desc: "Same-day dispatch with delivery partners for quick and reliable shipping." },
    { icon: HeadphonesIcon, title: "24/7 Support", desc: "Our dedicated team is available round the clock for your queries." },
    { icon: Star, title: "Best Prices", desc: "Competitive pricing with regular deals and discounts for our customers." },
  ];

  const stats = [
    { label: "Happy Customers", value: "50,000+" },
    { label: "Products Listed", value: "5,000+" },
    { label: "Cities Served", value: "500+" },
    { label: "Years of Trust", value: "5+" },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-700 text-white py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6">About ShopEase</h1>
          <p className="text-xl text-gray-300 leading-relaxed">
            We're on a mission to make quality products accessible to everyone. Founded with a vision to bring the best shopping experience right to your doorstep.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white py-16 px-4 border-b border-gray-100">
        <div className="max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="text-4xl font-bold text-gray-900">{value}</p>
              <p className="text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Our Story */}
      <div className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Our Story</h2>
          <div className="prose prose-lg max-w-none text-gray-600 text-center">
            <p className="text-lg leading-relaxed">
              ShopEase was born from a simple idea: everyone deserves access to quality products at fair prices. We started as a small operation and have grown into a trusted platform serving customers across India.
            </p>
            <p className="text-lg leading-relaxed mt-4">
              Our team works tirelessly to source the finest products, ensure they meet our quality standards, and deliver them to you promptly. We believe in building lasting relationships with our customers, not just completing transactions.
            </p>
          </div>
        </div>
      </div>

      {/* Values */}
      <div className="bg-gray-50 py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">Our Values</h2>
          <p className="text-gray-500 text-center mb-12">What drives us every day</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-6 text-center shadow-sm">
                <div className="w-12 h-12 bg-gray-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="py-20 px-4 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Shop?</h2>
        <p className="text-gray-500 mb-8">Browse thousands of products at unbeatable prices</p>
        <Link href="/shop" className="btn-primary text-lg px-8 py-3">Explore Products</Link>
      </div>
    </div>
  );
}
