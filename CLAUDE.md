# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Server Operations
- `npm start` - Start the Express.js development server on port 5000
- `node server.js` - Alternative way to start the server

### Database Setup
- Execute `database-schema.sql` in Supabase SQL Editor to create all tables
- Execute `admin-database-schema.sql` for admin-specific tables
- Execute `profiles-table-schema.sql` for user profile tables

### Environment Variables Required
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SLACK_WEBHOOK_URL=your_slack_webhook_url
```

## Architecture Overview

### Technology Stack
- **Frontend**: Static HTML/CSS/JavaScript with Bootstrap 5
- **Backend**: Express.js server for development with webhook endpoints
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Payment**: Payapp integration with webhook automation
- **Authentication**: Supabase Auth with email/password and Kakao OAuth
- **Hosting**: Designed for static hosting (Cloudflare Pages)

### Key Components

#### Authentication System
- Authentication handled by `js/auth-clean.js` and `js/supabase-client.js`
- Session management across pages with `js/auth-prod.js`
- User profiles stored in `profiles` table with RLS policies
- Login redirects to `index.html`, not `mypage.html`

#### Payment Flow
- Payapp integration via `js/payapp-integration.js`
- Payment URLs stored in `products.payapp_url` column
- Webhook endpoint `/api/webhook/payapp` handles automatic order processing
- Immediate content access granted upon successful payment

#### Content Management
- Admin panel at `admin.html` uses Handsontable for product management
- Content viewers: `video-viewer.html` and `ebook-viewer.html`
- Content access controlled via `purchased_content` table

#### PWA Features
- Service worker in `sw.js` for offline functionality
- Mobile-first design with `css/mobile.css`
- PWA manifest in `manifest.json`

### Database Schema
- `profiles` - User profiles linked to Supabase Auth
- `products` - Product catalog with Payapp URLs
- `orders` - Payment transactions and status
- `purchased_content` - Content access control
- `reviews` - Product reviews system

### File Structure
- `/js/` - All JavaScript modules (auth, payment, content access)
- `/css/` - Styling (main: `style.css`, mobile: `mobile.css`)
- `/data/` - Static data files
- `/server/` - Server-side utilities
- SQL files in root for database setup

### Development Notes
- Server includes cache-busting for HTML files during development
- Mobile utilities in `js/mobile-utils.js` for PWA features
- All pages include no-cache headers for development
- Korean language throughout user interface
- Test accounts system for development environment

### Important Implementation Details
- No build process required - pure static files
- Supabase client initialization must complete before auth operations
- Payment processing is fully automated via webhooks
- Admin features require elevated permissions in profiles table
- Content access is immediate upon successful payment verification