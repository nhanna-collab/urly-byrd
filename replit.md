# Urly Byrd - Merchant Time-Limited Offers Platform

## Overview
Urly Byrd is a flash marketing platform for local businesses, enabling them to create and manage time-limited flash sale campaigns to liquidate excess inventory and generate immediate revenue. The platform supports tiered merchant memberships, tools to create urgency in offers, and customer-facing features like deal browsing, SMS notifications, and a referral/rewards system.

## 🚫 CRITICAL MONETARY POLICY: DOLLARS ONLY - NO PENNIES
**This system uses DOLLARS exclusively. Never use pennies, cents, or integer penny values anywhere.**
- All database monetary fields: `numeric(10,2)` storing dollars
- All calculations: decimal dollar amounts (e.g., 1.65, 500.00, 0.021)
- All API contracts: dollar amounts only (e.g., `amountInDollars`)
- All displays: formatted as `$X.XX`
- See `NO_PENNIES.md` and `shared/monetaryConstants.ts` for policy and safeguards
- **NEVER multiply or divide by 100** - this violates the dollars-only policy

## User Preferences
Preferred communication style: Simple, everyday language.
**Home Page**: The home page route (`/`) should always be the **Home** page (with lightning bolt animation and scrolling ticker), NOT OfferCreator or FlashMarketing.
**CRITICAL UI RULE - NUMBER INPUT FIELDS**: ALL number input fields must be EXACTLY this size:
- Width: `w-16` (narrow, 1/4 size)
- Height: `h-8` (standard input height, matches other fields)
- Text: `text-sm` (normal readable size)
- Example: `className="h-8 text-sm w-16"`
This applies to ALL numeric inputs including budgets, prices, quantities, max clicks, etc. NEVER deviate from this sizing.

## Terminology
**CRITICAL**: Use these exact terms when referring to countdown features:
- **Countdown Timer**: When a customer opens an ad/coupon, a timer starts ticking for them to accept, reject, or forward the coupon. This is the initial decision timer.
- **Time Bomb**: After the customer clicks to accept the coupon, another countdown starts for them to actually use/redeem the coupon at the merchant location. This is the redemption deadline timer.

## System Architecture

### UI/UX Decisions
The frontend is a React 18 SPA with TypeScript and Vite, using Wouter for routing. UI components are built with Shadcn/ui (New York style) and Radix UI, styled with Tailwind CSS. The design emphasizes urgency with DM Sans and Space Grotesk fonts, responsive layouts, and a consistent `max-w-7xl` content width. Forms use a compact design with small input heights, minimal spacing, and 12-column grid systems.

### Technical Implementations
The frontend uses TanStack Query for server-side state and caching. Core functionalities include anonymous offer browsing, phone/ZIP verification at claim time, 10-mile radius validation for offers, and SMS coupon delivery. The backend is an Express.js server (TypeScript, ESM) handling authentication via email/password, bcrypt, and `express-session` with `connect-pg-simple` for PostgreSQL session storage. It provides a RESTful API for authentication, public offer viewing, and protected merchant actions.

### Feature Specifications
*   **Membership Tiers**: Six tiers (NEST, FREEBYRD, GLIDE, SOAR, SOAR PLUS, SOAR PLATINUM) define active offer limits and monthly text allocations.
*   **Merchant Registration**: Includes a "Universal Three-Layer Verification System."
*   **Two-Stage Offer/Campaign Workflow**:
    *   **Stage 1 (Offers)**: Create and manage single offers as drafts at `/offers`. Offers saved here are one-time tests without scheduling. Form fields remain populated for easy duplication.
    *   **Stage 2 (Campaigns)**: Schedule and manage campaigns at `/stage2`. Single offers with repeat scheduling or multiple batch offers escalate to campaigns.
    *   **Workflow Logic**: Single + one-time = Offer (Stage 1), Single + repeating schedule = Campaign (Stage 2), Batch + any schedule = Campaign (Stage 2).
*   **Offer Management**: Supports various offer types (Percentage, Dollar Amount, BOGO, Spend Threshold, Buy X Get Y for Free) through two creation methods:
    *   **Full Form**: A detailed, seven-section form for single offers with extensive control over parameters, QR code generation. Saves to Stage 1 via "Single Offer Test - Forward to Stage 1" button.
    *   **Batch Build (A/B Testing)**: A unified workflow generating 8 permutations per offer type (Regular Coupon x 4 ad types, Pre-Payment Offer x 4 ad types) for A/B test campaigns, allowing configuration of countdown settings and scheduling.
*   **Dynamic Ads - Countdown QTY**: Inventory-based countdown for urgency, tied to `prepayment_offer` redemption, tracking sales and displaying live inventory status.
*   **Duplicate & Schedule**: Clones existing offers into new drafts.
*   **Batch Folders**: Organizational containers for grouping offer drafts with a specific naming convention.
*   **Campaigns Section (Future)**: An analytics dashboard for performance analysis of expired offers with immutable data.
*   **Customer Interaction**: Anonymous browsing, phone/ZIP verification, secure web-based verification, and 1-SMS coupon delivery with QR code generation.
*   **Dedicated Offer Pages**: Mobile-optimized `/offer/:id` landing pages with full offer details, merchant info, countdown displays, and dual action buttons (Claim & Share).
*   **Viral Sharing UI**: Prominent "Share Deal" button on offer cards (not icon-only) to maximize forward-to-friend engagement.
*   **QR Code Redemption**: Post-claim success displays unique coupon codes as scannable QR codes (via `qrcode.react`) plus plain text for both digital and in-store redemption.
*   **Customer Referral & Rewards**: Points system for sharing offers within a 10-mile radius and a Check-in Rewards System.
*   **Merchant Customer Import**: CSV import with validation.
*   **Location System**: Uses `zipcodes` and Haversine formula for distance calculations.
*   **QR Code & Printable Signs**: Generation of branded QR codes and customizable marketing signs.
*   **Bank Management & Customer Acquisition**: Prepaid account for pay-per-click customer acquisition.
*   **Reports & Analytics**: Dashboard for performance, engagement, and ROI data with export capabilities.
*   **Progressive Web App (PWA)**: Prompts customers to add the platform to their home screen.
*   **Location Sharing**: One-time prompt for automatic nearby offer filtering.
*   **SMS Campaigns**: Merchants can send targeted SMS messages to customer lists.
*   **Smart Notifications System**: Production-grade system with an event bus, priority-based routing, merchant preference management, and quiet hours.

### System Design Choices
Data persistence uses Drizzle ORM with a PostgreSQL database (Neon). The schema includes tables for sessions, users, offers, customers, claims, referrals, customer points, and merchant customers. Security features include bcrypt, session cookies, a three-layer merchant verification system, and secure web-based verification with rate limiting. Foreign key constraints, such as `onDelete: "set null"`, maintain data integrity.

## External Dependencies
*   **Neon Database**: Serverless PostgreSQL hosting.
*   **Google Fonts**: DM Sans, Space Grotesk, Geist Mono, Architects Daughter, Fira Code.
*   **NPM Packages**: `drizzle-orm`, `@neondatabase/serverless`, `ws`, `bcrypt`, `express-session`, `connect-pg-simple`, `psl`, `@radix-ui/*`, `class-variance-authority`, `clsx`, `tailwind-merge`, `react-hook-form`, `@hookform/resolvers`, `zod`, `multer`, `date-fns`, `memoizee`, `nanoid`, `zipcodes`, `qrcode.react`.
*   **Twilio**: For SMS delivery (requires manual configuration of `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_PHONE_NUMBER`).