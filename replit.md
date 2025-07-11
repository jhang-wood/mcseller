# 한국 온라인 교육 플랫폼

## Overview

This is a Korean online education platform that enables users to purchase and access lectures and ebooks. The platform features admin capabilities for content management, user authentication via Supabase, payment processing through TossPay, and customer support via Kakao chat integration.

## System Architecture

### Frontend Architecture
- **Technology Stack**: Static HTML, CSS, JavaScript (ES6+), Bootstrap 5
- **Hosting**: Cloudflare Pages (static hosting)
- **Libraries**: jQuery, Chart.js, Handsontable, Font Awesome
- **Language**: All user-facing content in Korean

### Backend Services
- **Database & Auth**: Supabase (PostgreSQL with Row Level Security)
- **Payment Processing**: TossPay integration
- **File Storage**: Supabase Storage for images and content
- **Customer Support**: Kakao Chatbot widget

### Content Delivery
- **Videos**: YouTube embed integration
- **Ebooks**: Custom reader with responsive design
- **Images**: CDN delivery via Supabase Storage

## Key Components

### 1. Authentication System
- **Provider**: Supabase Auth
- **Methods**: Email/password, Google OAuth, Kakao OAuth
- **Features**: Session management, role-based access control
- **Security**: Row Level Security (RLS) enabled

### 2. Product Management
- **Admin Interface**: Handsontable for spreadsheet-like product management
- **Product Types**: Lectures (YouTube videos) and Ebooks (HTML/PDF)
- **Features**: Price setting, activation/deactivation, image uploads
- **Content Access**: UUID-based protected URLs

### 3. Payment System
- **Provider**: TossPay (Korean payment gateway)
- **Methods**: Credit cards, bank transfers, mobile payments
- **Flow**: Immediate access upon successful payment
- **Security**: Order validation and user verification

### 4. Content Viewers
- **Video Player**: Custom YouTube player with Korean subtitles, progress tracking
- **Ebook Reader**: Responsive reader with font controls, bookmarks, progress tracking
- **Features**: User preferences, reading/viewing progress persistence

### 5. Review System
- **Data Source**: OCR-extracted reviews from uploaded images
- **Features**: 5-star ratings, verified purchase badges, admin moderation
- **Display**: Product-specific reviews with helpful voting

## Data Flow

### User Registration & Authentication
1. User signs up via Supabase Auth
2. User profile created in `users` table
3. Session maintained across pages
4. Role-based access control enforced

### Product Purchase Flow
1. User browses products on main page
2. Clicks product → redirected to product detail page
3. Initiates purchase → TossPay payment widget
4. Payment success → order record created
5. Immediate content access granted
6. User redirected to content viewer

### Content Access Control
1. Check user authentication status
2. Verify purchase record in database
3. Grant/deny access to protected content
4. Track viewing progress and preferences

### Admin Management
1. Admin authentication with elevated permissions
2. Product CRUD operations via Handsontable interface
3. Order and user management dashboard
4. Analytics and reporting with Chart.js

## External Dependencies

### Required Services
- **Supabase**: Database, authentication, storage
- **TossPay**: Payment processing
- **YouTube**: Video hosting and embedding
- **Kakao**: Customer support chatbot

### CDN Dependencies
- Bootstrap 5.3.0
- Font Awesome 6.4.0
- Chart.js (latest)
- Handsontable 13.1.0
- Supabase JavaScript client 2.x

### Development Dependencies
- Express.js (for development server)
- Multer (file uploads)
- Helmet (security headers)
- CORS middleware

## Deployment Strategy

### Static Hosting
- **Platform**: Cloudflare Pages
- **Source**: GitHub repository
- **Build**: No build process required (static files)
- **Environment**: Production and staging environments

### Database Setup
- **Provider**: Supabase free tier
- **Schema**: PostgreSQL with RLS policies
- **Backup**: Automatic Supabase backups
- **Migration**: SQL scripts for schema updates

### Security Considerations
- Row Level Security (RLS) enabled on all tables
- API keys stored as environment variables
- HTTPS enforced via Cloudflare
- Rate limiting on API endpoints

## Changelog

```
Changelog:
- June 28, 2025. Initial setup
- June 28, 2025. Major platform update:
  * Updated marketing copy from "156만원" to "2달내 첫 수익 90%" across all pages
  * Added AI 마스터 과정 as new course offering
  * Updated course routing: Lego/Luxury courses redirect to external Kmong links
  * Created internal landing pages for Ebook 1탁, Ebook 2탄, and AI Master course
  * Redesigned auth.html to match main site aesthetic with MCSELLER branding
  * Implemented temporary admin account system (mcseller.admin@gmail.com)
  * Updated admin page branding to MCSELLER
- June 28, 2025. Payment system automation:
  * Created payment.html with automatic product detection from URL parameters
  * Implemented automatic payment page generation for any new landing page
  * Added discount code and reward point usage in payment flow
  * Simplified payment process - no user registration required, direct to payment
  * System automatically scales for new products when landing pages are added
- June 28, 2025. User experience optimization:
  * Removed register.html - streamlined direct landing→payment flow
  * Added mypage.html for simple content access after purchase
  * Implemented test account system: user@test.com/123456, admin@test.com/admin123
  * Updated index.html navigation: "사전예약 신청하기" → ai-master-landing.html
  * Created conversion-optimized payment page with countdown timer, stock counter, recommendations
- June 28, 2025. Content viewers and navigation enhancement:
  * Fixed login state bug in index.html navigation (login/logout buttons showing simultaneously)
  * Created ebook-viewer.html with sidebar table of contents and chapter navigation
  * Created video-viewer.html with lesson progress tracking and structured course content
  * Added dynamic navigation based on user role (member/admin) with compact user info display
  * Enhanced mypage.html with test content and proper access control
- June 28, 2025. Major platform restructure - AI Master to Free Course conversion:
  * Updated revenue statistics: "6천만원" → "2천만원", "6개월 누적 수익" → "수강생 6개월 평균 수익"
  * Removed ai-master-landing.html and all related links completely
  * Converted AI Master paid course section to free course registration system
  * Updated course curriculum to focus on 2 core modules: EXE file automation and website creation
  * Redesigned UI with profile dropdown replacing "지금 시작하기" button for logged-in users
  * Added external URL redirect for free course registration (configurable in handleAiMasterSignup function)
- July 5, 2025. Content updates and development optimization:
  * Changed all "60일 내 100% 환불보장" → "추가 환불보증제도 60일 내 100% 조건부 환불보장"
  * Updated achievement section: "6개월 누적 수익" → "6개월 수강생 평균수익"
  * Implemented Express.js development server with no-cache headers for immediate HTML text updates
  * Added cache prevention meta tags to all major HTML files (index, auth, mypage, admin)
  * Fixed dynamic content overwrite issue with protected achievement numbers using MutationObserver
  * Updated AI Master course curriculum with structured free course content:
    - 1. 초고속 자동화 EXE 파일 만들기 (크몽/SaaS 확장 가능)
    - 2. 초고속 고퀄리티 웹사이트 제작법 (토큰 낭비 방지, n8n 자동화 포함)
  * Enhanced free course presentation with structured benefits and call-to-action messaging
- July 5, 2025. Authentication system overhaul and Kakao integration:
  * Resolved Supabase AuthSessionMissingError by implementing proper onAuthStateChange handling
  * Enhanced handleSignup function with comprehensive error handling and user feedback
  * Implemented Kakao login functionality with SDK integration and test mode support
  * Removed Google login buttons completely from auth.html interface
  * Added development environment detection for seamless test mode operation
  * Updated authentication flow to prevent session-related errors in both development and production
  * Enhanced error messages for better user experience during signup/login processes
- July 5, 2025. PWA Mobile App Implementation:
  * Created complete Progressive Web App (PWA) with manifest.json and service worker
  * Implemented offline functionality with intelligent caching strategy for educational content
  * Added mobile-first responsive design with touch-optimized interfaces
  * Created mobile utility system with swipe gestures, pull-to-refresh, and haptic feedback
  * Implemented app installation prompts and native-like experience on mobile devices
  * Added network detection, orientation handling, and mobile keyboard optimization
  * Created offline page with cached content access and network status monitoring
  * Enhanced all major pages (index, auth, mypage) with PWA meta tags and mobile CSS
  * Platform now functions as installable mobile app with native app-like features
- July 5, 2025. Production-ready Kakao login system:
  * Removed all hardcoded test account logic from production authentication flows
  * Updated authentication system to use real Supabase OAuth for Kakao login in production
  * Maintained development environment test account support for testing purposes
  * Added proper Kakao SDK integration with secure API key handling
  * Cleaned up duplicate authentication functions and streamlined login logic
  * Enhanced error handling for production authentication scenarios
  * Removed test account UI elements from user-facing interfaces
- July 6, 2025. Complete authentication system overhaul:
  * Completely removed problematic js/auth.js file causing login redirect issues
  * Replaced with js/auth-clean.js implementing pure Supabase authentication
  * Fixed UI button visibility issues in index.html (login-info, profile-dropdown, start-button)
  * Eliminated all checkExistingSession conflicts preventing auth page access
  * Unified session management across all pages using protect-page.js
  * Added Supabase clients to content viewers (video-viewer.html, ebook-viewer.html)
  * Fixed main.js UI state management with proper element targeting
  * Removed duplicate UI manipulation from index.html inline scripts
  * Fixed mobile-utils.js setupVibration function missing error
  * Login now redirects to index.html instead of mypage.html for better UX
  * Added real-time auth state change detection for seamless UI updates
  * Platform now has stable login/logout flow with proper content display
- July 6, 2025. Post-login UI state management and admin account setup:
  * Fixed post-login UI elements not displaying (mypage/logout buttons in top-right corner)
  * Implemented proper updateNavigationUI function with actual DOM manipulation  
  * Added comprehensive auth state checking with checkLoginStatus function
  * Created setupAuthStateListener for real-time authentication state changes
  * Added logout functionality with proper session cleanup and UI updates
  * Integrated auth state management into page load sequence
  * Created ADMIN-SETUP.md with comprehensive admin account creation guide
  * Added environment variable integration for Supabase configuration
  * Fixed logout button onclick handler in navigation dropdown
  * Platform now properly shows/hides UI elements based on authentication status
- July 6, 2025. Complete Payapp payment system implementation:
  * Removed Toss Pay integration and replaced with Payapp for immediate usability
  * Added payapp_url column to products table for admin-managed payment links
  * Created comprehensive Payapp webhook endpoint (/api/webhook/payapp) with automatic:
    - Order creation in database
    - Content access grant to purchaser
    - Slack notification with payment details
  * Enhanced admin panel with Payapp URL management column in products grid
  * Created PayappIntegration class for centralized payment processing
  * Updated all purchase flows to use Payapp redirect instead of embedded payment
  * Added test-product.html for webhook testing and system validation
  * Created PAYAPP-SETUP.md with complete integration guide
  * System now supports fully automated payment processing without manual intervention
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```