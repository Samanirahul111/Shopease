import { z } from "zod";

// Environment validation schema
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, "Database URL is required"),

  // JWT Authentication
  JWT_SECRET: z.string().min(32, "JWT secret must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),

  // NextAuth
  NEXTAUTH_URL: z.string().url("Valid NextAuth URL is required"),
  NEXTAUTH_SECRET: z.string().min(32, "NextAuth secret must be at least 32 characters"),

  // App Configuration
  NEXT_PUBLIC_APP_URL: z.string().url("Valid app URL is required"),
  NEXT_PUBLIC_APP_NAME: z.string().default("ShopEase"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(val => parseInt(val, 10)).pipe(z.number().positive()).default("900000"),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(val => parseInt(val, 10)).pipe(z.number().positive()).default("100"),

  // OTP Configuration
  OTP_EXPIRY_MINUTES: z.string().transform(val => parseInt(val, 10)).pipe(z.number().positive()).default("10"),

  // Admin
  ADMIN_EMAIL: z.string().email("Valid admin email is required").optional(),
  ADMIN_SETUP_KEY: z.string().optional(),

  // Optional but validated when provided
  // Email/SMTP (optional but required for email functionality)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(val => parseInt(val || "587", 10)).pipe(z.number().positive()).optional(),
  SMTP_SECURE: z.string().transform(val => val === "true").pipe(z.boolean()).optional(),
  SMTP_USER: z.string().email().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().optional(),

  // Stripe (optional but required for Stripe payments)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),

  // Razorpay (optional but required for Razorpay payments)
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().optional(),

  // Google OAuth (optional)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // AWS S3 (optional but required for file uploads)
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  AWS_CLOUDFRONT_URL: z.string().url().optional().or(z.literal("")),

  // Redis (optional but recommended for caching)
  REDIS_URL: z.string().url().optional().or(z.literal("")),

  // Telegram (optional)
  TELEGRAM_BOT_TOKEN: z.string().optional().or(z.literal("")),
  TELEGRAM_ADMIN_CHAT_ID: z.string().optional().or(z.literal("")),
});

// Environment validation function
function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error("❌ Environment validation failed:");
    if (error instanceof z.ZodError) {
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join(".")}: ${err.message}`);
      });
    }
    throw new Error("Invalid environment configuration");
  }
}

// Validated environment variables
export const env = validateEnv();

// Feature availability checks
export const features = {
  email: !!(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS),
  stripe: !!(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET),
  razorpay: !!(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET),
  googleOAuth: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
  s3Uploads: !!(env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY && env.AWS_S3_BUCKET),
  redis: !!env.REDIS_URL,
  telegram: !!(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_ADMIN_CHAT_ID),
};

// Helper function to check if a feature is available
export function requireFeature(featureName: keyof typeof features, action: string): void {
  if (!features[featureName]) {
    const missingVars: Record<keyof typeof features, string[]> = {
      email: ["SMTP_HOST", "SMTP_USER", "SMTP_PASS"],
      stripe: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
      razorpay: ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"],
      googleOAuth: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
      s3Uploads: ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_S3_BUCKET"],
      redis: ["REDIS_URL"],
      telegram: ["TELEGRAM_BOT_TOKEN", "TELEGRAM_ADMIN_CHAT_ID"],
    };

    throw new Error(
      `Cannot ${action}: ${featureName} is not configured. Missing environment variables: ${missingVars[featureName].join(", ")}`
    );
  }
}

// Check for placeholder values (common mistake)
function checkPlaceholderValues() {
  const placeholders = [
    "your-super-secret",
    "your-google-client",
    "your-email@",
    "your-app-specific",
    "sk_live_your",
    "whsec_your",
    "pk_live_your",
    "rzp_live_your",
    "your_razorpay",
    "your-aws-",
    "your-cloudfront",
    "your-one-time",
  ];

  const warnings: string[] = [];

  Object.entries(process.env).forEach(([key, value]) => {
    if (value && placeholders.some(placeholder => value.includes(placeholder))) {
      warnings.push(`${key} appears to contain placeholder value`);
    }
  });

  if (warnings.length > 0) {
    console.warn("⚠️  Warning: Placeholder values detected:");
    warnings.forEach(warning => console.warn(`  - ${warning}`));
    console.warn("  Please update your .env file with actual configuration values.");
  }
}

// Development helper - check for common issues
if (env.NODE_ENV === "development") {
  checkPlaceholderValues();

  console.log("🔧 Environment Configuration Status:");
  Object.entries(features).forEach(([feature, enabled]) => {
    console.log(`  ${enabled ? "✅" : "⚠️ "} ${feature}: ${enabled ? "enabled" : "disabled"}`);
  });
}