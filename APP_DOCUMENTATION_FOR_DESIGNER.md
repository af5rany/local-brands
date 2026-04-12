# Local Brands — App Documentation for UI/UX Designer

> **Platform:** Mobile-first (iOS & Android) with web support
> **Framework:** React Native / Expo
> **Date:** April 9, 2026

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

| Role | Browse | Wishlist | Cart & Orders | Manage Brands | Manage Products | Manage Users | View Stats |
|------|--------|----------|---------------|---------------|-----------------|--------------|------------|
| **Guest** | Yes | No | No | No | No | No | No |
| **Customer** | Yes | Yes | Yes | No | No | No | Personal only |
| **Brand Owner** | Yes | Yes | Yes | Own brands only | Own products only | No | Own brand stats |
| **Admin** | Yes | Yes | Yes | All brands | All products | Yes | System-wide |

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
      └── products        → Brand's product list

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
  └── index               → Notifications list

/referral/
  └── index               → Referral program

/info/
  ├── about               → About page
  ├── contact             → Contact page
  ├── shipping            → Shipping policy
  └── returns             → Returns & refunds policy
```

### Protected Routes (require authentication)
`cart`, `checkout`, `orders`, `profile`, `users`, `notifications`, `referral`

Unauthenticated users attempting to access these are shown sign-in prompts or redirected to `/auth/login`.

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

**Data fetched:** Filter options (categories, product types), featured brands (paginated, 12/page), new arrivals (paginated, 12/page), wishlist items

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
  - **System Analytics** — coming soon
  - **Settings** — coming soon
  - **Continue as Customer** — exits management mode and goes back

#### Brand Owner Dashboard
**Layout:**
- Same header as Admin
- Stats section: My Products count, Orders count, Revenue
- Quick Actions section:
  - **My Products** — navigates to `/brands/select` (pick a brand first)
  - **Order Management** — coming soon
  - **Brand Analytics** — coming soon
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

#### 4.3a Brands List — `/brands/index`
**Elements:**
- Search bar
- Filter button → filter modals (location, owner, status)
- Sort button → sort modal (name, created date, updated date, location, product count)
- Clear filters button (when active)
- Brand cards list (vertical scroll):
  - Logo (square, placeholder if missing)
  - Brand name
  - Status badge (B&W styled: text label with border)
  - Description (2 lines, truncated)
  - Location
  - Product count
  - Created date
  - Delete button (admin/owner — shows confirmation alert)
- "Load More" button for pagination
- Pull-to-refresh

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
- Status change controls (owner/admin)
- Action buttons (owner/admin): Edit, Delete, Add Product
- Products section: search, filter panel, sort options, product list, load more, pull-to-refresh

> **[TODO]** Add **"Products" | "Posts"** tab switcher to brand detail. "Posts" tab shows the brand's feed posts (same card design as Feed tab, infinite scroll, taps to `/feed/[postId]`). See §10.3.

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
- Variant selector:
  - Color swatches (tappable, selected shows border)
  - Stock status per variant
- Description section (expandable)
- Product metadata: type, gender, season, material, care, origin, dimensions
- **Add to Wishlist** button (heart icon, toggles state)
- **Add to Cart** button (primary, full-width, black, disabled if out of stock)
- **TRY ON** button — opens TryOnModal (full-screen AI virtual try-on)
- Reviews section (ProductReviews component)
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
- Cart item list:
  - Product thumbnail image
  - Product name, selected color/variant
  - Unit price
  - Quantity controls: − / count / + buttons
  - Remove button
  - Per-item loading state when updating
- Order summary: Subtotal
- **Proceed to Checkout** button (black, full-width)
- Empty cart state: message + "Browse Products" link
- Pull-to-refresh

---

### 4.6 Checkout Screen — `/checkout/index`
**Elements:**
- Cart summary: items, quantities, prices, subtotal
- Shipping address section:
  - List of saved addresses (selectable)
  - Default address highlighted
  - **Add New Address** button
- Order summary: Subtotal, Shipping, Tax, **Total**
- **Place Order** button (black, full-width)
- Generates unique idempotency key to prevent duplicates
- Validation: requires address selection

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
- Order header: order number, order date
- Order items: thumbnail, product name, brand name, color/size, quantity × price, item total
- Shipping address
- Order summary: Subtotal, Tax, Shipping, Discount, **Total**
- Status timeline:
  ```
  ● Pending → ● Confirmed → ● Processing → ● Shipped → ● Delivered
  ```
- Status history log: each transition with timestamp and notes

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
- **Product Tagging**: toggle product chips from selected brand
- **Post** button (black, full-width)

**Access:** Brand owners only (admin cannot create posts)

#### 4.8c Post Detail — `/feed/[postId]`
**Elements:**
- Back button
- Post content (brand header, images, caption, tagged products)
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
**Elements:**
- Responsive grid (2-3 columns)
- Product cards: image, name, price, remove button
- Tappable → product detail
- Empty state: message + "Browse Products" link
- Sign-in prompt for guests
- Pull-to-refresh

---

### 4.10 Profile Tab — `/(tabs)/profile`

**Guest state:**
- Person icon placeholder (square)
- "Welcome to Local Brands" heading
- **Sign In** button (black) → `/auth/login`
- **Create Account** button (outlined) → `/auth/register`

**Authenticated state:**
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
- **Account:** Change Password link, Privacy Policy link, Terms of Service link
- **Logout** button
- **Delete Account** button (red, shows alert)

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
  → Tap "Add to Cart" or access protected feature
    → Redirected to Login
      → Register (or) Login
        → Return to previous action
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
- [x] Guest login (browse without account)
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
- [x] Update item quantity (increment/decrement)
- [x] Remove individual items
- [x] Cart total calculation
- [x] Navigate to checkout

### Checkout & Orders
- [x] Checkout with address selection
- [x] Order placement with idempotency key
- [x] Order confirmation screen
- [x] Order list (my orders)
- [x] Order detail with item breakdown
- [x] Order status timeline visualization
- [x] Order status history audit trail
- [x] Status progression: Pending → Confirmed → Processing → Shipped → Delivered
- [x] Order cancellation
- [x] Admin order status updates

### Wishlist
- [x] Toggle products in/out of wishlist
- [x] Wishlist grid view (dedicated tab)
- [x] Wishlist count in dashboard stats

### Reviews
- [x] View product reviews (star rating, comment, verified badge)
- [x] Review photo upload
- [x] Submit review (rating + comment + photos)
- [x] "Can review" check (only if user ordered the product)
- [x] Admin review moderation (approve/reject queue)
- [x] Verified purchase badge

### User Profile
- [x] Profile tab (6th bottom tab)
- [x] Edit profile (name, phone, DOB, avatar)
- [x] Avatar upload with Cloudinary
- [x] Address management (CRUD + set default)
- [x] Settings page with notification toggles
- [x] Logout

### Admin Features
- [x] System-wide dashboard with stats
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
- [ ] **[TODO]** Visual product tagging on post images (tap-to-tag pins on image, product popup on tap) — see §10.1
- [ ] **[TODO]** Brand posts tab on Brand Detail page — see §10.3

### AI & Media
- [x] AI virtual try-on (camera/gallery → Cloudinary → backend job → polling → result)
- [x] Image upload via Cloudinary with compression and progress tracking
- [x] Multi-image upload per product variant (1-5 images)

### Personalization
- [x] "For You" personalized product section on Home feed (based on wishlist saves + order history)
- [ ] **[TODO — Later]** Search by image — see §10.4

### UX Features
- [x] Dark mode / Light mode support
- [x] Responsive design (mobile + tablet)
- [x] Pull-to-refresh on all list screens
- [x] Toast notifications (success, error, info)
- [x] Loading states and spinners
- [x] Empty states with contextual messages
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
| **System Analytics** | Admin dashboard quick action | "Coming soon" |
| **Admin Settings** | Admin dashboard quick action | "Coming soon" |
| **Order Management** (brand owner) | Brand owner dashboard | "Coming soon" |
| **Brand Analytics** | Brand owner dashboard | "Coming soon" |
| **Privacy Policy** | Settings screen | Shows "coming soon" alert |
| **Terms of Service** | Settings screen | Shows "coming soon" alert |
| **Delete Account** | Settings screen | Shows alert with contact info (not automated) |
| **Payment processing** | Checkout | No payment gateway — order is placed directly |
| **Notification toggles** | Settings screen | UI toggles exist but not connected to backend |
| **Tracking number** | Order entity | Field exists in backend but no UI for entering/displaying |

---

## 10. To Be Done

Features planned but not yet implemented. These should be designed and built.

### 10.1 Visual Product Tagging in Posts — `[TODO]`

**Goal:** Allow brand owners to tag specific products directly on post images (Instagram-style tap-to-tag), making products discoverable directly from the feed image.

**Current state:** Basic product tagging exists — brand owners can select product chips when creating a post, and tagged products appear as a horizontal scroll below the post caption. However there is no visual/spatial tagging on the image itself.

**Planned UX:**
- In post creation (`/feed/create`): after uploading images, tap anywhere on the image to place a tag pin → shows a product picker modal → selected product is pinned at that coordinate
- In feed and post detail: tappable dot pins on images → tap reveals a product card popup (image, name, price, "View Product" CTA → navigates to product detail)
- Tag pins should be subtle (small dot or icon with brand name) so they don't overwhelm the image
- Multiple products can be tagged per image
- Pin coordinates stored as `{ x: %, y: %, productId }` relative to image dimensions

**Data changes needed:**
- `FeedPost.taggedProducts` moves from a flat array of product IDs to a structured array: `{ productId, x, y, imageIndex }[]`
- Backward-compatible: posts with no coordinate data still show tagged products in the chip list below

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

### 10.3 Brand Posts on Brand Detail Page — `[TODO]`

**Goal:** Show the brand's social feed posts directly on the brand detail screen so users can explore a brand's content without leaving the brand context.

**Current state:** The brand detail page (`/brands/[brandId]/index`) only shows the brand's products. There is no way to view a brand's posts from within the brand profile.

**Planned UX:**
- Add a tab row to the brand detail screen: **"Products"** | **"Posts"**
- "Products" tab — existing product list (no change)
- "Posts" tab — vertically scrollable list of the brand's feed posts
  - Same post card design as the Feed tab: images carousel, caption, likes/comments counts, tagged products
  - Tapping a post → navigates to `/feed/[postId]`
  - Empty state: "No posts yet" if brand has not posted
  - Infinite scroll (same pattern as the main feed)
- Follow/unfollow button remains in the brand header, visible on both tabs

**Data:** Uses existing `GET /feed?brandId=:id` endpoint (or add dedicated `GET /brands/:id/posts` for clarity).

---

### 10.4 Search by Image — `[TODO — Later]`

**Goal:** Allow users to take or upload a photo of any clothing item and find visually similar products in the catalog.

**Priority:** Low — deferred to a later phase.

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
Pending → Confirmed → Processing → Shipped → Delivered / Cancelled / Returned

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
