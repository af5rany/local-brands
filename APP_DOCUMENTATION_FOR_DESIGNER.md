# Local Brands — App Documentation for UI/UX Designer

> **Platform:** Mobile-first (iOS & Android) with web support
> **Framework:** React Native / Expo
> **Date:** May 3, 2026

---

## Table of Contents

1. [App Overview](#1-app-overview)
2. [User Roles & Permissions](#2-user-roles--permissions)
3. [Navigation Architecture](#3-navigation-architecture)
4. [Screen-by-Screen Breakdown](#4-screen-by-screen-breakdown)
5. [Reusable Components](#5-reusable-components)
6. [Design System & Theming](#6-design-system--theming)
7. [User Flows](#7-user-flows)
8. [Current Feature Inventory](#8-current-feature-inventory)
9. [Placeholder / Coming Soon Features](#9-placeholder--coming-soon-features)

---

## 1. App Overview

**Local Brands** is a mobile-first e-commerce marketplace that connects local brand owners with customers. It supports multi-brand ownership, meaning a single user can own and manage multiple brands. The app serves four distinct user roles — each with its own dashboard and feature set.

### Core Concept
- **Brand owners** create brands, list products with multiple color variants, and manage inventory.
- **Customers** browse products, filter/sort/search, add items to a wishlist or cart, and place orders with address management.
- **Admins** oversee the entire platform — manage users, brands, products, and view system-wide statistics.
- **Guests** can browse the catalog without an account but must register to purchase.

### Key Differentiators
- Multi-brand ownership (one user can own/manage several brands with different roles per brand)
- Per-color product variants with individual stock tracking and image galleries
- Full order lifecycle with status history audit trail
- Product review system with admin approval workflow
- Role-based dashboards that completely change the home screen experience
- AI-powered virtual try-on feature on product detail screens
- Social feed with brand posts, likes, comments, and brand following

---

## 2. User Roles & Permissions

| Role | Browse | Cart & Checkout | Wishlist | Reviews | Feed Social | Manage Brands | Manage Products | Manage Users | View Stats |
|------|--------|-----------------|----------|---------|-------------|---------------|-----------------|--------------|------------|
| **Guest** | Yes | Yes | No | No | No (read-only) | No | No | No | No |
| **Customer** | Yes | Yes | Yes | Yes | Yes | No | No | No | Personal only |
| **Brand Owner** | Yes | Yes | Yes | Yes | Yes | Own brands only | Own products only | No | Own brand stats |
| **Admin** | Yes | Yes | Yes | Yes | Yes | All brands | All products | Yes | System-wide |

> **Guest scope:** Guests can browse, add to cart, and complete checkout. Wishlist saves, writing reviews, liking/commenting on posts, and following brands all require a registered account. Guests shopping as guest see a sign-up banner in cart and checkout prompting account creation (cart is preserved on conversion).

### Brand-Level Roles (within BrandUser)
A brand owner can assign team members with granular roles:
- **Owner** — full control
- **Manager** — can manage products and edit brand profile
- **Staff** — limited product access
- **Viewer** — read-only

---

## 3. Navigation Architecture

### Bottom Tab Bar (6 tabs)
```
┌──────────────────────────────────────────────────────────────────────────┐
│                            App Content Area                               │
├──────────┬──────────┬──────────┬──────────┬──────────────┬───────────────┤
│ 🏠 Home  │ 🏪 Shop  │ 📰 Feed  │ ♡ Wishlist│ 🏷 Brands  │ 👤 Profile    │
└──────────┴──────────┴──────────┴──────────┴──────────────┴───────────────┘
```

- **Home tab** — Role-based landing; shows Customer dashboard (with search) or redirects based on role
- **Shop tab** — Full product & brand browsing with search, filters, sort, and pagination
- **Feed tab** — Social feed of posts from followed brands (authenticated) or all brands (guest). Brand owners see a floating action button (FAB) to create new posts.
- **Wishlist tab** — Saved products grid; shows sign-in prompt for guests
- **Brands tab** — Brand discovery and listing with search and filters
- **Profile tab** — User profile overview; shows sign-in prompts for guests

### Header (shown on Home and Shop screens)
- Logo (tappable → home)
- Time-based greeting ("Good morning", "Good afternoon", "Good evening")
- Search bar → tapping opens **SearchModal** (full-page search overlay)
- Cart button (bag icon) with badge showing item count
- Hamburger menu button → opens animated side menu

### Header Side Menu
- Slides in from left with animated menu items (staggered fade-in)
- Active route highlighting
- Navigation items: Home, Shop, Feed, Wishlist, Brands, Orders, Profile, Settings, Notifications, Referral
- Management Dashboard link (admin/brand owner only)
- Cart with item count badge
- Info section: About, Shipping, Returns, Contact
- User actions: Login (guest) or Logout (authenticated)
- Close button or tap outside to dismiss

### Route Structure (Expo Router — file-based)
```
/                         → Root redirect
/(tabs)/                  → Tab navigation container
  ├── index               → Home (role-based dashboard)
  ├── shop                → Shop (product & brand browsing)
  ├── feed                → Feed tab (social posts from brands)
  ├── wishlist            → Wishlist tab
  ├── brands              → Brands tab
  └── profile             → Profile tab

/manage/
  └── index               → Management dashboard (admin & brand owner only)

/auth/
  ├── login               → Login screen
  ├── register            → Registration screen
  ├── forgot-password     → Forgot password screen
  └── reset-password      → Reset password screen

/brands/
  ├── index               → All brands list (browse/admin)
  ├── create              → Create new brand (admin only)
  ├── select              → Select from my brands (brand owner)
  └── [brandId]/
      ├── index           → Brand detail page
      ├── edit            → Edit brand
      ├── dashboard       → Brand analytics dashboard (brand owner)
      ├── products        → Brand's product list
      ├── promo-codes/
      │   ├── index       → Promo codes list
      │   ├── create      → Create promo code
      │   └── [promoId]   → Edit promo code + usage stats
      ├── shipping/
      │   ├── index       → Shipping zones list
      │   └── zone        → Create zone or add rate
      ├── returns/
      │   ├── index       → Brand returns list
      │   └── [returnId]  → Return request detail + actions
      ├── return-policy   → Return policy settings
      ├── size-guides/
      │   └── index       → Size guide management (list, create, edit)
      ├── email-campaigns/
      │   ├── index       → Email campaigns list with send/delete
      │   ├── create      → Compose campaign + schedule option
      │   └── [campaignId] → Edit + stats + send/schedule actions
      └── bundles/
          ├── index       → Product bundles list (toggle/edit/delete)
          ├── create      → Create bundle form
          └── [bundleId]  → Edit bundle

/products/
  ├── index               → Product catalog
  ├── [productId]         → Product detail page
  ├── create/
  │   └── [brandId]       → Create product for brand
  └── edit/
      └── [productId]     → Edit product

/cart/
  └── index               → Shopping cart ("My Collection")

/checkout/
  ├── index               → Checkout with address selection
  └── confirmation        → Order confirmation screen

/orders/
  ├── index               → My orders list
  └── [orderId]           → Order detail with status timeline

/feed/
  ├── create              → Create feed post (brand owner only)
  └── [postId]            → Post detail with comments

/profile/
  ├── edit                → Edit profile form
  ├── settings            → App settings & preferences
  └── addresses/
      ├── index           → Saved addresses list
      ├── new             → Add new address form
      └── [id]            → Edit address

/users/
  └── index               → User management (admin only)

/notifications/
  ├── index               → Notifications list
  └── settings            → Notification preference toggles (push, email, order updates, promotions)

/returns/
  ├── index               → Customer's return history
  ├── create              → Create return request (with ?orderId param)
  └── [returnId]          → Return detail + status timeline + ship-back action

/referral/
  └── index               → Referral program

/info/
  ├── about               → About page
  ├── contact             → Contact page
  ├── shipping            → Shipping policy
  └── returns             → Returns & refunds policy
```

### Protected Routes (require authentication token)
`cart`, `checkout`, `orders`, `profile`, `users`, `notifications`, `referral`, `returns`, `wishlist`, `manage`

Unauthenticated users (no token) are redirected to `/auth/login`.

### Registered-Only Routes (guests redirected to register)
`wishlist`, `manage`, `users`, `referral`, `returns`

Guests have a valid token but are blocked from these routes — they are redirected to `/auth/register` so they can create an account and convert their guest session (cart is preserved on conversion).

---

## 4. Screen-by-Screen Breakdown

### 4.1 Home Screen — `/(tabs)/index`

The home screen renders the Customer/Guest browsing view by default. Admin and brand owner dashboards have moved to the dedicated `/manage` screen.

#### 4.1a Customer/Guest View
**Layout:**
- Header (greeting, search, cart, hamburger menu)
- Tab switcher: "Products" | "Brands"
- Filter chips bar (horizontal scroll showing active filters with clear buttons)
- Content grid (2-column responsive)
- Pagination controls

**Products Tab:**
- 2-column grid of product cards (RecommendationCard)
- Each card shows: product image, wishlist heart toggle, discount badge, brand name, product name, star rating, current price / strikethrough original price, "Add to Cart" button
- Filter panel (bottom sheet modal): Sort (Newest/Oldest), Category multi-select chips, Brand searchable checklist
- Pagination: Previous/Next arrows + page numbers with ellipsis

**Brands Tab:**
- 2-column grid of brand cards
- Each card shows: logo, brand name, location
- Same pagination as products

**Data fetched:** Filter options (categories, product types), featured brands (paginated, 12/page), new arrivals (paginated, 12/page), wishlist items, recently viewed product details (from AsyncStorage IDs)

**Recently Viewed section:**
- Horizontal scroll of up to 8 last-viewed products (product image + price)
- Appears only after user has viewed at least one product
- "CLEAR" button top-right — wipes history instantly
- Tapping a card navigates to product detail

---

### 4.1b Shop Screen — `/(tabs)/shop`

Dedicated shopping tab with the same product/brand browsing experience as the Home screen customer view, but accessible to all users directly via the bottom tab bar.

**Layout:**
- Header (greeting, search, cart, hamburger menu)
- CustomerDashboard component (identical to Home customer view)
- Full search, filter, and pagination controls

---

### 4.1c Management Screen — `/manage/index`

Accessible to admins and brand owners via the speedometer icon in the Header or via "Management Dashboard" in the Profile tab menu. Initializes with management mode active; pressing back/close returns to browsing mode.

#### Admin Dashboard
**Layout:**
- Header with back button, "Management" title (speedometer icon), and close button
- System Overview section:
  - StatsCards in a horizontal scrollable row (or grid on tablet):
    - Total Brands (count)
    - Total Products (count)
    - Total Users (count)
- Quick Actions section (card grid):
  - **Manage Brands** — navigates to `/brands`
  - **Product Management** — navigates to `/products`
  - **User Management** — navigates to `/users`
  - **System Analytics** — live (revenue, GMV by month, top brands, orders by status, user growth)
  - **Settings** — navigates to `/manage/settings`
  - **Continue as Customer** — exits management mode and goes back

#### Brand Owner Dashboard
**Layout:**
- Same header as Admin
- Stats section: My Products count, Orders count, Revenue
- Quick Actions section:
    - **My Products** — navigates to `/brands/select` (pick a brand first)
  - **Order Management** — navigates to `/brands/[brandId]/orders`
  - **Brand Analytics** — live on `/brands/[brandId]/dashboard`
  - **Continue as Customer** — exits management mode and goes back

**Data fetched:** Statistics from `/statistics` (brand-scoped for brand owners via `?brandId=`); supports pull-to-refresh.

---

### 4.2 Auth Screens

#### 4.2a Login — `/auth/login`
**Elements:**
- App logo image (centered at top)
- Email input field
- Password input field with show/hide eye toggle
- "Forgot Password?" link text (right-aligned)
- **Sign In** button (primary, full-width, black)
- **Continue as Guest** button (secondary/outlined)
- Social login: Google, Facebook (both styled B&W)
- Footer: "Don't have an account? **Register**" link

**Behaviors:** Separate loading states for normal login and guest login. Successful login stores JWT and navigates to home. Guest login creates a temporary account.

#### 4.2b Register — `/auth/register`
**Elements:**
- Back navigation
- Avatar upload section (square image area, tappable to open image picker)
  - Shows upload progress overlay when uploading
  - Cloudinary integration for image hosting
- Form fields:
  - Full name (required)
  - Username (required)
  - Email (required)
  - Password (required) with show/hide toggle
  - Confirm password (required) with show/hide toggle
  - Phone number (optional)
  - Date of birth (optional) — opens native date picker
- Info note about brand owner accounts
- **Register** button (primary, full-width, black)
- Social login: Google, Facebook (both styled B&W)
- Footer: "Already have an account? **Sign In**" link

**Behaviors:** Form validation with error messages per field. Avatar is uploaded to Cloudinary before form submission.

#### 4.2c Forgot Password — `/auth/forgot-password`
**Elements:**
- Back button
- Heading text explaining the process
- Email input field
- **Send Reset Link** button (black)
- Success/error feedback messages via alerts

#### 4.2d Reset Password — `/auth/reset-password`
**Elements:**
- New password input with show/hide toggle
- Confirm password input with show/hide toggle
- **Reset Password** button (black)
- States: idle → loading → success (shows success screen with checkmark icon and "Continue to Login" button) / error banner

---

### 4.3 Brand Screens
#### 4.3b Create Brand — `/brands/create`
**Elements:**
- Back button in header
- Logo upload section (dashed border, tappable, shows preview with upload progress)
- Form card:
  - Brand name (required)
  - Description (required, multiline)
  - Location (required)
  - Owner dropdown (selects from users list)
- **Publish Brand** button (black)

#### 4.3c Brand Selection — `/brands/select`
**Purpose:** For brand owners who manage multiple brands — they pick which brand to work on.

**Elements:**
- Header with back button
- List of user's brands
- Brand cards: logo, name, description, product count, location
- Tapping a card sets it as the selected brand in BrandContext
- Empty state: "No Brands Found" message

#### 4.3d Brand Detail — `/brands/[brandId]/index`
**Elements:**
- Back button
- Brand header: logo, name, status badge, description, location
- Follow/Unfollow button
- Action buttons (owner/admin): Edit, Delete, Add Product
- **"Products" | "Posts"** tab switcher:
  - **Products tab** — 2-column product grid with search, filter panel, sort options, load more, pull-to-refresh
  - **Posts tab** — 2-column grid of the brand's feed posts; tapping a post navigates to `/feed/[postId]`; empty state if brand has no posts

#### 4.3e Brand Owner Orders — `/brands/[brandId]/orders`
**Elements:**
- Back button, "ORDERS" title
- Paginated list of orders placed through this brand (infinite scroll)
- Each row: order number, status badge (color-coded), customer name/email, item preview (name · color · size × qty), date, total
- Tapping a card → `/orders/[orderId]` (read-only customer-facing detail)
- Empty state when no orders
- Pull-to-refresh

> Brand owners can **view and fulfill** orders. Action button appears per order based on current status: PENDING → CONFIRM ORDER, CONFIRMED → MARK PROCESSING, PROCESSING → MARK AS SHIPPED (opens tracking number modal), SHIPPED → MARK DELIVERED. Transitions are forward-only; tracking number required for SHIPPED. Backend: `PUT /orders/:id/fulfill` with `BrandUser` ownership check.

#### 4.3e Edit Brand — `/brands/[brandId]/edit`
**Elements:**
- Back button
- Logo upload with current logo preview
- Form fields: brand name, description, location
- Status selector: visual chips for Active, Suspended, Archived, Draft
- **Save Changes** button

#### 4.3f Brand Products — `/brands/[brandId]/products`
- Paginated product list for a specific brand (10/page)
- Filter, sort, product management cards

---

### 4.4 Product Screens

#### 4.4a Products List — `/products/index`
**Elements:**
- Search bar
- Filter button → filter modals (gender, product type)
- Sort button → sort modal
- Clear filters button
- Product cards grid
- Pagination
- Pull-to-refresh

#### 4.4b Product Detail — `/products/[productId]`
**Elements:**
- Back button
- Image gallery:
  - Main large product image
  - Thumbnail row (scrollable, tappable to change main image)
  - Images change based on selected variant
- Product info:
  - Brand name (tappable → brand detail)
  - Product name
  - Price display: current price / original price (strikethrough)
  - Discount percentage badge (if on sale)
  - Star rating display
- Color display: product-level single color (displayed as label, not a picker — one product = one color)
- Size selector: size boxes (tappable chips); out-of-stock sizes shown italic/greyed and disabled; requires size selection before add to cart; **SIZE GUIDE** link opens modal if guide exists for the product/brand
- Description section (expandable)
- Product metadata: type, gender, season, material, care, origin, dimensions
- **Add to Wishlist** button (heart icon, toggles state)
- **Add to Cart** button (primary, full-width, black, disabled if out of stock)
- **TRY ON** button — opens TryOnModal (full-screen AI virtual try-on)
- Reviews section (ProductReviews component)
- **Q&A section** (ProductQA component, below reviews) — customers can ask questions; brand owners see pending questions with inline answer form; all answered Q&As visible publicly
- Fade-in and scale animations on load

#### 4.4c Create Product — `/products/create/[brandId]`
**Elements:**
- Back button
- Form sections:
  1. **Basic Info:** Product name, description, price, sale price
  2. **Classification:** Product type, subcategory, gender, season
  3. **Tags:** Text input + Add button, tag chips with remove button
  4. **Variants** (repeatable): Color selector (preset palette + custom), stock input, image upload (multi-image, 1–5 per variant with Cloudinary upload and progress states)
  5. **Status:** Draft or Published
  6. **Featured toggle**
- **Create Product** button (black)

#### 4.4d Edit Product — `/products/edit/[productId]`
Similar to create product, pre-filled with existing product data. Can update all fields including adding/removing variants.

---

### 4.5 Cart Screen — `/cart/index`
**Title:** "My Collection"

**Elements:**
- **GuestBanner** (visible to guest sessions only): yellow banner "Shopping as guest. Create account to save your order." with "Sign Up" CTA → `/auth/register`
- Cart item list:
  - Product thumbnail image
  - Product name, selected color/variant
  - Unit price
  - Quantity controls: − / count / + buttons (quantity updates instantly — optimistic UI)
  - Remove button (shows confirmation alert; item removed instantly on confirm — optimistic UI)
- Order summary: Subtotal, Shipping (calculated at next step), Total
- **Proceed to Checkout** button (black, full-width)
- Empty cart states: "No items" message + "Discover Products" link; sign-in prompt for unauthenticated users
- Marquee strip at top: scrolling promotional text

> Guests can fully use the cart. GuestBanner encourages account creation but doesn't block checkout.

---

### 4.6 Checkout Screen — `/checkout/index`
**Elements:**
- **GuestBanner** (visible to guest sessions only): same yellow sign-up prompt as cart
- Cart summary: items, quantities, prices, subtotal (collapsed/expanded toggle)
- Shipping address section:
  - List of saved addresses (selectable)
  - Default address highlighted
  - **Add New Address** button
- Shipping method picker (rates fetched dynamically by address country via `/shipping/calculate`)
- Order summary: Subtotal, Shipping, Tax, **Total**
- Promo code field (APPLY / REMOVE; discount line shown when applied)
- **Place Order** button (black, full-width)
- Generates unique idempotency key per brand group to prevent duplicates
- Validation: requires address selection
- **Multi-vendor:** Cart items from multiple brands create separate orders per brand; confirmation screen shows all order numbers + combined grand total

### 4.6b Order Confirmation — `/checkout/confirmation`
**Elements:**
- Animated checkmark icon
- Order number
- Confirmation message
- **View My Orders** button
- **Continue Shopping** button

---

### 4.7 Order Screens

#### 4.7a Orders List — `/orders/index`
**Elements:**
- Order cards list:
  - Order number (ID)
  - Created date
  - Status badge (B&W styled with status text)
  - Total amount
  - Tappable → order detail
- Pull-to-refresh
- Empty state

#### 4.7b Order Detail — `/orders/[orderId]`
**Elements:**
- Back button
- Order header: order number, order date, status badge, tracking number (if set)
- Status timeline (top bar style):
  ```
  PLACED — CONFIRMED — SHIPPED — OUT FOR DELIVERY — DELIVERED
  ```
- Manifest: items list with thumbnail, product name, brand/color/size, quantity × unit price, item total
- Logistics box (grey): DESTINATION address, SERVICE (shippingMethodName), CARRIER (shippingCarrier), TRACKING number
- Financial summary box (black background): Subtotal, Shipping, Tax, Discount (if promo applied), **Grand Total**
- Action buttons inside financial box: **DOWNLOAD INVOICE** (generates real PDF using `expo-print` from HTML template — items table, totals, shipping address — shared via `expo-sharing`), **TRACK SHIPMENT** (calls carrier API, shows live tracking events timeline with timestamp / location / description), **REQUEST RETURN** (visible only when status is DELIVERED — navigates to `/returns/create?orderId=X`)

---

### 4.17 Returns Screens

#### 4.17a Customer Returns List — `/returns/index`
- List of customer's return requests
- Each row: return ID, order ID, reason, status badge (color-coded)
- Tap → return detail

#### 4.17b Create Return Request — `/returns/create`
- Loads order info from `?orderId` query param
- Reason picker: Defective, Wrong Item, Not as Described, Changed Mind, Size/Fit, Damaged in Shipping, Other
- Description textarea (optional)
- Submit → `POST /returns`

#### 4.17c Return Detail (Customer) — `/returns/[returnId]`
- 5-step status timeline: REQUESTED → APPROVED → SHIPPED BACK → RECEIVED → REFUNDED
- Return details: reason, description, rejection notes (shown if rejected)
- **MARK AS SHIPPED** action: visible when status is APPROVED — text input for tracking number + submit button

---

### 4.18 Brand Owner — Promo Code Screens

#### 4.18a Promo Codes List — `/brands/[brandId]/promo-codes/index`
- List of brand's promo codes
- Each row: code, type (% or $), value, status badge (ACTIVE / INACTIVE / EXPIRED / USED UP), uses/max
- Toggle active switch, delete action

#### 4.18b Create Promo Code — `/brands/[brandId]/promo-codes/create`
- Fields: code (text input + GENERATE button for random code), type selector (PERCENTAGE / FIXED), value, min order amount, max discount amount (cap for % discounts), max uses total, max uses per user, start date, expiry date, description, isActive switch
- CREATE button

#### 4.18c Edit Promo Code + Stats — `/brands/[brandId]/promo-codes/[promoId]`
- Usage stats grid: Total Uses, Total Discount Given, Uses/Max
- Edit form: expiry date, description
- Recent usage list: date, user, order ID, discount applied

---

### 4.19 Brand Owner — Shipping Screens

#### 4.19a Shipping Zones List — `/brands/[brandId]/shipping/index`
- Zones list, each expandable to show rates within
- Zone row: name, country count, active badge
- Rates: method name, price, estimated days, active badge; delete action
- "ADD ZONE" and "ADD RATE" actions per zone

#### 4.19b Zone / Rate Form — `/brands/[brandId]/shipping/zone`
- When `?mode=zone`: create zone form (name, ISO country codes comma-separated)
- When `?zoneId=X`: add rate form (method selector, price, estimated days, min/max weight)

---

### 4.20 Brand Owner — Returns Screens

#### 4.20a Brand Returns List — `/brands/[brandId]/returns/index`
- Horizontal status filter tabs: All, Requested, Approved, Rejected, Shipped Back, Received, Refunded
- Return rows: return ID, customer name, reason, date
- Tap → detail

#### 4.20b Brand Return Detail — `/brands/[brandId]/returns/[returnId]`
- Status banner (color-coded border) + refund amount if set
- Customer info: name, email
- Return details: reason, description, return tracking number
- Customer photos (image grid)
- Admin notes card (if previously set)
- **Actions** (visible based on status):
  - REQUESTED status: notes input + APPROVE button + REJECT button (notes required for rejection)
  - SHIPPED_BACK status: MARK AS RECEIVED button
  - RECEIVED status: PROCESS REFUND & RESTORE STOCK button (shows confirmation alert)

---

### 4.21 Brand Owner — Return Policy — `/brands/[brandId]/return-policy`
- RETURN WINDOW (DAYS): number input
- RESTOCKING FEE (%): decimal input
- CONDITIONS: multiline text (optional)
- REQUIRE PHOTOS: switch (customers must upload photos with return)
- ACCEPT RETURNS: switch (disable to reject all returns)
- SAVE POLICY button

---

### 4.22 Brand Owner — Size Guide Screens

#### 4.22a Size Guide Management — `/brands/[brandId]/size-guides/index`
- List of size guides for the brand (title, scope: brand-level or per-product)
- Create guide form: title, unit (in/cm), headers (column names), size rows (label + per-column values), description
- Edit existing guide; delete action
- Brand-level guides serve as fallback when no product-level guide exists

**Customer UX:** On product detail page, if a size guide exists for the product (or the brand), "SIZE GUIDE" link becomes tappable → opens modal with table (headers as columns, rows as sizes)

---

### 4.23 Brand Owner — Email Campaign Screens

#### 4.23a Campaigns List — `/brands/[brandId]/email-campaigns/index`
- List of campaigns with status badges: DRAFT / SCHEDULED / SENDING / SENT / FAILED
- Sent count vs. recipient count shown per row
- Send now button (for drafts), delete action

#### 4.23b Create Campaign — `/brands/[brandId]/email-campaigns/create`
- Subject line input
- Body textarea (HTML or plain text)
- Preview text (optional)
- Schedule option: toggle → date/time picker
- **SAVE DRAFT** and **SEND NOW** buttons

#### 4.23c Edit + Stats — `/brands/[brandId]/email-campaigns/[campaignId]`
- Edit form (subject, body, preview text — only for DRAFT status)
- Stats: Sent Count, Recipient Count
- Actions: SEND NOW, SCHEDULE, DELETE

---

### 4.24 Brand Owner — Product Bundle Screens

#### 4.24a Bundles List — `/brands/[brandId]/bundles/index`
- List of bundles: name, discount type/value, active badge, product count
- Toggle active switch, edit link, delete action

#### 4.24b Create Bundle — `/brands/[brandId]/bundles/create`
- Bundle name, description (optional)
- Discount type: PERCENTAGE or FIXED
- Discount value (number input)
- Min quantity (how many bundle products must be in cart)
- Product selection: multi-select from brand's products
- Start/end date (optional)
- CREATE button

#### 4.24c Edit Bundle — `/brands/[brandId]/bundles/[bundleId]`
- Same fields as create, pre-filled
- SAVE CHANGES button

**Customer UX:** If cart contains enough bundle products, `/bundles/check` is called at checkout → bundle discount shown as a line item in order summary

---

### 4.25 Notification Settings — `/notifications/settings`
- Toggle rows for: PUSH NOTIFICATIONS, EMAIL NOTIFICATIONS, ORDER UPDATES, PROMOTIONS & OFFERS
- Each row: label, subtitle, iOS-style switch
- SAVE PREFERENCES button

---

### 4.8 Feed Screens

#### 4.8a Feed Tab — `/(tabs)/feed`
**Layout:**
- Scrollable list of feed posts
- Each post shows:
  - Brand logo and name (header)
  - Post images (swipeable carousel if multiple)
  - Caption text
  - Tagged products (tappable → product detail)
  - Action row: Like (heart, filled red `#C41E3A` when liked) + count, Comment + count, Share
  - Timestamp
- **FAB**: Visible for brand owners only — opens `/feed/create`
- Pull-to-refresh
- Infinite scroll
- **Authenticated users**: Feed shows only posts from followed brands
- **Guest/unauthenticated**: Feed shows all posts

#### 4.8b Create Post — `/feed/create`
**Elements:**
- Back button
- **Brand Picker** (if multi-brand owner): horizontal chip row, auto-selects if one brand
- Caption text input (multiline)
- Image upload section (multi-image, Cloudinary)
- **Product Tagging**: toggle product chips from selected brand. Tap the location icon on a selected product chip to enter pin-placement mode — then tap anywhere on the image preview to pin that product at that exact spot (stored as x%/y% of image dimensions)
- Pin preview overlay: small dot markers on the image for each pinned product
- **Post** button (black, full-width)

**Access:** Brand owners only (admin cannot create posts)

#### 4.8c Post Detail — `/feed/[postId]`
**Elements:**
- Back button
- Post content:
  - Brand header with **Share** button (native share sheet with post caption)
  - Images (single image shows tappable product pin dots at their x%/y% positions; tap pin → product mini-card popup with image, name, price, "View Product" → product detail)
  - Caption
  - Tagged products (horizontal chip scroll for products without coordinates; pins overlaid on image for those with coordinates)
- Action row: Like (heart, `#C41E3A` when liked) + count, Comment + count
- **Comments section:**
  - User avatar (square — image or initials placeholder)
  - Full name (bold)
  - Comment text
  - Time ago (e.g., "2h ago")
  - Three-dot menu on own comments → Delete with confirmation
- **Comment input bar** (fixed at bottom):
  - User avatar (small, square)
  - Text input with border
  - Send icon button

---

### 4.9 Wishlist Screen — `/(tabs)/wishlist`
**Two-tab layout: "PRODUCTS" | "BRANDS"**

**Products tab:**
- Responsive grid (2-3 columns depending on device width)
- Product cards: image, name, price, brand name, heart icon (tap to instantly remove — optimistic UI)
- Tappable → product detail
- Empty state with "BROWSE SHOP" CTA
- Sign-in prompt for guests

**Brands tab:**
- List of followed brands: logo, name, product count, location
- "FOLLOWING" button per row → tap to unfollow
- Empty state with "DISCOVER BRANDS" CTA

---

### 4.10 Profile Tab — `/(tabs)/profile`

**Unauthenticated state (no token):**
- Person icon placeholder (square)
- "NOT SIGNED IN" eyebrow text
- "YOUR PROFILE" heading
- Sign in description text
- **Sign In** button (black) → `/auth/login`
- **Create Account** button (outlined) → `/auth/register`

**Guest session state (has token, isGuest=true):**
- Person icon placeholder (square)
- "GUEST SESSION" eyebrow text
- "YOUR PROFILE" heading
- Description prompting account creation to save cart/orders/wishlist
- **Create Account** button (primary black) → `/auth/register` (convert-guest flow)
- **Sign In** button (outlined) → `/auth/login`

**Authenticated state (registered user):**
- Profile header:
  - Avatar (square — shows image if uploaded, or initials on grey background)
  - Full name
  - Email
  - Role badge (e.g. "Admin", "Brand Owner", "Customer")
- Menu list:
  - **Management Dashboard** (admin/brand owner only) → `/manage`
  - **Edit Profile** → `/profile/edit`
  - **Shipping Addresses** → `/profile/addresses`
  - **Settings** → `/profile/settings`
- **Log Out** button (red text `#C41E3A`, outlined)
- Version number at bottom
- Pull-to-refresh

#### 4.10a Edit Profile — `/profile/edit`
**Elements:**
- Back button
- Avatar section: current avatar (square), "Change Photo" overlay, upload progress
- Form fields: Name, Email (read-only), Phone, Date of birth
- **Save Changes** button (black)

#### 4.10b Settings — `/profile/settings`
**Elements:**
- **Notifications:** Push Notifications toggle, Email Notifications toggle, Order Updates toggle
- **Account:** Change Password link, Privacy Policy link → `/info/privacy`, Terms of Service link → `/info/terms`
- **Logout** button
- **Delete Account** button (red, shows confirmation alert → calls `DELETE /users/me` → logs out)

#### 4.10c Addresses List — `/profile/addresses/index`
**Elements:**
- Address cards: name, address, city/state/zip, phone, default badge, Edit/Delete/Set Default buttons
- **Add New Address** button
- Pull-to-refresh

#### 4.10d Add/Edit Address — `/profile/addresses/new` & `/profile/addresses/[id]`
- Form: Full name, Address line 1, Address line 2, City, State, ZIP, Country, Phone
- Address type: Shipping / Billing
- Set as default toggle
- **Save Address** button (black)

---

### 4.11 User Management — `/users/index` (Admin Only)
**Elements:**
- Search bar
- Filter buttons: Role filter, Status filter
- Sort options
- User list: avatar, name, email, role badge, status badge
- Role assignment modal, Brand assignment modal
- Pull-to-refresh

---

### 4.12 Notifications — `/notifications/index`
**Elements:**
- Header with back button and "Mark All Read" button
- Notification list:
  - Unread dot indicator (left edge)
  - Icon in square box
  - Notification title and message
  - Time ago
- Empty state: icon, "No notifications yet"
- Pull-to-refresh

---

### 4.13 Referral — `/referral/index`
**Elements:**
- Illustration section
- Heading: "Share & Earn" / referral description
- **Referral code box**: code text + copy button
- **Share** button (black, full-width)
- Referral history: list of people referred with their name, date, and status badge (Pending / Completed)
- Empty state if no referrals yet

---

### 4.14 Info / Static Screens — `/info/`

#### About — `/info/about`
- Platform stats cards (brands count, products, etc.)
- Mission statement
- Values cards

#### Contact — `/info/contact`
- Contact channel cards (email, phone, social)
- Subject picker chips
- Message text input
- Send button

#### Shipping Policy — `/info/shipping`
- Hero section
- Shipping method cards with icon, title, description

#### Returns & Refunds — `/info/returns`
- Step-by-step return process cards
- Return conditions list
- Contact info box

#### Privacy Policy — `/info/privacy`
- Full privacy policy text with section headers

#### Terms of Service — `/info/terms`
- Full terms of service text with section headers

---

### Admin Settings — `/manage/settings`
**Elements:**
- Platform-level configuration accessible to admins only
- Navigated from Admin dashboard "Settings" quick action card

---

### 4.15 Search Modal (Global) — `SearchModal`
**Elements:**
- Slides up from bottom (full-page sheet)
- Search input (auto-focuses on open)
- "RESULTS" / "PRODUCTS" section label
- 2-column product grid:
  - Product image, name (uppercase), price (and original price if on sale)
  - Tappable → product detail
- Caches trending products for instant display on reopen
- Debounced search: 300ms after last keystroke
- Close button (×)

---

### 4.16 AI Try-On Modal — `TryOnModal`
**Elements:**
- Full-screen dark modal (#000 background)
- Garment preview at top
- **Pick stage**: instruction text, "TAKE A PHOTO" and "CHOOSE FROM GALLERY" buttons
- **Uploading stage**: spinner + "UPLOADING" label
- **Processing stage**: spinner + "GENERATING" + "AI is styling you · ~10 seconds"
- **Result stage**:
  - Before/after side-by-side images
  - **FULL VIEW** button (opens fullscreen overlay)
  - **SAVE** button (saves to photo library)
  - **TRY AGAIN** button
- Error banner (red `#C41E3A` background) if processing fails

---

## 5. Reusable Components

### Product Display Cards

| Component | Use Case | Key Features |
|-----------|----------|-------------|
| **RecommendationCard** | Home/Shop product grids | Image, wishlist heart, discount badge, brand name, product name, star rating, price, add-to-cart |
| **ProductCard** | Browse/management grids | Image with overlays (type tag, discount, status badge, stock, favorite, edit), brand name, price, color dots, add-to-cart |
| **ProductManagementCard** | Brand owner product lists | Thumbnail, product name, price/sale price, stock, color dots, status badge, edit button |

### Filter Components

| Component | Purpose | Behavior |
|-----------|---------|----------|
| **FilterPanel** | Full-screen bottom sheet for filtering | Animated bottom sheet (drag to close/expand), sort toggle, category chips, brand list with checkboxes, "Apply" button |
| **FilterChips** | Horizontal bar of active filters | Filter button with badge count, scrollable active filter tags with close buttons |
| **FilterModal** | Generic select modal | Single-select or multi-select modes, optional search, animated bottom sheet |

### Dashboard Components

| Component | Purpose | Features |
|-----------|---------|----------|
| **StatsCard** | Stat display | Large value, title, icon in square box, accent border, normal/small/tablet sizes |
| **QuickActionCard** | Navigation action | Icon box, title, description, chevron, swipeable "Go" action |
| **BrandCard** | Brand display | Square logo, name, location |

### Data Display

| Component | Purpose | Features |
|-----------|---------|----------|
| **Pagination** | Page navigation | Prev/Next arrows, smart page numbers with ellipsis, active page highlight |
| **RecentOrderCard** | Order summary | Order ID, status badge, total, item count, date, "View Details" link |
| **ProductReviews** | Review section | Review list (user, date, stars, verified badge, comment, images), write review form (star selector, image upload, submit) |
| **AutoSwipeImages** | Image carousel | Auto-swiping with dot indicators, 3s interval, single image fallback |

### Feedback & UI

| Component | Purpose | Features |
|-----------|---------|----------|
| **Toast** | Notification popups | Success / Error / Info types, auto-dismiss, slide animation |
| **ImageUploadProgress** | Upload feedback | States: compressing (spinner), uploading (progress bar), success (checkmark), error (alert icon) |
| **Header** | Top navigation | Logo, greeting, search (opens SearchModal), cart badge, hamburger menu |
| **SearchModal** | Global search | Full-page modal, trending products cache, 2-column product grid, debounced live search |
| **TryOnModal** | AI virtual try-on | Camera/gallery picker, Cloudinary upload, job polling, before/after result, save to library |
| **OfflinePlaceholder** | No-connection state | Wifi icon, "NO INTERNET CONNECTION" message, "RETRY" button; shown on all data-fetching screens when offline with no cached data |
| **Skeleton** | Loading placeholders | Pulsing placeholder shapes for product grids, order lists, brand cards, feed posts, dashboard stats; used on shop, home, brand detail, dashboard |
| **ScreenWrapper** | Screen layout wrapper | Safe area, theme background, consistent padding |

---

## 6. Design System & Theming

### Philosophy
The entire UI follows a **strict B&W minimalist aesthetic** — inspired by high-end fashion retail brands like Celine, SSENSE, and The Row. Every UI element is black, white, or neutral grey. The only accent color is a deep red (`#C41E3A`) used exclusively for danger states, delete actions, and sale prices.

### Color Palette

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `primary` | `#000000` | `#FFFFFF` | Buttons, active states, CTAs |
| `background` | `#FFFFFF` | `#0A0A0A` | App background |
| `surface` | `#FFFFFF` | `#141414` | Cards, modals |
| `surfaceRaised` | `#F5F5F5` | `#1E1E1E` | Inputs, chips, raised elements |
| `text` | `#1A1A1A` | `#F0F0F0` | Primary text |
| `textSecondary` | `#666666` | `#A0A0A0` | Secondary labels |
| `textTertiary` | `#999999` | `#666666` | Placeholders, muted text |
| `border` | `#E5E5E5` | `#2A2A2A` | Borders |
| `danger` | `#C41E3A` | `#C41E3A` | Errors, delete, sale price — only accent color |
| `success` | `#1A1A1A` | `#F0F0F0` | Success states (B&W, not green) |

### Shape Rules
| Property | Value | Applies To |
|----------|-------|------------|
| `borderRadius` | **`0`** | Every element — cards, buttons, badges, inputs, avatars, dots, modals, images |
| `shadowColor` | **none** | No shadows anywhere |
| `elevation` | **none** | No elevation on Android |

### Typography
- Custom font: SpaceMono-Regular (monospace)
- CTA buttons: **UPPERCASE** with `letterSpacing`
- Section headers: uppercase with wider letter-spacing
- Body text: standard case

### Responsive Breakpoints
- **Mobile:** default (< 768px width)
- **Tablet:** ≥ 768px width
- Components adapt: column counts, card sizes, image heights, grid layouts

### Animations & Interactions
- **Bottom sheets**: react-native-reanimated + gesture-handler (drag to dismiss, snap points)
- **Haptic feedback**: Tab bar buttons
- **Product detail**: Fade-in and scale animations on load
- **Search**: Animated border focus state
- **Swipeable cards**: QuickActionCards reveal "Go" action on swipe right
- **Toast notifications**: Slide-in/out with opacity fade
- **Search modal**: Slides up from bottom, auto-focuses input

---

## 7. User Flows

### 7.1 Guest → Customer Conversion
```
Open App → Home (guest view, browsing products)

Guest shopping path:
  → Browse products, add to cart (full cart + checkout available)
  → GuestBanner visible on cart & checkout: "Create account to save your order"
  → Tap "Sign Up" in banner (or profile tab → "Create Account")
    → Register screen detects guest token → calls /auth/convert-guest/:id
      → Same user ID preserved → cart, order history kept
        → Logged in as registered customer

Guest blocked path:
  → Tap heart on product → modal "Create account to save favorites" → /auth/register
  → Navigate to /wishlist → redirected to /auth/register
  → Navigate to /referral or /returns → redirected to /auth/register
```

### 7.2 Customer Shopping Flow
```
Home → Browse/Search products → Tap product
  → Product Detail (view images, select variant/color)
    → Add to Cart
      → Cart ("My Collection") → Adjust quantities
        → Proceed to Checkout
          → Select/Add shipping address
            → Review order summary
              → Place Order (idempotency key generated)
                → Order confirmation screen
                  → View in My Orders → Order Detail (track status)
```

### 7.3 Wishlist Flow
```
Shop tab → Browse products → Tap heart on product card
  → Item added to wishlist (toast confirmation)
    → Access wishlist via Wishlist tab
      → Tap product → Product Detail → Add to Cart
```

### 7.4 Brand Owner — Product Management
```
Profile tab → "Management Dashboard"
  → Management screen (/manage)
    → "My Products"
  → Brand Selection (if multiple brands)
    → Brand Detail page (own brand)
      → View products list (with filters/search)
        → "Add Product" → Create Product form
          → Fill details, add variants (colors, stock, images)
            → Publish or Save as Draft
      → Or tap existing product → Edit
```

### 7.5 Admin — User Management
```
Profile tab → "Management Dashboard"
  → Management screen (/manage)
    → "User Management"
  → Users list (search, filter by role/status)
    → Assign role to user
    → Assign user to brand
```

### 7.6 Admin — Brand Management
```
Profile tab → "Management Dashboard"
  → Management screen (/manage)
    → "Manage Brands"
  → Brands list (search, filter, sort)
    → Create new brand
    → Or tap brand → Brand Detail
      → Edit brand info / Change status / Delete brand
      → Manage products under brand
```

### 7.7 Order Review Flow
```
Receive order (delivered status)
  → Orders → Order Detail
    → Scroll to reviews section
      → "Can review" check passes
        → Select star rating (1-5)
          → Write comment (optional photo upload)
            → Submit review (goes to admin approval queue)
```

### 7.8 Password Reset Flow
```
Login → "Forgot Password?" link
  → Enter email → Send Reset Link
    → (Email received with token)
      → Reset Password screen (deep link with token)
        → Enter new password + confirm
          → Success screen → "Continue to Login" → Login
```

### 7.9 Feed & Social Flow
```
Feed tab → Scroll through posts from followed brands
  → Tap heart → Like/unlike (optimistic UI)
  → Tap comment icon → Post Detail
    → View all comments (avatar, name, text, time ago)
    → Type comment → Send
    → Three-dot menu on own comment → Delete

Brand Owner: Feed tab → FAB (+) → Create Post
  → Select brand (if multiple)
  → Write caption, upload images
  → Tag products from selected brand
  → Post → Appears in followers' feeds
```

### 7.10 Brand Follow Flow
```
Brands tab → Browse brands → Tap Follow button on brand
  → Brand added to followed list
  → Feed tab now includes posts from this brand
```

### 7.11 AI Try-On Flow
```
Product Detail → "TRY ON" button → TryOnModal opens
  → Take Photo or Choose from Gallery
    → Photo uploaded to Cloudinary (progress shown)
      → AI job submitted to backend
        → Polling: status checked every 1.5s
          → Result displayed (before/after side-by-side)
            → View fullscreen or Save to library
              → "TRY AGAIN" to start over
```

### 7.12 Search Flow
```
Home or Shop → Tap search bar → SearchModal slides up
  → Trending products displayed immediately
    → Type query → Live search (300ms debounce)
      → Product grid updates with results
        → Tap product → Product Detail (modal closes)
```

### 7.13 Profile & Address Management
```
Profile tab → Edit Profile (name, phone, DOB, avatar)
           → Shipping Addresses
               → Add New Address (form with type & default toggle)
               → Edit Existing → Update or Delete
               → Set as Default
           → Settings (notification toggles, change password, delete account)
```

---

## 8. Current Feature Inventory

### Authentication & Accounts
- [x] Email/password login
- [x] Guest login (browse + cart + checkout without account; 30-min JWT, guest rows auto-cleaned after 24h)
- [x] Guest → registered user conversion (`/auth/convert-guest/:id`): cart and orders preserved on same user ID
- [x] User registration with avatar upload
- [x] Password reset via email (forgot → reset flow)
- [x] JWT-based authentication with auto-expiration check (every 5 min)
- [x] Role-based access control (4 roles)
- [x] Social login buttons (Google, Facebook — B&W styled)

### Product Catalog
- [x] Product listing with pagination
- [x] Global search modal (trending products + live search)
- [x] Multi-filter system: product type, gender, season, price range, brand, availability, status
- [x] Multi-sort: name, price, creation date, update date, brand name, popularity
- [x] Product detail with image gallery
- [x] Product variants (per-color stock, images)
- [x] Product status lifecycle: Draft → Published → Archived
- [x] Featured/New Arrival/Bestseller/On Sale flags
- [x] Discount calculation and display

### Brand Management
- [x] Brand listing with search, filter, sort
- [x] Brand creation (admin)
- [x] Brand editing (owner/admin)
- [x] Brand deletion with confirmation (soft delete)
- [x] Brand status management: Draft, Active, Suspended, Archived
- [x] Multi-brand ownership (one user → many brands)
- [x] Brand team roles (Owner, Manager, Staff, Viewer)
- [x] Brand selection screen for multi-brand owners

### Shopping Cart
- [x] Add products to cart with variant selection
- [x] Update item quantity (increment/decrement) — **optimistic UI** (instant update, reverts on error)
- [x] Remove individual items — **optimistic UI** (instant removal after confirm, reverts on error)
- [x] Cart total recalculates immediately on quantity/remove changes (no refetch)
- [x] Navigate to checkout

### Checkout & Orders
- [x] Checkout with address selection
- [x] Dynamic shipping rate calculation (by country from brand's zones — falls back to free standard if no zones set)
- [x] Promo code apply/remove with live validation and discount line in order summary
- [x] Order placement with idempotency key
- [x] Order confirmation screen
- [x] Order list (my orders)
- [x] Order detail with item breakdown, carrier/service display
- [x] Order status timeline visualization
- [x] Order status history audit trail
- [x] Status progression: Pending → Confirmed → Processing → Shipped → Delivered
- [x] Order cancellation
- [x] Admin order status updates
- [x] REQUEST RETURN button on delivered orders

### Wishlist
- [x] Toggle products in/out of wishlist — **optimistic UI** (instant remove from list, reverts on error)
- [x] Wishlist tab: Products sub-tab (grid) + Brands sub-tab (followed brands list with unfollow)
- [x] Wishlist count in dashboard stats

### Reviews
- [x] View product reviews (star rating, comment, verified badge)
- [x] Review photo upload
- [x] Submit review (rating + comment + photos)
- [x] "Can review" check (only if user ordered the product)
- [x] Admin review moderation (approve/reject queue)
- [x] Verified purchase badge

### Returns
- [x] Customer return request creation (reason, description, order selection)
- [x] Customer returns list with status badges
- [x] Customer return detail with 5-step status timeline
- [x] Customer ship-back action (tracking number input)
- [x] Brand owner returns list with status filter tabs
- [x] Brand owner approve/reject returns (notes required for rejection)
- [x] Brand owner mark received + process refund (restores stock)
- [x] Return policy configuration per brand (window, restocking fee, photo requirement)

### Promo Codes (Brand Owner)
- [x] Create promo codes (%, fixed, min order, max discount cap, per-user limits, date range)
- [x] List, toggle active, soft-delete promo codes
- [x] Edit + usage stats view (uses count, total discount given, recent usage)
- [x] Apply promo codes at checkout (customer-facing validation + discount)

### Shipping Zones (Brand Owner)
- [x] Create shipping zones (name + ISO country codes)
- [x] Add/edit/delete shipping rates per zone (method, price, estimated days, weight range)
- [x] Dynamic rate calculation at checkout based on address country
- [x] Fallback: free standard shipping when no zones configured for brand

### Push Notifications
- [x] Expo push token registration on login (permission request → backend registration)
- [x] Notification deep-link routing (tapping order notification → order detail, return notification → return detail)
- [x] Notification preference settings (per-category toggles saved to backend)
- [x] Brand owner: send push + in-app notification to all followers from dashboard

### User Profile
- [x] Profile tab (6th bottom tab)
- [x] Edit profile (name, phone, DOB, avatar)
- [x] Avatar upload with Cloudinary
- [x] Address management (CRUD + set default)
- [x] Settings page with notification toggles
- [x] Notification settings screen (push, email, order updates, promotions — saved to backend)
- [x] Logout

### Brand Owner Dashboard
- [x] Analytics: revenue, orders, products, units sold, followers, views, active promo codes, pending returns, total discount given
- [x] Pending orders alert
- [x] Pending returns alert
- [x] Quick Actions: Promo Codes, Shipping, Returns, Return Policy, Size Guides, Email Campaigns, Bundles
- [x] Notify Followers modal (title + message → push + in-app to all followers)
- [x] Top products by sales
- [x] Recent orders list

### Admin Features
- [x] System-wide dashboard with stats
- [x] System analytics: revenue, GMV-by-month chart, top brands by revenue, orders by status, user growth percent
- [x] User management (search, filter, role assignment, brand assignment)
- [x] Brand management (all brands, create, edit, delete, status changes)
- [x] Review moderation queue

### Feed & Social
- [x] Social feed with posts (images, captions, tagged products)
- [x] Feed post creation for brand owners (brand picker, product chip tagging, image upload)
- [x] Like/unlike posts with optimistic UI (filled red heart `#C41E3A`)
- [x] Comment on posts (add, delete with confirmation)
- [x] Post detail with comment avatars and time-ago
- [x] Three-dot menu on own comments for delete
- [x] Brand follow/unfollow
- [x] Feed filtering: followed brands only (authenticated) / all posts (guest)
- [x] Infinite scroll pagination on feed
- [x] **Visual product pin tags on post images** — brand owners tap image to place product pin (x/y % coordinates stored), viewers tap pin dot to see product mini-card popup
- [x] Brand posts on Brand Detail — Products | Posts tab switcher added, allowing users to toggle between brand products and brand feed posts

### Brand Owner — Advanced Tools
- [x] **Size Guides** — brand owners create/edit size tables (headers, rows, unit); customers see SIZE GUIDE modal on product detail if guide exists
- [x] **Email Campaigns** — compose, schedule, send HTML/plain-text emails to all brand followers via BullMQ queue; status tracking (draft/scheduled/sending/sent/failed) with sent count
- [x] **Product Bundles** — create discount bundles (% or fixed, min quantity, date range); automatically applied at checkout when qualifying products in cart
- [x] **Social Sharing** — native share sheet on product detail (share button wired) and post detail (share icon in header)
- [x] **Stock Alerts** — customers subscribe to out-of-stock products ("NOTIFY ME" button); automatically notified (in-app + push) when stock is restored
- [x] **Inventory Alerts** — brand owners automatically notified (in-app + push) when product stock drops below configured threshold
- [x] **Order Tracking (Carrier API)** — TRACK SHIPMENT button on order detail calls live carrier APIs (FedEx, UPS, USPS, DHL); shows events timeline with timestamp, location, description
- [x] **Multi-Vendor Checkout** — cart items from multiple brands create separate per-brand orders in one checkout action; each order is idempotency-protected; confirmation screen shows all order numbers and combined total

### AI & Media
- [x] AI virtual try-on (camera/gallery → Cloudinary → backend job → polling → result)
- [x] Image upload via Cloudinary with compression and progress tracking
- [x] Multi-image upload per product variant (1-5 images)

### Personalization
- [x] "For You" personalized product section on Home feed (based on wishlist saves + order history)
- [x] **Recently Viewed** — horizontal scroll on home screen showing last 8 viewed products (real images + prices); hidden when empty; CLEAR button wipes history; tracked client-side via AsyncStorage (no backend needed)
- [x] **[DONE]** Search by image — camera icon in SearchModal, `useImageSearch` hook, backend CLIP-based embedding — see §10.4

### UX Features
- [x] Dark mode / Light mode support
- [x] Responsive design (mobile + tablet)
- [x] Pull-to-refresh on all list screens
- [x] Toast notifications (success, error, info)
- [x] Loading states, spinners, and skeleton loaders (shop, home, brand detail, dashboard, orders, feed)
- [x] Offline-aware screens with `OfflinePlaceholder` on all 10+ data-fetching screens
- [x] Haptic feedback + press scale animation on ShopByLook figures
- [x] Empty states with contextual messages and CTAs on all screens (cart, wishlist, orders, shop, feed, notifications, referral)
- [x] Error boundary (global error catching)
- [x] Animated bottom sheet modals
- [x] Haptic feedback on tab bar
- [x] Debounced search (300ms)
- [x] Time-based greeting in header
- [x] 6-tab bottom navigation (Home, Shop, Feed, Wishlist, Brands, Profile)
- [x] Guest-friendly tabs with sign-in prompts
- [x] Dedicated management screen (`/manage`)
- [x] Notifications screen with unread indicators
- [x] Referral program screen
- [x] Info/static content screens (About, Contact, Shipping, Returns)
- [x] Order confirmation screen
- [x] Header side menu with info section

---

## 9. Placeholder / Coming Soon Features

| Feature | Location | Current State |
|---------|----------|---------------|
| **Payment processing** | Checkout | No payment gateway — order is placed directly |
| **Email verification** | Registration | No verify flow — users auto-approved on registration |
| **Outfit Builder** | Phase 5 | Not yet scoped |
| **Product Videos** | Product detail | Video support not implemented |
| **Drops mechanic** | Phase 6 | Not yet scoped |

---

## 10. To Be Done

Features planned but not yet implemented. These should be designed and built.

### 10.1 Visual Product Tagging in Posts — `[DONE ✓]`

**Status:** Fully implemented.

**How it works:**
- `PostProduct` entity has `xPercent` (float, nullable) and `yPercent` (float, nullable) columns — coordinates as % of image dimensions
- In post creation (`/feed/create`): tap the location icon on a selected product chip → image enters pin-placement mode → tap anywhere on image preview to place pin at that coordinate. Pins displayed as dots over image.
- In post detail (`/feed/[postId]`): absolute-positioned dot overlays at `xPercent/yPercent` positions. Tap dot → product mini-card popup (image, name, price, "View Product" → product detail)
- Backward-compatible: products without coordinates show in horizontal chip scroll below caption
- Backend: `CreatePostDto` accepts `products: { productId, xPercent?, yPercent? }[]` alongside legacy `productIds[]`

---

### 10.2 "For You" — Personalized Feed Section — `[DONE ✓]`

**Status:** Implemented. Backend endpoint `GET /products/for-you` and frontend home screen section are live.

**How it works:**
- Collects signals from the user's wishlist (saved products) and order history (purchased products)
- Extracts preferred brands, categories, product types, and genders
- Scores and ranks unpurchased/unsaved products by relevance
- Falls back to trending products for new users with no history
- Section shown only for logged-in users, positioned after the Categories row in the home feed
- Section header reads "FOR YOU" with subtitle "Based on your saves & purchases"

---

### 10.3 Brand Posts on Brand Detail Page — `[DONE ✓]`

**Status:** Fully implemented.

**What was built:**
- Products | Posts tab switcher added to `brands/[brandId]/index.tsx`
- "Products" tab — 2-column product grid (unchanged from before)
- "Posts" tab — 2-column grid of brand's feed posts; tap → `/feed/[postId]`
- Empty state: "No posts yet" when brand has no posts
- Data: `GET /feed?brandId=:id&page=:p&limit=10`

---

### 10.4 Search by Image — `[DONE ✓]`

**Goal:** Allow users to take or upload a photo of any clothing item and find visually similar products in the catalog.

**Status:** Fully implemented.
- Backend: `POST /image-search` with CLIP-based embedding service. Admin `POST /image-search/batch-embed` for indexing all products.
- Frontend: `useImageSearch` hook handles camera/gallery picker, image compression (512px), multipart upload, returns ranked `Product[]`.
- **SearchModal** has a camera icon entry point (top right of search bar). Results replace the product grid. Loading state shown during search. Wired into `shop.tsx` as well.

**Planned UX:**
- Entry points:
  - Camera icon inside the SearchModal (next to the text input)
  - "Search by photo" option in the search bar area
- Flow:
  1. Tap camera icon → picker: "Take Photo" / "Choose from Gallery"
  2. Photo uploaded to Cloudinary
  3. Backend submits image to a visual similarity AI service
  4. Results page shows matched products grid (same layout as search results)
  5. User can refine results with standard filters (category, price, gender)
- Loading state: spinner + "Analyzing your image…"
- Error state: "No matches found — try a different photo"

**Data changes needed:**
- New endpoint: `POST /products/search-by-image` — accepts Cloudinary image URL, returns ranked product matches
- Integration with a visual similarity API (e.g., Google Vision, AWS Rekognition, or a custom embedding model)

---

## Appendix: Data Models Reference

### Product Types (Enum)
Shoes, Hoodies, Shirts, Accessories, Pants, Jackets, Bags, Hats

### Gender Options (Enum)
Men, Women, Unisex, Kids

### Seasons (Enum)
Spring, Summer, Fall, Winter, All Season

### Order Statuses
Pending → Confirmed → Processing → Shipped → Delivered / Cancelled

### Return Statuses
Requested → Approved / Rejected → Shipped Back → Received → Refunded

### Return Reasons
Defective, Wrong Item, Not as Described, Changed Mind, Size/Fit, Damaged in Shipping, Other

### Promo Code Types
Percentage (% off), Fixed ($ off)

### Shipping Methods
Standard, Express, Overnight, Local Pickup

### Payment Statuses
Pending, Paid, Failed, Refunded

### Brand Statuses
Draft, Active, Suspended, Archived

### Product Statuses
Draft, Published, Archived

### User Statuses
Approved, Suspended, Blocked

### Address Types
Shipping, Billing, Both
