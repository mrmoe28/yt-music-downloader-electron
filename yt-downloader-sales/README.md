# YouTube Music Downloader Pro - Sales Website

Professional sales website with Stripe integration for selling your YouTube Music Downloader Pro DMG file.

## Features

- **Secure Payment Processing**: Stripe Checkout with webhooks
- **Email Authentication**: Passwordless login with magic links
- **Customer Dashboard**: Purchase history and download access
- **Secure Downloads**: Time-limited, signed download URLs
- **Email Notifications**: Automatic purchase confirmations
- **Download Limits**: Configurable download attempts per purchase
- **Database**: SQLite with Prisma ORM

## Setup Instructions

### 1. Environment Configuration

Copy `.env.local` and update with your credentials:

```bash
# Database
DATABASE_URL="file:./dev.db"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"  # Update for production
NEXTAUTH_SECRET="your-nextauth-secret-here"

# Stripe Configuration
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key_here"
STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key_here"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret_here"

# Email Configuration (Gmail example)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password-here"

# File Storage
DOWNLOAD_FILES_PATH="./files"
DOWNLOAD_TOKEN_SECRET="your-download-token-secret-here"
```

### 2. Stripe Setup

1. **Create Stripe Account**: Go to [stripe.com](https://stripe.com)
2. **Get API Keys**: Dashboard → Developers → API keys
3. **Set up Webhook**:
   - Dashboard → Developers → Webhooks
   - Add endpoint: `https://yourdomain.com/api/stripe/webhook`
   - Select events: `checkout.session.completed`
   - Copy webhook secret to environment

### 3. Email Setup (Gmail)

1. **Enable 2FA**: On your Google account
2. **Generate App Password**:
   - Google Account Settings → Security → App passwords
   - Select "Mail" and generate password
3. **Update Environment**: Use app password for `SMTP_PASS`

### 4. Install Dependencies & Setup Database

```bash
npm install
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Add Your DMG File

Copy your DMG file to the `files/` directory with this naming convention:
```
files/YouTube Music Downloader Pro-1.0.0.dmg
```

The filename should match: `{productName}-{productVersion}.dmg`

### 6. Development

```bash
npm run dev
```

Visit `http://localhost:3000` to see your sales page.

### 7. Production Deployment

#### Option A: Vercel (Recommended)

1. **Deploy to Vercel**:
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Set Environment Variables**:
   - Vercel Dashboard → Project → Settings → Environment Variables
   - Add all variables from `.env.local`
   - Update `NEXTAUTH_URL` to your production domain

3. **Upload DMG File**:
   - Since Vercel has file size limits, consider using:
     - AWS S3 + CloudFront
     - DigitalOcean Spaces
     - Or any file hosting service
   - Update the download API to fetch from your file storage

#### Option B: VPS/Dedicated Server

1. **Deploy your app**
2. **Set up reverse proxy** (nginx/Apache)
3. **Configure SSL certificates**
4. **Set up process manager** (PM2)

### 8. Webhook Testing

For local development, use ngrok:

```bash
# Install ngrok
npm install -g ngrok

# In another terminal
ngrok http 3000

# Use the https URL for Stripe webhook endpoint
# Example: https://abc123.ngrok.io/api/stripe/webhook
```

## File Structure

```
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/     # NextAuth endpoints
│   │   │   ├── stripe/
│   │   │   │   ├── create-checkout/   # Create Stripe session
│   │   │   │   └── webhook/           # Handle payments
│   │   │   ├── downloads/[token]/     # Secure file downloads
│   │   │   ├── purchases/             # User purchase history
│   │   │   └── generate-download-token/ # Download token creation
│   │   ├── dashboard/                 # Customer portal
│   │   ├── auth/signin/              # Email authentication
│   │   └── page.tsx                  # Landing page
│   ├── components/
│   │   ├── ui/                       # Reusable UI components
│   │   └── auth/                     # Authentication components
│   └── lib/
│       ├── prisma.ts                 # Database client
│       ├── stripe.ts                 # Stripe configuration
│       ├── auth.ts                   # NextAuth configuration
│       ├── downloads.ts              # Download token logic
│       └── email.ts                  # Email notifications
├── prisma/
│   └── schema.prisma                 # Database schema
└── files/                           # DMG storage directory
```

## Security Features

- **JWT Download Tokens**: Time-limited with payload verification
- **Purchase Verification**: Users can only download their purchases
- **Download Limits**: Configurable max downloads per purchase
- **IP & User Agent Logging**: Track download attempts
- **Email Verification**: Users must verify email before purchase
- **Webhook Signature Verification**: Stripe webhook security

## Customization

### Product Configuration

Update the product details in:
- `src/components/landing.tsx` (pricing, features, description)
- `src/components/dashboard.tsx` (product name, version, price)

### Email Templates

Customize email templates in:
- `src/lib/email.ts` (purchase confirmation emails)

### Download Limits

Modify in database schema (`prisma/schema.prisma`):
```prisma
model Purchase {
  maxDownloads Int @default(5)  // Change default limit
}
```

### File Storage

For production, update `src/app/api/downloads/[token]/route.ts` to:
- Fetch from cloud storage (S3, etc.)
- Add content delivery network (CDN)
- Implement file caching

## Troubleshooting

### Common Issues

1. **Stripe Webhook Not Working**:
   - Check webhook endpoint URL
   - Verify webhook secret in environment
   - Check webhook event selection

2. **Email Not Sending**:
   - Verify SMTP credentials
   - Check app password for Gmail
   - Review email service logs

3. **Download Token Invalid**:
   - Check token secret in environment
   - Verify token expiration time
   - Ensure purchase exists and is valid

4. **File Not Found**:
   - Verify DMG file exists in `files/` directory
   - Check filename matches expected format
   - Ensure proper file permissions

### Production Checklist

- [ ] Update `NEXTAUTH_URL` for production domain
- [ ] Use production Stripe keys
- [ ] Set strong `NEXTAUTH_SECRET` and `DOWNLOAD_TOKEN_SECRET`
- [ ] Configure proper email service
- [ ] Set up webhook endpoint with HTTPS
- [ ] Upload DMG file to storage service
- [ ] Test complete purchase flow
- [ ] Set up monitoring and logging

## Support

For issues with the sales website:
1. Check the troubleshooting section
2. Review server logs
3. Test webhook endpoints
4. Verify environment configuration

Your customers will see a professional purchase flow with immediate access to downloads after payment.