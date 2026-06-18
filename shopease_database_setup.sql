-- ============================================================
--  ShopEase — Complete Database Setup
--  Run this in psql or any PostgreSQL client (pgAdmin, DBeaver, etc.)
--  Instructions:
--    1. Connect to your PostgreSQL server
--    2. Paste or execute this entire file
--    3. Done! Admin login: admin@shopease.com / Admin@123
-- ============================================================

-- Create database (skip if already exists)
SELECT 'CREATE DATABASE shopease_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'shopease_db')\gexec

\c shopease_db;

-- ============================================================
--  ENUMS
-- ============================================================

DO $$ BEGIN
  CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'BANNED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "OrderStatus" AS ENUM (
    'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED',
    'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED',
    'REFUND_REQUESTED', 'REFUNDED', 'FAILED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "PaymentStatus" AS ENUM (
    'PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "PaymentMethod" AS ENUM ('STRIPE', 'RAZORPAY', 'COD', 'WALLET');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE', 'OUT_OF_STOCK', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "CouponType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "WalletTransactionType" AS ENUM ('CREDIT', 'DEBIT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "WalletTransactionSource" AS ENUM (
    'ORDER_REFUND', 'ADMIN_CREDIT', 'WITHDRAWAL', 'REFERRAL_BONUS'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "WithdrawalStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'REJECTED', 'ON_HOLD');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "NotificationType" AS ENUM (
    'NEW_ORDER', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'NEW_CUSTOMER',
    'LOW_STOCK', 'REFUND_REQUEST', 'CONTACT_FORM', 'REVIEW_SUBMITTED',
    'ORDER_CANCELLED', 'WITHDRAWAL_REQUEST', 'SYSTEM'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
--  TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS "users" (
  "id"              TEXT        NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "email"           TEXT        NOT NULL,
  "emailVerified"   TIMESTAMP,
  "phone"           TEXT,
  "phoneVerified"   BOOLEAN     NOT NULL DEFAULT FALSE,
  "password"        TEXT,
  "name"            TEXT        NOT NULL,
  "avatar"          TEXT,
  "role"            "UserRole"  NOT NULL DEFAULT 'CUSTOMER',
  "status"          "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  "googleId"        TEXT,
  "referralCode"    TEXT,
  "referredBy"      TEXT,
  "lastLoginAt"     TIMESTAMP,
  "lastLoginIp"     TEXT,
  "createdAt"       TIMESTAMP   NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMP   NOT NULL DEFAULT NOW(),
  CONSTRAINT "users_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "users_email_key" UNIQUE ("email"),
  CONSTRAINT "users_phone_key" UNIQUE ("phone"),
  CONSTRAINT "users_googleId_key" UNIQUE ("googleId"),
  CONSTRAINT "users_referralCode_key" UNIQUE ("referralCode")
);
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users"("email");
CREATE INDEX IF NOT EXISTS "users_phone_idx" ON "users"("phone");

CREATE TABLE IF NOT EXISTS "sessions" (
  "id"         TEXT      NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "userId"     TEXT      NOT NULL,
  "token"      TEXT      NOT NULL,
  "deviceInfo" TEXT,
  "ipAddress"  TEXT,
  "expiresAt"  TIMESTAMP NOT NULL,
  "createdAt"  TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "sessions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "sessions_token_key" UNIQUE ("token"),
  CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "sessions_token_idx" ON "sessions"("token");
CREATE INDEX IF NOT EXISTS "sessions_userId_idx" ON "sessions"("userId");

CREATE TABLE IF NOT EXISTS "otp_codes" (
  "id"        TEXT      NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "userId"    TEXT,
  "email"     TEXT,
  "phone"     TEXT,
  "code"      TEXT      NOT NULL,
  "purpose"   TEXT      NOT NULL,
  "expiresAt" TIMESTAMP NOT NULL,
  "used"      BOOLEAN   NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "otp_codes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "otp_codes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "otp_codes_email_idx" ON "otp_codes"("email");
CREATE INDEX IF NOT EXISTS "otp_codes_phone_idx" ON "otp_codes"("phone");

CREATE TABLE IF NOT EXISTS "addresses" (
  "id"           TEXT      NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "userId"       TEXT      NOT NULL,
  "label"        TEXT      NOT NULL DEFAULT 'Home',
  "fullName"     TEXT      NOT NULL,
  "phone"        TEXT      NOT NULL,
  "addressLine1" TEXT      NOT NULL,
  "addressLine2" TEXT,
  "city"         TEXT      NOT NULL,
  "state"        TEXT      NOT NULL,
  "postalCode"   TEXT      NOT NULL,
  "country"      TEXT      NOT NULL DEFAULT 'India',
  "isDefault"    BOOLEAN   NOT NULL DEFAULT FALSE,
  "createdAt"    TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"    TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "addresses_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "addresses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "addresses_userId_idx" ON "addresses"("userId");

CREATE TABLE IF NOT EXISTS "categories" (
  "id"          TEXT      NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "name"        TEXT      NOT NULL,
  "slug"        TEXT      NOT NULL,
  "description" TEXT,
  "image"       TEXT,
  "icon"        TEXT,
  "parentId"    TEXT,
  "sortOrder"   INTEGER   NOT NULL DEFAULT 0,
  "isActive"    BOOLEAN   NOT NULL DEFAULT TRUE,
  "metaTitle"   TEXT,
  "metaDesc"    TEXT,
  "createdAt"   TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "categories_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "categories_name_key" UNIQUE ("name"),
  CONSTRAINT "categories_slug_key" UNIQUE ("slug"),
  CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "categories"("id")
);
CREATE INDEX IF NOT EXISTS "categories_slug_idx" ON "categories"("slug");
CREATE INDEX IF NOT EXISTS "categories_parentId_idx" ON "categories"("parentId");

CREATE TABLE IF NOT EXISTS "products" (
  "id"            TEXT            NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "name"          TEXT            NOT NULL,
  "slug"          TEXT            NOT NULL,
  "description"   TEXT            NOT NULL,
  "shortDesc"     TEXT,
  "sku"           TEXT            NOT NULL,
  "price"         DECIMAL(10,2)   NOT NULL,
  "comparePrice"  DECIMAL(10,2),
  "costPrice"     DECIMAL(10,2),
  "stock"         INTEGER         NOT NULL DEFAULT 0,
  "lowStockAlert" INTEGER         NOT NULL DEFAULT 5,
  "weight"        DECIMAL(8,2),
  "dimensions"    JSONB,
  "status"        "ProductStatus" NOT NULL DEFAULT 'DRAFT',
  "featured"      BOOLEAN         NOT NULL DEFAULT FALSE,
  "isBestSeller"  BOOLEAN         NOT NULL DEFAULT FALSE,
  "isNew"         BOOLEAN         NOT NULL DEFAULT FALSE,
  "categoryId"    TEXT            NOT NULL,
  "brand"         TEXT,
  "tags"          TEXT[]          NOT NULL DEFAULT '{}',
  "images"        TEXT[]          NOT NULL DEFAULT '{}',
  "thumbnail"     TEXT,
  "metaTitle"     TEXT,
  "metaDesc"      TEXT,
  "metaKeywords"  TEXT,
  "totalSold"     INTEGER         NOT NULL DEFAULT 0,
  "avgRating"     DECIMAL(3,2)    NOT NULL DEFAULT 0,
  "totalReviews"  INTEGER         NOT NULL DEFAULT 0,
  "taxClass"      TEXT            DEFAULT 'standard',
  "taxRate"       DECIMAL(5,2)    NOT NULL DEFAULT 0,
  "freeShipping"  BOOLEAN         NOT NULL DEFAULT FALSE,
  "shippingCost"  DECIMAL(10,2)   NOT NULL DEFAULT 0,
  "createdAt"     TIMESTAMP       NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMP       NOT NULL DEFAULT NOW(),
  CONSTRAINT "products_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "products_slug_key" UNIQUE ("slug"),
  CONSTRAINT "products_sku_key" UNIQUE ("sku"),
  CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id")
);
CREATE INDEX IF NOT EXISTS "products_slug_idx" ON "products"("slug");
CREATE INDEX IF NOT EXISTS "products_categoryId_idx" ON "products"("categoryId");
CREATE INDEX IF NOT EXISTS "products_status_idx" ON "products"("status");
CREATE INDEX IF NOT EXISTS "products_featured_idx" ON "products"("featured");

CREATE TABLE IF NOT EXISTS "product_variants" (
  "id"         TEXT          NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "productId"  TEXT          NOT NULL,
  "name"       TEXT          NOT NULL,
  "sku"        TEXT          NOT NULL,
  "price"      DECIMAL(10,2),
  "stock"      INTEGER       NOT NULL DEFAULT 0,
  "image"      TEXT,
  "attributes" JSONB         NOT NULL,
  "isActive"   BOOLEAN       NOT NULL DEFAULT TRUE,
  "createdAt"  TIMESTAMP     NOT NULL DEFAULT NOW(),
  "updatedAt"  TIMESTAMP     NOT NULL DEFAULT NOW(),
  CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "product_variants_sku_key" UNIQUE ("sku"),
  CONSTRAINT "product_variants_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "product_variants_productId_idx" ON "product_variants"("productId");

CREATE TABLE IF NOT EXISTS "cart_items" (
  "id"        TEXT      NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "userId"    TEXT      NOT NULL,
  "productId" TEXT      NOT NULL,
  "variantId" TEXT,
  "quantity"  INTEGER   NOT NULL DEFAULT 1,
  "addedAt"   TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "cart_items_userId_productId_variantId_key" UNIQUE ("userId", "productId", "variantId"),
  CONSTRAINT "cart_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "cart_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE,
  CONSTRAINT "cart_items_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id")
);
CREATE INDEX IF NOT EXISTS "cart_items_userId_idx" ON "cart_items"("userId");

CREATE TABLE IF NOT EXISTS "wishlist_items" (
  "id"        TEXT      NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "userId"    TEXT      NOT NULL,
  "productId" TEXT      NOT NULL,
  "addedAt"   TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "wishlist_items_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "wishlist_items_userId_productId_key" UNIQUE ("userId", "productId"),
  CONSTRAINT "wishlist_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "wishlist_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "wishlist_items_userId_idx" ON "wishlist_items"("userId");

CREATE TABLE IF NOT EXISTS "orders" (
  "id"               TEXT            NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "orderNumber"      TEXT            NOT NULL,
  "userId"           TEXT            NOT NULL,
  "addressId"        TEXT,
  "status"           "OrderStatus"   NOT NULL DEFAULT 'PENDING',
  "subtotal"         DECIMAL(10,2)   NOT NULL,
  "discount"         DECIMAL(10,2)   NOT NULL DEFAULT 0,
  "shippingCost"     DECIMAL(10,2)   NOT NULL DEFAULT 0,
  "tax"              DECIMAL(10,2)   NOT NULL DEFAULT 0,
  "total"            DECIMAL(10,2)   NOT NULL,
  "couponCode"       TEXT,
  "couponDiscount"   DECIMAL(10,2)   NOT NULL DEFAULT 0,
  "paymentMethod"    "PaymentMethod" NOT NULL,
  "paymentStatus"    "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "notes"            TEXT,
  "trackingNumber"   TEXT,
  "trackingUrl"      TEXT,
  "carrier"          TEXT,
  "estimatedDelivery" TIMESTAMP,
  "deliveredAt"      TIMESTAMP,
  "cancelReason"     TEXT,
  "refundAmount"     DECIMAL(10,2),
  "refundReason"     TEXT,
  "refundedAt"       TIMESTAMP,
  "ipAddress"        TEXT,
  "userAgent"        TEXT,
  "createdAt"        TIMESTAMP       NOT NULL DEFAULT NOW(),
  "updatedAt"        TIMESTAMP       NOT NULL DEFAULT NOW(),
  CONSTRAINT "orders_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "orders_orderNumber_key" UNIQUE ("orderNumber"),
  CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id"),
  CONSTRAINT "orders_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "addresses"("id")
);
CREATE INDEX IF NOT EXISTS "orders_userId_idx" ON "orders"("userId");
CREATE INDEX IF NOT EXISTS "orders_orderNumber_idx" ON "orders"("orderNumber");
CREATE INDEX IF NOT EXISTS "orders_status_idx" ON "orders"("status");
CREATE INDEX IF NOT EXISTS "orders_paymentStatus_idx" ON "orders"("paymentStatus");

CREATE TABLE IF NOT EXISTS "order_items" (
  "id"          TEXT          NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "orderId"     TEXT          NOT NULL,
  "productId"   TEXT          NOT NULL,
  "variantId"   TEXT,
  "productName" TEXT          NOT NULL,
  "sku"         TEXT          NOT NULL,
  "image"       TEXT,
  "attributes"  JSONB,
  "quantity"    INTEGER       NOT NULL,
  "price"       DECIMAL(10,2) NOT NULL,
  "total"       DECIMAL(10,2) NOT NULL,
  CONSTRAINT "order_items_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE,
  CONSTRAINT "order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id"),
  CONSTRAINT "order_items_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id")
);
CREATE INDEX IF NOT EXISTS "order_items_orderId_idx" ON "order_items"("orderId");

CREATE TABLE IF NOT EXISTS "payments" (
  "id"               TEXT            NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "orderId"          TEXT            NOT NULL,
  "userId"           TEXT            NOT NULL,
  "amount"           DECIMAL(10,2)   NOT NULL,
  "currency"         TEXT            NOT NULL DEFAULT 'INR',
  "method"           "PaymentMethod" NOT NULL,
  "status"           "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "gatewayOrderId"   TEXT,
  "gatewayPaymentId" TEXT,
  "gatewaySignature" TEXT,
  "gatewayResponse"  JSONB,
  "failureReason"    TEXT,
  "refundId"         TEXT,
  "refundAmount"     DECIMAL(10,2),
  "refundedAt"       TIMESTAMP,
  "paidAt"           TIMESTAMP,
  "metadata"         JSONB,
  "createdAt"        TIMESTAMP       NOT NULL DEFAULT NOW(),
  "updatedAt"        TIMESTAMP       NOT NULL DEFAULT NOW(),
  CONSTRAINT "payments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "payments_orderId_key" UNIQUE ("orderId"),
  CONSTRAINT "payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE,
  CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id")
);
CREATE INDEX IF NOT EXISTS "payments_userId_idx" ON "payments"("userId");
CREATE INDEX IF NOT EXISTS "payments_gatewayPaymentId_idx" ON "payments"("gatewayPaymentId");

CREATE TABLE IF NOT EXISTS "wallets" (
  "id"           TEXT          NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "userId"       TEXT          NOT NULL,
  "balance"      DECIMAL(10,2) NOT NULL DEFAULT 0,
  "totalCredits" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "totalDebits"  DECIMAL(10,2) NOT NULL DEFAULT 0,
  "createdAt"    TIMESTAMP     NOT NULL DEFAULT NOW(),
  "updatedAt"    TIMESTAMP     NOT NULL DEFAULT NOW(),
  CONSTRAINT "wallets_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "wallets_userId_key" UNIQUE ("userId"),
  CONSTRAINT "wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "wallet_transactions" (
  "id"          TEXT                      NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "walletId"    TEXT                      NOT NULL,
  "type"        "WalletTransactionType"   NOT NULL,
  "source"      "WalletTransactionSource" NOT NULL,
  "amount"      DECIMAL(10,2)             NOT NULL,
  "balance"     DECIMAL(10,2)             NOT NULL,
  "description" TEXT                      NOT NULL,
  "referenceId" TEXT,
  "metadata"    JSONB,
  "createdAt"   TIMESTAMP                 NOT NULL DEFAULT NOW(),
  CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "wallet_transactions_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "wallet_transactions_walletId_idx" ON "wallet_transactions"("walletId");

CREATE TABLE IF NOT EXISTS "withdrawals" (
  "id"             TEXT               NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "userId"         TEXT               NOT NULL,
  "amount"         DECIMAL(10,2)      NOT NULL,
  "status"         "WithdrawalStatus" NOT NULL DEFAULT 'PENDING',
  "method"         TEXT               NOT NULL,
  "accountDetails" JSONB              NOT NULL,
  "notes"          TEXT,
  "adminNotes"     TEXT,
  "processedBy"    TEXT,
  "processedAt"    TIMESTAMP,
  "transactionRef" TEXT,
  "createdAt"      TIMESTAMP          NOT NULL DEFAULT NOW(),
  "updatedAt"      TIMESTAMP          NOT NULL DEFAULT NOW(),
  CONSTRAINT "withdrawals_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "withdrawals_userId_idx" ON "withdrawals"("userId");
CREATE INDEX IF NOT EXISTS "withdrawals_status_idx" ON "withdrawals"("status");

CREATE TABLE IF NOT EXISTS "coupons" (
  "id"                   TEXT          NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "code"                 TEXT          NOT NULL,
  "name"                 TEXT          NOT NULL,
  "description"          TEXT,
  "type"                 "CouponType"  NOT NULL,
  "value"                DECIMAL(10,2) NOT NULL,
  "minOrderAmount"       DECIMAL(10,2),
  "maxDiscount"          DECIMAL(10,2),
  "usageLimit"           INTEGER,
  "usedCount"            INTEGER       NOT NULL DEFAULT 0,
  "perUserLimit"         INTEGER       NOT NULL DEFAULT 1,
  "isActive"             BOOLEAN       NOT NULL DEFAULT TRUE,
  "startDate"            TIMESTAMP,
  "endDate"              TIMESTAMP,
  "applicableCategories" TEXT[]        NOT NULL DEFAULT '{}',
  "applicableProducts"   TEXT[]        NOT NULL DEFAULT '{}',
  "createdAt"            TIMESTAMP     NOT NULL DEFAULT NOW(),
  "updatedAt"            TIMESTAMP     NOT NULL DEFAULT NOW(),
  CONSTRAINT "coupons_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "coupons_code_key" UNIQUE ("code")
);
CREATE INDEX IF NOT EXISTS "coupons_code_idx" ON "coupons"("code");

CREATE TABLE IF NOT EXISTS "reviews" (
  "id"           TEXT           NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "productId"    TEXT           NOT NULL,
  "userId"       TEXT           NOT NULL,
  "orderId"      TEXT,
  "rating"       INTEGER        NOT NULL,
  "title"        TEXT,
  "content"      TEXT,
  "images"       TEXT[]         NOT NULL DEFAULT '{}',
  "status"       "ReviewStatus" NOT NULL DEFAULT 'PENDING',
  "isVerified"   BOOLEAN        NOT NULL DEFAULT FALSE,
  "helpfulCount" INTEGER        NOT NULL DEFAULT 0,
  "createdAt"    TIMESTAMP      NOT NULL DEFAULT NOW(),
  "updatedAt"    TIMESTAMP      NOT NULL DEFAULT NOW(),
  CONSTRAINT "reviews_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "reviews_productId_userId_orderId_key" UNIQUE ("productId", "userId", "orderId"),
  CONSTRAINT "reviews_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE,
  CONSTRAINT "reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id")
);
CREATE INDEX IF NOT EXISTS "reviews_productId_idx" ON "reviews"("productId");
CREATE INDEX IF NOT EXISTS "reviews_userId_idx" ON "reviews"("userId");

CREATE TABLE IF NOT EXISTS "notifications" (
  "id"        TEXT               NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "type"      "NotificationType" NOT NULL,
  "title"     TEXT               NOT NULL,
  "message"   TEXT               NOT NULL,
  "userId"    TEXT,
  "orderId"   TEXT,
  "productId" TEXT,
  "isRead"    BOOLEAN            NOT NULL DEFAULT FALSE,
  "data"      JSONB,
  "createdAt" TIMESTAMP          NOT NULL DEFAULT NOW(),
  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "notifications_isRead_idx" ON "notifications"("isRead");
CREATE INDEX IF NOT EXISTS "notifications_type_idx" ON "notifications"("type");

CREATE TABLE IF NOT EXISTS "user_notifications" (
  "id"        TEXT      NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "userId"    TEXT      NOT NULL,
  "title"     TEXT      NOT NULL,
  "message"   TEXT      NOT NULL,
  "type"      TEXT      NOT NULL,
  "isRead"    BOOLEAN   NOT NULL DEFAULT FALSE,
  "link"      TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "user_notifications_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "user_notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "user_notifications_userId_idx" ON "user_notifications"("userId");
CREATE INDEX IF NOT EXISTS "user_notifications_isRead_idx" ON "user_notifications"("isRead");

CREATE TABLE IF NOT EXISTS "banners" (
  "id"          TEXT      NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "title"       TEXT      NOT NULL,
  "subtitle"    TEXT,
  "image"       TEXT      NOT NULL,
  "mobileImage" TEXT,
  "link"        TEXT,
  "buttonText"  TEXT,
  "position"    TEXT      NOT NULL DEFAULT 'HOME_HERO',
  "sortOrder"   INTEGER   NOT NULL DEFAULT 0,
  "isActive"    BOOLEAN   NOT NULL DEFAULT TRUE,
  "startDate"   TIMESTAMP,
  "endDate"     TIMESTAMP,
  "createdAt"   TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "banners_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "recently_viewed" (
  "id"        TEXT      NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "userId"    TEXT      NOT NULL,
  "productId" TEXT      NOT NULL,
  "viewedAt"  TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "recently_viewed_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "recently_viewed_userId_productId_key" UNIQUE ("userId", "productId"),
  CONSTRAINT "recently_viewed_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "recently_viewed_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "recently_viewed_userId_idx" ON "recently_viewed"("userId");

CREATE TABLE IF NOT EXISTS "shipping_zones" (
  "id"        TEXT      NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "name"      TEXT      NOT NULL,
  "countries" TEXT[]    NOT NULL DEFAULT '{}',
  "states"    TEXT[]    NOT NULL DEFAULT '{}',
  "isActive"  BOOLEAN   NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "shipping_zones_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "shipping_rates" (
  "id"            TEXT          NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "zoneId"        TEXT          NOT NULL,
  "name"          TEXT          NOT NULL,
  "description"   TEXT,
  "minWeight"     DECIMAL(8,2),
  "maxWeight"     DECIMAL(8,2),
  "minOrderValue" DECIMAL(10,2),
  "rate"          DECIMAL(10,2) NOT NULL,
  "estimatedDays" TEXT,
  "isActive"      BOOLEAN       NOT NULL DEFAULT TRUE,
  "createdAt"     TIMESTAMP     NOT NULL DEFAULT NOW(),
  CONSTRAINT "shipping_rates_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "shipping_rates_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "shipping_zones"("id")
);

CREATE TABLE IF NOT EXISTS "admin_logs" (
  "id"        TEXT      NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "adminId"   TEXT      NOT NULL,
  "action"    TEXT      NOT NULL,
  "entity"    TEXT      NOT NULL,
  "entityId"  TEXT,
  "changes"   JSONB,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "admin_logs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "admin_logs_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id")
);
CREATE INDEX IF NOT EXISTS "admin_logs_adminId_idx" ON "admin_logs"("adminId");
CREATE INDEX IF NOT EXISTS "admin_logs_entity_idx" ON "admin_logs"("entity");

CREATE TABLE IF NOT EXISTS "site_settings" (
  "id"        TEXT      NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "key"       TEXT      NOT NULL,
  "value"     TEXT      NOT NULL,
  "type"      TEXT      NOT NULL DEFAULT 'string',
  "group"     TEXT      NOT NULL DEFAULT 'general',
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "site_settings_key_key" UNIQUE ("key")
);
CREATE INDEX IF NOT EXISTS "site_settings_key_idx" ON "site_settings"("key");
CREATE INDEX IF NOT EXISTS "site_settings_group_idx" ON "site_settings"("group");

CREATE TABLE IF NOT EXISTS "contact_forms" (
  "id"        TEXT      NOT NULL DEFAULT gen_random_uuid()::TEXT,
  "name"      TEXT      NOT NULL,
  "email"     TEXT      NOT NULL,
  "phone"     TEXT,
  "subject"   TEXT      NOT NULL,
  "message"   TEXT      NOT NULL,
  "isRead"    BOOLEAN   NOT NULL DEFAULT FALSE,
  "repliedAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "contact_forms_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "contact_forms_isRead_idx" ON "contact_forms"("isRead");

-- ============================================================
--  SEED DATA
-- ============================================================

-- Admin user (password: Admin@123)
-- Hash generated with bcrypt 12 rounds
INSERT INTO "users" ("id", "email", "name", "password", "role", "status", "emailVerified", "createdAt", "updatedAt")
VALUES (
  'admin-user-shopease-001',
  'admin@shopease.com',
  'Admin User',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uAom',
  'ADMIN',
  'ACTIVE',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT ("email") DO NOTHING;

-- Admin wallet
INSERT INTO "wallets" ("userId", "balance", "createdAt", "updatedAt")
VALUES ('admin-user-shopease-001', 0, NOW(), NOW())
ON CONFLICT ("userId") DO NOTHING;

-- Categories
INSERT INTO "categories" ("id", "name", "slug", "description", "icon", "sortOrder", "isActive", "createdAt", "updatedAt") VALUES
  ('cat-electronics',    'Electronics',     'electronics',    'Gadgets, devices, and more',          '💻', 1, TRUE, NOW(), NOW()),
  ('cat-fashion',        'Fashion',         'fashion',        'Clothing, accessories, and footwear', '👗', 2, TRUE, NOW(), NOW()),
  ('cat-home-kitchen',   'Home & Kitchen',  'home-kitchen',   'Everything for your home',            '🏠', 3, TRUE, NOW(), NOW()),
  ('cat-books',          'Books',           'books',          'Books, stationery, and more',         '📚', 4, TRUE, NOW(), NOW()),
  ('cat-sports-fitness', 'Sports & Fitness','sports-fitness', 'Equipment and accessories',           '⚽', 5, TRUE, NOW(), NOW()),
  ('cat-beauty-health',  'Beauty & Health', 'beauty-health',  'Beauty products and healthcare',      '💄', 6, TRUE, NOW(), NOW())
ON CONFLICT ("slug") DO NOTHING;

-- Products
INSERT INTO "products" (
  "id", "name", "slug", "description", "shortDesc", "sku",
  "price", "comparePrice", "stock", "status", "featured", "isBestSeller", "isNew",
  "categoryId", "brand", "tags", "images", "thumbnail",
  "taxRate", "lowStockAlert", "freeShipping", "shippingCost", "createdAt", "updatedAt"
) VALUES
(
  'prod-headphones-001',
  'Wireless Bluetooth Headphones',
  'wireless-bluetooth-headphones',
  'Premium wireless headphones with active noise cancellation and 30-hour battery life. Featuring crystal-clear sound, deep bass, and a comfortable over-ear design perfect for work and travel.',
  'ANC wireless headphones with 30hr battery',
  'ELEC-001',
  2999, 4999, 50, 'ACTIVE', TRUE, TRUE, FALSE,
  'cat-electronics', 'TechPro',
  ARRAY['wireless','bluetooth','headphones','audio'],
  ARRAY['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'],
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
  18, 5, FALSE, 0, NOW(), NOW()
),
(
  'prod-smartwatch-001',
  'Smart Watch Premium Series',
  'smart-watch-premium',
  'Feature-packed smart watch with health monitoring, GPS, and 7-day battery. Track your fitness goals with precision.',
  'Health tracking smart watch with GPS',
  'ELEC-002',
  5499, 8999, 30, 'ACTIVE', TRUE, FALSE, TRUE,
  'cat-electronics', 'TechPro',
  ARRAY['smartwatch','fitness','wearable'],
  ARRAY['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'],
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
  18, 5, FALSE, 0, NOW(), NOW()
),
(
  'prod-tshirt-001',
  'Premium Cotton T-Shirt',
  'premium-cotton-tshirt',
  '100% premium cotton t-shirt with comfortable fit for everyday wear. Soft, breathable, and durable.',
  'Soft premium cotton everyday tee',
  'FASH-001',
  499, 799, 100, 'ACTIVE', FALSE, TRUE, FALSE,
  'cat-fashion', 'StyleCo',
  ARRAY['tshirt','cotton','casual','fashion'],
  ARRAY['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500'],
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
  5, 5, FALSE, 0, NOW(), NOW()
),
(
  'prod-cookware-001',
  'Non-Stick Cookware Set',
  'non-stick-cookware-set',
  '5-piece premium non-stick cookware set suitable for all cooktops including induction. PFOA-free coating ensures healthy cooking.',
  '5-piece induction-compatible cookware set',
  'HOME-001',
  1899, 2999, 25, 'ACTIVE', TRUE, FALSE, FALSE,
  'cat-home-kitchen', 'KitchenPro',
  ARRAY['cookware','kitchen','non-stick','induction'],
  ARRAY['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500'],
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500',
  12, 5, FALSE, 0, NOW(), NOW()
),
(
  'prod-yogamat-001',
  'Yoga Mat Premium',
  'yoga-mat-premium',
  'Extra thick 6mm non-slip yoga mat with alignment lines and carrying strap. Perfect for yoga, pilates, and home workouts.',
  '6mm non-slip yoga mat with carry strap',
  'SPORT-001',
  799, 1299, 60, 'ACTIVE', FALSE, FALSE, TRUE,
  'cat-sports-fitness', 'FitLife',
  ARRAY['yoga','fitness','exercise','mat'],
  ARRAY['https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500'],
  'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500',
  5, 5, FALSE, 0, NOW(), NOW()
),
(
  'prod-laptop-001',
  'Laptop Backpack 15.6"',
  'laptop-backpack-156',
  'Water-resistant laptop backpack with USB charging port. Fits up to 15.6" laptops. Multiple compartments for organized storage.',
  'Water-resistant laptop bag with USB charging',
  'ELEC-003',
  1299, 1999, 45, 'ACTIVE', FALSE, TRUE, FALSE,
  'cat-electronics', 'TechPro',
  ARRAY['laptop','backpack','bag','tech'],
  ARRAY['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500'],
  'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500',
  18, 5, FALSE, 0, NOW(), NOW()
),
(
  'prod-jeans-001',
  'Slim Fit Denim Jeans',
  'slim-fit-denim-jeans',
  'Classic slim fit denim jeans made from premium stretch fabric. Comfortable for all-day wear with 5-pocket design.',
  'Stretch slim-fit jeans for all-day comfort',
  'FASH-002',
  899, 1499, 75, 'ACTIVE', FALSE, TRUE, FALSE,
  'cat-fashion', 'StyleCo',
  ARRAY['jeans','denim','fashion','slim'],
  ARRAY['https://images.unsplash.com/photo-1542272604-787c3835535d?w=500'],
  'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500',
  5, 5, FALSE, 0, NOW(), NOW()
),
(
  'prod-skincare-001',
  'Vitamin C Face Serum',
  'vitamin-c-face-serum',
  'Advanced Vitamin C face serum with hyaluronic acid. Brightens skin, reduces dark spots, and improves texture in 4 weeks.',
  'Brightening Vit-C serum with hyaluronic acid',
  'BEAU-001',
  699, 1199, 80, 'ACTIVE', TRUE, FALSE, TRUE,
  'cat-beauty-health', 'GlowLab',
  ARRAY['skincare','serum','vitaminc','beauty'],
  ARRAY['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500'],
  'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500',
  12, 5, FALSE, 0, NOW(), NOW()
)
ON CONFLICT ("slug") DO NOTHING;

-- Coupons
INSERT INTO "coupons" ("code", "name", "type", "value", "minOrderAmount", "maxDiscount", "perUserLimit", "isActive", "createdAt", "updatedAt") VALUES
  ('WELCOME10', 'Welcome 10% Off',  'PERCENTAGE',  10,  500, 200, 1, TRUE, NOW(), NOW()),
  ('FLAT100',   'Flat ₹100 Off',    'FIXED_AMOUNT', 100, 999, NULL, 2, TRUE, NOW(), NOW()),
  ('FREESHIP',  'Free Shipping',    'FREE_SHIPPING', 0,  NULL, NULL, 3, TRUE, NOW(), NOW())
ON CONFLICT ("code") DO NOTHING;

-- Site Settings
INSERT INTO "site_settings" ("key", "value", "type", "group", "updatedAt") VALUES
  ('site_name',               'ShopEase',           'string',  'general',  NOW()),
  ('site_tagline',            'Your One-Stop Shop',  'string',  'general',  NOW()),
  ('site_email',              'support@shopease.com','string',  'general',  NOW()),
  ('site_phone',              '+91 98765 43210',     'string',  'general',  NOW()),
  ('site_currency',           'INR',                 'string',  'general',  NOW()),
  ('free_shipping_threshold', '999',                 'number',  'shipping', NOW()),
  ('default_shipping_cost',   '49',                  'number',  'shipping', NOW()),
  ('min_order_amount',        '0',                   'number',  'orders',   NOW()),
  ('cod_available',           'true',                'boolean', 'orders',   NOW()),
  ('min_withdrawal_amount',   '100',                 'number',  'wallet',   NOW())
ON CONFLICT ("key") DO NOTHING;

-- Banner
INSERT INTO "banners" ("id", "title", "subtitle", "image", "link", "buttonText", "position", "sortOrder", "isActive", "createdAt", "updatedAt")
VALUES (
  'banner-hero-1',
  'New Arrivals',
  'Discover our latest collection',
  'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200',
  '/shop?filter=new',
  'Shop Now',
  'HOME_HERO',
  0,
  TRUE,
  NOW(),
  NOW()
) ON CONFLICT ("id") DO NOTHING;

-- ============================================================
--  DONE!
-- ============================================================
-- Admin login: admin@shopease.com  |  Password: Admin@123
-- Coupons:     WELCOME10  |  FLAT100  |  FREESHIP
-- ============================================================
