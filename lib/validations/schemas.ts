import { z } from "zod";

// ==================== AUTH ====================
export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain uppercase, lowercase, and number"
    ),
  phone: z
    .string()
    .optional()
    .transform((val) => {
      if (!val || val.trim() === "") return undefined;
      return val.replace(/[\s()-]/g, "");
    })
    .refine(
      (val) => !val || /^\+?[1-9]\d{6,14}$/.test(val) || /^\d{10}$/.test(val),
      "Invalid phone number"
    ),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const otpSendSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().regex(/^\+?[1-9]\d{6,14}$/).optional(),
  purpose: z.enum(["VERIFY_EMAIL", "PHONE_LOGIN", "FORGOT_PASSWORD"]),
});

export const otpVerifySchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  code: z.string().length(6, "OTP must be 6 digits"),
  purpose: z.enum(["VERIFY_EMAIL", "PHONE_LOGIN", "FORGOT_PASSWORD"]),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain uppercase, lowercase, and number"
    ),
});

// ==================== PRODUCT ====================
const productVariantSchema = z.object({
  name: z.string().min(1).max(120),
  sku: z.string().min(1).max(120),
  price: z.number().positive().optional(),
  stock: z.number().int().min(0),
  image: z.string().url().optional(),
  attributes: z.record(z.string(), z.string().min(1)).refine(
    (value) => Object.keys(value).length > 0,
    "Variant attributes are required"
  ),
  isActive: z.boolean().default(true),
});

export const createProductSchema = z.object({
  name: z.string().min(2).max(255),
  description: z.string().min(10),
  shortDesc: z.string().max(500).optional(),
  sku: z.string().min(1).max(100),
  price: z.number().positive("Price must be positive"),
  comparePrice: z.number().positive().optional(),
  costPrice: z.number().positive().optional(),
  stock: z.number().int().min(0),
  lowStockAlert: z.number().int().min(0).default(5),
  categoryId: z.string().min(1),
  brand: z.string().optional(),
  tags: z.array(z.string()).default([]),
  images: z.array(z.string().url()).default([]),
  thumbnail: z.string().url().optional(),
  weight: z.number().positive().optional(),
  metaTitle: z.string().max(255).optional(),
  metaDesc: z.string().max(500).optional(),
  metaKeywords: z.string().optional(),
  featured: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  isNew: z.boolean().default(false),
  taxRate: z.number().min(0).max(100).default(0),
  freeShipping: z.boolean().default(false),
  shippingCost: z.number().min(0).default(0),
  status: z.enum(["DRAFT", "ACTIVE", "INACTIVE"]).default("DRAFT"),
  variants: z.array(productVariantSchema).default([]),
});

export const updateProductSchema = createProductSchema.partial();

// ==================== ORDER ====================
export const createOrderSchema = z.object({
  addressId: z.string().min(1, "Delivery address is required"),
  paymentMethod: z.enum(["STRIPE", "RAZORPAY", "COD", "WALLET"]),
  couponCode: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED",
    "REFUND_REQUESTED",
    "REFUNDED",
  ]),
  trackingNumber: z.string().optional(),
  trackingUrl: z.string().url().optional(),
  carrier: z.string().optional(),
  cancelReason: z.string().optional(),
  refundAmount: z.number().positive().optional(),
  refundReason: z.string().optional(),
});

// ==================== ADDRESS ====================
export const addressSchema = z.object({
  label: z.string().default("Home"),
  fullName: z.string().min(2).max(100),
  phone: z
    .string()
    .min(7)
    .max(20)
    .transform((value) => value.replace(/[\s()-]/g, ""))
    .refine(
      (value) => /^\+?[1-9]\d{6,14}$/.test(value) || /^\d{10}$/.test(value),
      "Invalid phone number"
    ),
  addressLine1: z.string().min(5).max(255),
  addressLine2: z.string().max(255).optional(),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  postalCode: z.string().min(4).max(20),
  country: z.string().default("India"),
  isDefault: z.boolean().default(false),
});

// ==================== REVIEW ====================
export const createReviewSchema = z.object({
  productId: z.string().min(1),
  orderId: z.string().optional(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(255).optional(),
  content: z.string().max(2000).optional(),
  images: z.array(z.string().url()).default([]),
});

// ==================== COUPON ====================
export const createCouponSchema = z.object({
  code: z.string().min(3).max(50).toUpperCase(),
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  type: z.enum(["PERCENTAGE", "FIXED_AMOUNT", "FREE_SHIPPING"]),
  value: z.number().min(0),
  minOrderAmount: z.number().positive().optional(),
  maxDiscount: z.number().positive().optional(),
  usageLimit: z.number().int().positive().optional(),
  perUserLimit: z.number().int().positive().default(1),
  isActive: z.boolean().default(true),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// ==================== WITHDRAWAL ====================
export const withdrawalSchema = z.object({
  amount: z.number().positive().min(100, "Minimum withdrawal is ₹100"),
  method: z.enum(["BANK_TRANSFER", "UPI"]),
  accountDetails: z.union([
    z.object({
      accountNumber: z.string().min(8),
      ifsc: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code"),
      bankName: z.string().min(2),
      accountHolderName: z.string().min(2),
    }),
    z.object({
      upiId: z.string().regex(/^[a-zA-Z0-9._]+@[a-zA-Z]{3,}$/, "Invalid UPI ID"),
      accountHolderName: z.string().min(2),
    }),
  ]),
});

// ==================== CART ====================
export const addToCartSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional(),
  quantity: z.number().int().positive().max(100),
});

// ==================== CONTACT ====================
export const contactFormSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  subject: z.string().min(5).max(255),
  message: z.string().min(10).max(2000),
});

// ==================== PROFILE ====================
export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().regex(/^\+?[1-9]\d{6,14}$/).optional(),
  avatar: z.string().url().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(8)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
});
