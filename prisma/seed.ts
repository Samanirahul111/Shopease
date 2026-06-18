import { PrismaClient, ProductStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Create admin user
  const adminPassword = await bcrypt.hash("Admin@123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@shopease.com" },
    update: {},
    create: {
      email: "admin@shopease.com",
      name: "Admin User",
      password: adminPassword,
      role: "ADMIN",
      status: "ACTIVE",
      emailVerified: new Date(),
    },
  });
  console.log("✅ Admin user created:", admin.email);

  // Create wallet for admin
  await prisma.wallet.upsert({
    where: { userId: admin.id },
    update: {},
    create: { userId: admin.id, balance: 0 },
  });

  // Create categories
  const categories = [
    { name: "Electronics", slug: "electronics", description: "Gadgets, devices, and more", icon: "💻", sortOrder: 1 },
    { name: "Fashion", slug: "fashion", description: "Clothing, accessories, and footwear", icon: "👗", sortOrder: 2 },
    { name: "Home & Kitchen", slug: "home-kitchen", description: "Everything for your home", icon: "🏠", sortOrder: 3 },
    { name: "Books", slug: "books", description: "Books, stationery, and more", icon: "📚", sortOrder: 4 },
    { name: "Sports & Fitness", slug: "sports-fitness", description: "Equipment and accessories", icon: "⚽", sortOrder: 5 },
    { name: "Beauty & Health", slug: "beauty-health", description: "Beauty products and healthcare", icon: "💄", sortOrder: 6 },
  ];

  const createdCategories: Record<string, string> = {};
  for (const cat of categories) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { ...cat, isActive: true },
    });
    createdCategories[cat.slug] = created.id;
    console.log("✅ Category created:", cat.name);
  }

  // Create sample products
  const products: any[] = [
    {
      name: "Wireless Bluetooth Headphones",
      slug: "wireless-bluetooth-headphones",
      description: "Premium wireless headphones with active noise cancellation and 30-hour battery life.",
      shortDesc: "ANC wireless headphones with 30hr battery",
      sku: "ELEC-001",
      price: 2999,
      comparePrice: 4999,
      stock: 50,
      categorySlug: "electronics",
      brand: "TechPro",
      tags: ["wireless", "bluetooth", "headphones", "audio"],
      images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500"],
      featured: true,
      isBestSeller: true,
      isNew: false,
      status: "ACTIVE",
      taxRate: 18,
    },
    {
      name: "Smart Watch Premium Series",
      slug: "smart-watch-premium",
      description: "Feature-packed smart watch with health monitoring, GPS, and 7-day battery.",
      shortDesc: "Health tracking smart watch with GPS",
      sku: "ELEC-002",
      price: 5499,
      comparePrice: 8999,
      stock: 30,
      categorySlug: "electronics",
      brand: "TechPro",
      tags: ["smartwatch", "fitness", "wearable"],
      images: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500"],
      featured: true,
      isBestSeller: false,
      isNew: true,
      status: "ACTIVE",
      taxRate: 18,
    },
    {
      name: "Premium Cotton T-Shirt",
      slug: "premium-cotton-tshirt",
      description: "100% premium cotton t-shirt with comfortable fit for everyday wear.",
      shortDesc: "Soft premium cotton everyday tee",
      sku: "FASH-001",
      price: 499,
      comparePrice: 799,
      stock: 100,
      categorySlug: "fashion",
      brand: "StyleCo",
      tags: ["tshirt", "cotton", "casual", "fashion"],
      images: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500"],
      featured: false,
      isBestSeller: true,
      isNew: false,
      status: "ACTIVE",
      taxRate: 5,
    },
    {
      name: "Non-Stick Cookware Set",
      slug: "non-stick-cookware-set",
      description: "5-piece premium non-stick cookware set suitable for all cooktops including induction.",
      shortDesc: "5-piece induction-compatible cookware set",
      sku: "HOME-001",
      price: 1899,
      comparePrice: 2999,
      stock: 25,
      categorySlug: "home-kitchen",
      brand: "KitchenPro",
      tags: ["cookware", "kitchen", "non-stick", "induction"],
      images: ["https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500"],
      featured: true,
      isBestSeller: false,
      isNew: false,
      status: "ACTIVE",
      taxRate: 12,
    },
    {
      name: "Yoga Mat Premium",
      slug: "yoga-mat-premium",
      description: "Extra thick 6mm non-slip yoga mat with alignment lines and carrying strap.",
      shortDesc: "6mm non-slip yoga mat with carry strap",
      sku: "SPORT-001",
      price: 799,
      comparePrice: 1299,
      stock: 60,
      categorySlug: "sports-fitness",
      brand: "FitLife",
      tags: ["yoga", "fitness", "exercise", "mat"],
      images: ["https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500"],
      featured: false,
      isBestSeller: false,
      isNew: true,
      status: "ACTIVE",
      taxRate: 5,
    },
  ];

  for (const prod of products) {
    const { categorySlug, ...productData } = prod;
    const categoryId = createdCategories[categorySlug];
    if (!categoryId) continue;

    await prisma.product.upsert({
      where: { slug: prod.slug },
      update: {},
      create: {
        ...productData,
        thumbnail: productData.images[0],
        categoryId,
        lowStockAlert: 5,
        freeShipping: false,
        shippingCost: 0,
      },
    });
    console.log("✅ Product created:", prod.name);
  }

  // Create sample coupons
  const coupons = [
    { code: "WELCOME10", name: "Welcome 10% Off", type: "PERCENTAGE" as const, value: 10, minOrderAmount: 500, maxDiscount: 200, perUserLimit: 1 },
    { code: "FLAT100", name: "Flat ₹100 Off", type: "FIXED_AMOUNT" as const, value: 100, minOrderAmount: 999, perUserLimit: 2 },
    { code: "FREESHIP", name: "Free Shipping", type: "FREE_SHIPPING" as const, value: 0, perUserLimit: 3 },
  ];

  for (const coupon of coupons) {
    await prisma.coupon.upsert({
      where: { code: coupon.code },
      update: {},
      create: { ...coupon, isActive: true },
    });
    console.log("✅ Coupon created:", coupon.code);
  }

  // Create site settings
  const settings = [
    { key: "site_name", value: "ShopEase", type: "string", group: "general" },
    { key: "site_tagline", value: "Your One-Stop Shop", type: "string", group: "general" },
    { key: "site_email", value: "support@shopease.com", type: "string", group: "general" },
    { key: "site_phone", value: "+91 98765 43210", type: "string", group: "general" },
    { key: "site_currency", value: "INR", type: "string", group: "general" },
    { key: "free_shipping_threshold", value: "999", type: "number", group: "shipping" },
    { key: "default_shipping_cost", value: "49", type: "number", group: "shipping" },
    { key: "min_order_amount", value: "0", type: "number", group: "orders" },
    { key: "cod_available", value: "true", type: "boolean", group: "orders" },
    { key: "online_payments_available", value: "true", type: "boolean", group: "orders" },
    { key: "razorpay_enabled", value: "true", type: "boolean", group: "orders" },
    { key: "stripe_enabled", value: "true", type: "boolean", group: "orders" },
    { key: "wallet_enabled", value: "true", type: "boolean", group: "orders" },
    { key: "min_withdrawal_amount", value: "100", type: "number", group: "wallet" },
  ];

  for (const setting of settings) {
    await prisma.siteSettings.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }
  console.log("✅ Site settings created");

  // Create sample banner
  await prisma.banner.upsert({
    where: { id: "banner-hero-1" },
    update: {},
    create: {
      id: "banner-hero-1",
      title: "New Arrivals",
      subtitle: "Discover our latest collection",
      image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200",
      link: "/shop?filter=new",
      buttonText: "Shop Now",
      position: "HOME_HERO",
      sortOrder: 0,
      isActive: true,
    },
  });
  console.log("✅ Sample banner created");

  console.log("\n🎉 Database seeded successfully!");
  console.log("\n📋 Admin credentials:");
  console.log("   Email: admin@shopease.com");
  console.log("   Password: Admin@123");
  console.log("\n🎟️  Sample coupons: WELCOME10, FLAT100, FREESHIP");
}

main()
  .catch((e) => { console.error("Seed failed:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
