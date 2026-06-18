# ShopEase — Deployment Guide

## Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL 14+ database
- Redis (optional, for rate limiting/caching)
- SMTP email provider (Gmail, SendGrid, etc.)
- Stripe account
- Razorpay account
- AWS S3 bucket (for image uploads)

---

## 1. Local Development Setup

### Clone and install dependencies

```bash
git clone <your-repo-url>
cd shopease
npm install
```

### Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in all values (see Environment Variables section below).

### Set up the database

```bash
# Push schema to database
npm run db:push

# Or run migrations (for production)
npx prisma migrate dev --name init

# Seed with sample data
npm run db:seed
```

### Start development server

```bash
npm run dev
```

Visit `http://localhost:3000`

**Admin Panel:** `http://localhost:3000/admin`
**Default Admin:** `admin@shopease.com` / `Admin@123`

---

## 2. Environment Variables

Create a `.env` file with these values:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/shopease_db?schema=public"

# JWT Auth
JWT_SECRET="min-32-character-random-secret-key"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_EXPIRES_IN="30d"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="ShopEase"
NODE_ENV="development"

# Email (Gmail example)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-specific-password"
EMAIL_FROM="ShopEase <noreply@shopease.com>"
ADMIN_EMAIL="admin@shopease.com"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Razorpay
RAZORPAY_KEY_ID="rzp_test_..."
RAZORPAY_KEY_SECRET="..."
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_..."

# AWS S3 (for image uploads)
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="ap-south-1"
AWS_S3_BUCKET="shopease-images"
AWS_CLOUDFRONT_URL="https://your-cloudfront-id.cloudfront.net"

# Admin setup
ADMIN_SETUP_KEY="one-time-setup-key"

# Optional: Telegram notifications
TELEGRAM_BOT_TOKEN=""
TELEGRAM_ADMIN_CHAT_ID=""
```

---

## 3. Production Deployment on VPS (Ubuntu)

### Server setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 process manager
sudo npm install -g pm2

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Create database
sudo -u postgres psql
CREATE DATABASE shopease_db;
CREATE USER shopease_user WITH ENCRYPTED PASSWORD 'strong_password';
GRANT ALL PRIVILEGES ON DATABASE shopease_db TO shopease_user;
\q
```

### Application setup

```bash
# Clone repo
git clone <your-repo-url> /var/www/shopease
cd /var/www/shopease

# Install dependencies
npm install --production

# Build Next.js
npm run build

# Set up environment
cp .env.example .env
nano .env  # Fill in production values

# Run database migrations
npm run db:migrate

# Seed database (first time only)
npm run db:seed
```

### Start with PM2

```bash
# Start application
pm2 start server.js --name shopease

# Save PM2 configuration
pm2 save
pm2 startup

# Monitor
pm2 status
pm2 logs shopease
```

### Nginx reverse proxy

```bash
sudo apt install -y nginx

sudo nano /etc/nginx/sites-available/shopease
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/shopease /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### SSL with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
sudo systemctl restart nginx
```

---

## 4. Deployment on Vercel (Recommended)

> Note: Vercel doesn't support Socket.io in serverless mode. Use `server.js` only for VPS/Docker. For Vercel, use polling-based notifications or remove Socket.io.

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# or via CLI:
vercel env add DATABASE_URL
vercel env add JWT_SECRET
# ... add all other env vars
```

**Database:** Use [Neon](https://neon.tech) or [Supabase](https://supabase.com) for serverless PostgreSQL.

---

## 5. Deployment on Railway

Railway supports custom servers with Socket.io.

1. Create account at [railway.app](https://railway.app)
2. Create new project → Deploy from GitHub
3. Add PostgreSQL via Railway's plugin
4. Set environment variables in Railway dashboard
5. Railway will auto-detect `package.json` and run `npm start`

---

## 6. Deployment on Netlify

Netlify natively supports Next.js applications through its Edge and Serverless functions.

> **Note on WebSockets:** Like Vercel, Netlify's serverless environment **does not support persistent WebSocket connections** (Socket.io). For Netlify deployments, use HTTP polling instead of Socket.io for notifications, or remove Socket.io entirely.

### Deployment Steps:

1. **Database setup**: Netlify does not host SQL databases. You must use a cloud database provider like [Neon](https://neon.tech), [Supabase](https://supabase.com), or [Render](https://render.com).
2. Push your code to a GitHub repository.
3. Log in to [Netlify](https://app.netlify.com).
4. Click **Add new site** → **Import an existing project** → **GitHub**.
5. Select your frontend repository.
6. **Build Settings**:
   - **Framework:** Next.js
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
7. Click **Show advanced** and click **New variable** to add all your environment variables from `.env` (like `DATABASE_URL`, `JWT_SECRET`, Stripe/Razorpay keys, etc.).
8. Click **Deploy site**. Netlify will automatically build and configure your Next.js application.

---

## 6. Deployment with GitHub Student Developer Pack

If you have the **GitHub Student Developer Pack**, you can deploy this application for free or at a massive discount using the included benefits.

### Step 1: Claim a Free Domain
1. Go to the [GitHub Student Developer Pack](https://education.github.com/pack).
2. Claim a free domain from **Namecheap** (1 year of .me domain), **Name.com**, or **.TECH** domains.
3. Keep the DNS dashboard open for the next steps.

### Step 2: Choose a Hosting Provider

**Option A: DigitalOcean (Recommended for VPS setup)**
1. Claim the **$200 DigitalOcean credit** from the student pack.
2. Create a basic Droplet (Ubuntu 22.04) or use the **DigitalOcean App Platform**.
3. If using App Platform, connect your GitHub repository and follow the environment variables setup directly in the UI. 
4. If using a Droplet, follow the VPS setup guide in **Section 3** above.

**Option B: Microsoft Azure**
1. Claim the **$100 Azure credit** for students.
2. Deploy using Azure App Service (Web Apps for Containers or Node.js runtime).
3. Alternatively, create an Ubuntu Virtual Machine and follow **Section 3**.

### Step 3: Link Your Custom Domain
1. In your domain provider's DNS settings (Namecheap, Name.com, etc.), add an `A Record`.
   - **Host:** `@`
   - **Value:** Your VPS IP Address or App Platform IP.
2. Add a `CNAME Record` for `www`.
   - **Host:** `www`
   - **Value:** `yourdomain.com`
3. Back in DigitalOcean/Azure, add the custom domain to your app settings to generate the SSL certificates automatically, or follow the Let's Encrypt guide in **Section 3**.

---

## 7. Stripe Webhook Setup

### Local development (using Stripe CLI)

```bash
# Install Stripe CLI
stripe listen --forward-to localhost:3000/api/payments/webhook/stripe

# Copy the webhook secret shown and add to .env as STRIPE_WEBHOOK_SECRET
```

### Production

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/payments/webhook/stripe`
3. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copy signing secret to `STRIPE_WEBHOOK_SECRET`

---

## 7. Razorpay Setup

1. Create account at [razorpay.com](https://razorpay.com)
2. Get API keys from Dashboard → Settings → API Keys
3. For webhooks, go to Settings → Webhooks
4. Add webhook URL: `https://yourdomain.com/api/payments/verify`

---

## 8. AWS S3 Setup (Image Uploads)

```bash
# Create S3 bucket
# Set bucket policy for public read access (for product images)
# Create IAM user with S3 permissions
# Add credentials to .env
```

**Bucket CORS configuration:**
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["https://yourdomain.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```

---

## 9. Email Setup (Gmail)

1. Enable 2-Factor Authentication on your Gmail account
2. Go to Google Account → Security → App Passwords
3. Generate an app-specific password
4. Use this password (not your regular password) in `SMTP_PASS`

---

## 10. Admin Panel First Login

1. Navigate to `https://yourdomain.com/admin`
2. Login with:
   - Email: `admin@shopease.com`
   - Password: `Admin@123`
3. **Change the default password immediately** from the profile settings
4. Add your products, categories, and configure site settings

---

## 11. Performance Checklist

- [ ] Enable PostgreSQL connection pooling (use PgBouncer or Prisma Data Proxy)
- [ ] Configure Redis for session caching and rate limiting
- [ ] Set up CDN (CloudFront/Cloudflare) for static assets
- [ ] Enable gzip compression in Nginx
- [ ] Configure proper database indexes (already included in schema)
- [ ] Set up monitoring (Sentry, New Relic, or Datadog)
- [ ] Configure automated database backups
- [ ] Set up uptime monitoring (UptimeRobot or Better Uptime)

---

## 12. Security Checklist

- [ ] Change all default passwords
- [ ] Use strong, unique JWT secret (32+ characters)
- [ ] Enable HTTPS everywhere
- [ ] Set `ADMIN_SETUP_KEY` for one-time admin creation
- [ ] Review and restrict CORS settings
- [ ] Enable rate limiting (configured in server.js)
- [ ] Keep Node.js and dependencies updated
- [ ] Set up firewall (UFW) to block unnecessary ports
- [ ] Use environment variables for all secrets, never hard-code

---

## 13. Database Backup

```bash
# Create backup
pg_dump -U shopease_user -h localhost shopease_db > backup_$(date +%Y%m%d).sql

# Restore backup
psql -U shopease_user -h localhost shopease_db < backup_20240101.sql

# Automated daily backup (crontab)
0 2 * * * pg_dump -U shopease_user shopease_db | gzip > /backups/shopease_$(date +\%Y\%m\%d).sql.gz
```

---

## 14. Updating the Application

```bash
# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Run any new migrations
npm run db:migrate

# Rebuild
npm run build

# Restart
pm2 restart shopease
```

---

## Support

For issues, check:
- PM2 logs: `pm2 logs shopease`
- Nginx logs: `/var/log/nginx/error.log`
- Application logs for errors

Database connection issues: Verify `DATABASE_URL` format and PostgreSQL service is running.
