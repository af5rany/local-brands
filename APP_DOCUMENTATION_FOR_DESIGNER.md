# Local Brands — App Documentation for UI/UX Designer

> **Platform:** Mobile-first (iOS & Android) with web support
> **Framework:** React Native / Expo
> **Date:** March 18, 2026 (updated March 18, 2026)

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

### Bottom Tab Bar (5 tabs)
```
┌──────────────────────────────────────────────────────────────┐
│                      App Content Area                        │
├──────────┬──────────┬──────────┬──────────┬──────────────────┤
│ 🏠 Home  │ 🏪 Shop  │ ♡ Wishlist│ 🧾 Orders│ 👤 Profile      │
└──────────┴──────────┴──────────┴──────────┴──────────────────┘
```

- **Home tab** — Role-based landing; shows Customer dashboard (with search) or redirects based on role
- **Shop tab** — Full product & brand browsing with search, filters, sort, and pagination
- **Wishlist tab** — Saved products grid; shows sign-in prompt for guests
- **Orders tab** — Order history list; shows sign-in prompt for guests
- **Profile tab** — User profile, menu navigation, and logout; shows sign-in/register for guests

### Header (shown on Home and Shop screens)
- Logo (tappable → home)
- Time-based greeting ("Good morning", "Good afternoon", "Good evening")
- Search bar with autocomplete suggestions (products & brands)
- Dashboard toggle button (speedometer icon) — navigates to `/manage` (management dashboard); only shown for admin/brand owner
- Cart button (bag icon) with navigation to cart
- Profile avatar button (circular, shows user initial with gradient ring) → navigates to profile

### Route Structure (Expo Router — file-based)
```
/                         → Root redirect
/(tabs)/                  → Tab navigation container
  ├── index               → Home (role-based dashboard)
  ├── shop                → Shop (product & brand browsing)
  ├── wishlist            → Wishlist tab
  ├── orders              → Orders tab
  └── profile             → Profile tab

/manage/
  └── index               → Management dashboard (admin & brand owner only)

/auth/
  ├── login               → Login screen
  ├── register            → Registration screen
  ├── forgot-password     → Forgot password screen
  ├── reset-password      → Reset password screen
  └── verify-email        → Email verification (not implemented yet)

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
  ├── draft_[productId]   → Draft product view
  ├── create/
  │   └── [brandId]       → Create product for brand
  └── edit/
      └── [productId]     → Edit product

/cart/
  └── index               → Shopping cart ("My Collection")

/checkout/
  └── index               → Checkout with address selection

/orders/
  ├── index               → My orders list
  └── [orderId]           → Order detail with status timeline

/wishlist/
  └── index               → Saved products grid

/profile/
  ├── index               → Profile overview with menu
  ├── edit                → Edit profile form
  ├── settings            → App settings & preferences
  └── addresses/
      ├── index           → Saved addresses list
      ├── new             → Add new address form
      └── [id]            → Edit address

/users/
  └── index               → User management (admin only)
```

### Protected Routes (require authentication)
`cart`, `checkout`, `orders`, `wishlist`, `profile`, `users`

Unauthenticated users attempting to access these are redirected to `/auth/login`.

---

## 4. Screen-by-Screen Breakdown

### 4.1 Home Screen — `/(tabs)/index`

The home screen renders the Customer/Guest browsing view by default. Admin and brand owner dashboards have moved to the dedicated `/manage` screen.

#### 4.1a Customer/Guest View
**Layout:**
- Header (greeting, search, cart, avatar)
- Tab switcher: "Products" | "Brands"
- Filter chips bar (horizontal scroll showing active filters with clear buttons)
- Content grid (2-column responsive)
- Pagination controls
- Floating action button (FAB) for wishlist access

**Products Tab:**
- 2-column grid of product cards (RecommendationCard)
- Each card shows: product image, wishlist heart toggle, discount badge, brand name, product name, star rating, current price / strikethrough original price, "Add to Cart" button
- Filter panel (bottom sheet modal): Sort (Newest/Oldest), Category multi-select chips, Brand searchable checklist
- Pagination: Previous/Next arrows + page numbers with ellipsis

**Brands Tab:**
- 2-column grid of brand cards
- Each card shows: circular logo, brand name, location (on medium size)
- Same pagination as products

**Data fetched:** Filter options (categories, product types), featured brands (paginated, 12/page), new arrivals (paginated, 12/page), wishlist items

---

### 4.1b Shop Screen — `/(tabs)/shop`

Dedicated shopping tab with the same product/brand browsing experience as the Home screen customer view, but accessible to all users directly via the bottom tab bar.

**Layout:**
- Header (greeting, search, cart, avatar)
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

Each QuickActionCard has: colored icon, title, description, chevron arrow, swipeable "Go" action

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
- **Sign In** button (primary, full-width)
- **Continue as Guest** button (secondary/outlined)
- Footer: "Don't have an account? **Register**" link

**Behaviors:** Separate loading states for normal login and guest login. Successful login stores JWT and navigates to home. Guest login creates a temporary account.

#### 4.2b Register — `/auth/register`
**Elements:**
- Back navigation
- Avatar upload section (circular image area, tappable to open image picker)
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
- **Register** button (primary, full-width)
- Footer: "Already have an account? **Sign In**" link

**Behaviors:** Form validation with error messages per field. Avatar is uploaded to Cloudinary before form submission.

#### 4.2c Forgot Password — `/auth/forgot-password`
**Elements:**
- Back button
- Heading text explaining the process
- Email input field
- **Send Reset Link** button
- Success/error feedback messages via alerts

#### 4.2d Reset Password — `/auth/reset-password`
**Elements:**
- New password input with show/hide toggle
- Confirm password input with show/hide toggle
- **Reset Password** button
- States: idle → loading → success (shows success screen with "Go to Login" button) / error

---

### 4.3 Brand Screens

#### 4.3a Brands List — `/brands/index`
**Elements:**
- Search bar with autocomplete
- Filter button (opens filter modals)
  - Filters: location, owner ID (admin only), status (admin only)
- Sort button (opens sort modal)
  - Options: name, created date, updated date, location, product count
- Clear filters button (appears when filters active)
- Brand cards list (vertical scroll):
  - Logo (circular, placeholder if missing)
  - Brand name
  - Status badge (color-coded: Active=green, Suspended=red, Archived=grey, Draft=yellow)
  - Description (2 lines, truncated)
  - Location
  - Product count
  - Created date
  - Delete button (for admin/owner — shows confirmation alert)
- "Load More" button for pagination
- Create new brand button (admin only, typically in header)
- Pull-to-refresh

#### 4.3b Create Brand — `/brands/create`
**Elements:**
- Back button in header
- Logo upload section:
  - Upload area (dashed border, tappable)
  - Shows preview with upload progress
  - Required field
- Form card:
  - Brand name (required)
  - Description (required, multiline)
  - Location (required)
  - Owner dropdown (selects from users list, fetched from API — displays user name + email for clarity)
- **Publish Brand** button (gradient styled)

#### 4.3c Brand Selection — `/brands/select`
**Purpose:** For brand owners who manage multiple brands — they pick which brand to work on.

**Elements:**
- Header with back button
- List of user's brands (fetched from `/brands/my-brands`)
- Brand cards showing: logo, name, description, product count, location
- Tapping a card sets it as the selected brand in BrandContext and navigates to brand detail/products
- Empty state: "No Brands Found" message

#### 4.3d Brand Detail — `/brands/[brandId]/index`
**Elements:**
- Back button
- Brand header section:
  - Logo (large)
  - Brand name
  - Status badge with icon (Active ✓, Draft 📄, Suspended 🚫, Archived 📦)
  - Status change buttons (for owner/admin) — tappable status chips to change brand status
  - Description
  - Location
- Action buttons (for owner/admin):
  - Edit brand
  - Delete brand (with confirmation alert)
  - Add product
- Products section:
  - Search bar within brand context
  - Filter panel: product type, gender, season, price range, status
  - Sort options: newest, oldest, price low/high, name A-Z/Z-A, brand name, popularity
  - Active filter count badge
  - Product list using ProductManagementCard components (for owner/admin) or ProductCard (for browsing)
  - Load more pagination
  - Pull-to-refresh

#### 4.3e Edit Brand — `/brands/[brandId]/edit`
**Elements:**
- Back button
- Logo upload with current logo preview (edit overlay icon)
- Form fields: brand name, description, location
- Status selector: visual chips for Active, Suspended, Archived, Draft
- **Save Changes** button
- Form validation

#### 4.3f Brand Products — `/brands/[brandId]/products`
**Elements:**
- Paginated product list for a specific brand (10/page)
- Filter and sort capabilities
- Product management cards

---

### 4.4 Product Screens

#### 4.4a Products List — `/products/index`
**Elements:**
- Search bar
- Filter button → filter modals (gender, product type)
- Sort button → sort modal (name, price, created date, updated date, brand, popularity)
- Clear filters button
- Product cards grid
- Pagination
- Pull-to-refresh

#### 4.4b Product Detail — `/products/[productId]`
**Elements:**
- Back button
- Image gallery section:
  - Main large product image
  - Thumbnail row below (scrollable, tappable to change main image)
  - Images change based on selected variant
- Product info section:
  - Brand name (tappable → brand detail)
  - Product name
  - Price display: current price (green) / original price (strikethrough, grey)
  - Discount percentage badge (if on sale)
  - Star rating display
- Variant selector:
  - Color circles (tappable, shows border when selected)
  - Each color changes the image gallery
  - Stock status per variant
- Description section (expandable/collapsible text)
- Product metadata: type, gender, season, material, care instructions, origin, dimensions
- **Add to Wishlist** button (heart icon, toggles state)
- **Add to Cart** button (primary, full-width, shows loading state)
  - Disabled if out of stock
- Reviews section (ProductReviews component):
  - Review list: user name, date, star rating (filled/empty stars), verified purchase badge, comment text
  - Write review section (if user has ordered this product):
    - Interactive 5-star rating selector
    - Comment textarea
    - Submit button with loading state
- Fade-in and scale animations on load

#### 4.4c Create Product — `/products/create/[brandId]`
**Elements:**
- Back button
- Form sections:
  1. **Basic Info:**
     - Product name (required)
     - Description (multiline)
     - Price (required, numeric)
     - Sale price (numeric)
  2. **Classification:**
     - Product type dropdown (dynamic options from API: Shoes, Hoodies, Shirts, etc.)
     - Subcategory dropdown (dynamic)
     - Gender dropdown (Men, Women, Unisex, Kids)
     - Season dropdown (Spring, Summer, Fall, Winter, All Season)
  3. **Tags:**
     - Text input + "Add" button
     - Tag chips with remove (×) button
  4. **Variants section** (repeatable):
     - Color selector:
       - Preset color palette grid
       - Or custom color input
     - Stock quantity input (numeric)
     - Image upload area (multi-image, 1-5 per variant):
       - Each image shows upload progress (compressing → uploading → success/error)
       - Images are uploaded to Cloudinary
     - Add another variant button
     - Remove variant button
  5. **Status:** Draft or Published
  6. **Featured toggle**
- **Create Product** button

#### 4.4d Edit Product — `/products/edit/[productId]`
Similar to create product, pre-filled with existing product data. Can update all fields including adding/removing variants.

#### 4.4e Draft Product — `/products/draft_[productId]`
View for draft (unpublished) products, likely with "Publish" action.

---

### 4.5 Cart Screen — `/cart/index`
**Title:** "My Collection"

**Elements:**
- Cart item list (vertical scroll):
  - Product thumbnail image
  - Product name
  - Selected color/variant info
  - Unit price
  - Quantity controls: minus (−) button, quantity number, plus (+) button
  - Remove button (trash/× icon)
  - Per-item loading state when updating quantity
- Order summary section:
  - Subtotal calculation
- **Proceed to Checkout** button (full-width, primary)
- Empty cart state: illustration/message + "Browse Products" link
- Pull-to-refresh

---

### 4.6 Checkout Screen — `/checkout/index`
**Elements:**
- Cart summary section:
  - List of items with names, quantities, and prices
  - Subtotal
- Shipping address section:
  - List of saved addresses (radio-button style selection)
  - Default address highlighted with badge
  - **Add New Address** button (navigates to `/profile/addresses/new`)
- Order summary:
  - Subtotal
  - Shipping cost
  - Tax
  - **Total** (bold, prominent)
- **Place Order** button (primary, full-width)
  - Generates unique idempotency key (UUID) to prevent duplicate orders
- Validation: requires address selection before allowing order placement

---

### 4.7 Order Screens

#### 4.7a Orders List — `/orders/index`
**Elements:**
- Order cards list (vertical scroll):
  - Order number (ID)
  - Created date
  - Status badge (color-coded):
    - Pending → Amber/Yellow
    - Paid → Blue
    - Shipped → Purple
    - Delivered → Green
    - Cancelled → Red
  - Total amount
  - Tappable → navigates to order detail
- Pull-to-refresh
- Empty state for no orders

#### 4.7b Order Detail — `/orders/[orderId]`
**Elements:**
- Back button
- Order header: order number, order date
- Order items list:
  - Product image thumbnail
  - Product name, brand name
  - Selected color/size
  - Quantity × unit price
  - Item total
- Shipping address display:
  - Full name, address lines, city, state, zip, country, phone
- Order summary:
  - Subtotal
  - Tax amount
  - Shipping cost
  - Discount (if any)
  - **Total** (bold)
- Status timeline (visual progression):
  ```
  ● Pending → ● Confirmed → ● Processing → ● Shipped → ● Delivered
  ```
  - Completed steps filled, future steps outline
- Status history log:
  - Each entry: old status → new status, timestamp, notes (if any)
  - Chronological audit trail

---

### 4.8 Wishlist Screen — `/wishlist/index`
**Elements:**
- Responsive grid (2-3 columns based on screen width)
- Product cards:
  - Product image
  - Product name
  - Price
  - Remove from wishlist button (heart icon or × button)
  - Tappable → product detail
- Empty state: message + "Browse Products" link
- Pull-to-refresh

---

### 4.9 Profile Screens

#### 4.9a Profile Tab — `/(tabs)/profile`

The Profile is now a dedicated bottom tab (replacing the old `/profile/index` route as the primary entry point).

**Guest state:**
- Person icon placeholder
- "Welcome to Local Brands" heading
- Sign In button (primary) → `/auth/login`
- Create Account button (outlined) → `/auth/register`

**Authenticated state:**
- Profile header card:
  - Avatar (circular — shows image if uploaded, or initials on primary-soft background)
  - Full name
  - Email
  - Role badge (e.g. "Admin", "BrandOwner", "Customer")
- Menu list:
  - **Management Dashboard** (admin/brand owner only) → `/manage` — sets management mode active
  - **Edit Profile** → `/profile/edit`
  - **Shipping Addresses** → `/profile/addresses`
  - **Settings** → `/profile/settings`
- **Log Out** button (danger-soft background, red text/icon)
- Version number display at bottom
- Pull-to-refresh (refreshes user data)

> Note: "My Orders" and "Wishlist" are no longer in the profile menu — they are dedicated bottom tabs.

#### 4.9a-2 Profile Overview (legacy route) — `/profile/index`
Still accessible for deep links. Content may overlap with the Profile tab.

#### 4.9b Edit Profile — `/profile/edit`
**Elements:**
- Back button
- Avatar section:
  - Current avatar preview (circular, large)
  - "Change Photo" tappable overlay
  - Upload progress indicator
- Form fields:
  - Name (editable)
  - Email (read-only, displayed but not editable)
  - Phone number
  - Date of birth (date picker)
- **Save Changes** button
- Form validation

#### 4.9c Settings — `/profile/settings`
**Elements:**
- **Notifications section:**
  - Push Notifications (toggle switch)
  - Email Notifications (toggle switch)
  - Order Updates (toggle switch)
- **Account section:**
  - Change Password (link → navigates to forgot-password flow)
  - Privacy Policy (link — shows "coming soon" alert)
  - Terms of Service (link — shows "coming soon" alert)
- **Logout** button
- **Delete Account** button (red, shows alert with contact information)

#### 4.9d Addresses List — `/profile/addresses/index`
**Elements:**
- Address cards list:
  - Full name
  - Address lines (line 1, line 2 if exists)
  - City, State, ZIP
  - Country
  - Phone (if exists)
  - "Default" badge (highlighted if default address)
  - **Edit** button → `/profile/addresses/[id]`
  - **Delete** button (with confirmation alert)
  - **Set as Default** button (if not already default)
- **Add New Address** button (prominent, at top or bottom)
- Pull-to-refresh

#### 4.9e Add Address — `/profile/addresses/new`
**Elements:**
- Back button
- Form fields:
  - Full name (required)
  - Address line 1 (required)
  - Address line 2 (optional)
  - City (required)
  - State (required)
  - ZIP code (required)
  - Country (required)
  - Phone (optional)
  - Address type: Shipping / Billing (selector)
  - Set as default (toggle switch)
- **Save Address** button
- Required field indicators (asterisks or similar)

#### 4.9f Edit Address — `/profile/addresses/[id]`
Same as Add Address form, pre-filled with existing data. Also includes a **Delete** button.

---

### 4.10 User Management — `/users/index` (Admin Only)
**Elements:**
- Search bar
- Filter buttons:
  - Role filter modal (Customer, Brand Owner, Admin, Guest)
  - Status filter modal
- Sort options
- User list:
  - User cards showing: avatar/initial, name, email, role badge, status badge
  - Tappable for actions
- Role assignment modal (change user's role)
- Brand assignment modal (assign user to a brand)
- Pull-to-refresh

---

### 4.11 Error / Not Found Screen
- Displayed for invalid routes
- "Page not found" message
- Navigation link back to home

---

## 5. Reusable Components

### Product Display Cards

| Component | Use Case | Layout | Key Features |
|-----------|----------|--------|-------------|
| **RecommendationCard** | Product grids on home page | Vertical card, 2-column grid | Image (150px mobile/190px tablet), wishlist heart, discount badge, brand name, product name (2-line), star rating, price, add-to-cart button |
| **ProductCard** | Detailed browse/management | Full-width card | Image with overlays (type tag, discount, status badge, stock indicator, favorite, edit button), brand name, product name, price, gender, season, featured badge, color dots (up to 4), add-to-cart |
| **ProductManagementCard** | Brand owner product lists | Horizontal (thumbnail + info) | 64×64 thumbnail, product name (1-line), price/sale price, stock status, metadata (type, gender, season), color dots (up to 5), status badge, edit button |

### Filter Components

| Component | Purpose | Behavior |
|-----------|---------|----------|
| **FilterPanel** | Full-screen bottom sheet for filtering | Animated bottom sheet (drag to close/expand), sort toggle (Newest/Oldest), category multi-select chips, brand searchable list with checkboxes, "Apply" button with active filter count |
| **FilterChips** | Horizontal bar of active filters | Always-visible filter button with badge count, scrollable active filter tags with close (×) buttons, color-coded by type |
| **FilterModal** | Generic select modal | Single-select (radio) or multi-select (checkbox) modes, optional search, animated bottom sheet |

### Dashboard Components

| Component | Purpose | Features |
|-----------|---------|----------|
| **StatsCard** | Stat display | Large value, title, colored icon in tinted box, accent bottom border, normal/small sizes |
| **QuickActionCard** | Navigation action | Icon box, title, description, chevron, swipeable "Go" action |
| **BrandCard** | Brand display | Circular logo (small 80px / medium 100px), name, location |

### Data Display

| Component | Purpose | Features |
|-----------|---------|----------|
| **Pagination** | Page navigation | Prev/Next arrows, smart page numbers with ellipsis, active page highlight |
| **RecentOrderCard** | Order summary | Order ID, status badge (color-coded), total, item count, date, "View Details" link |
| **ProductReviews** | Review section | Review list (user, date, stars, verified badge, comment), write review form (star selector, comment, submit) |

### Feedback & UI

| Component | Purpose | Features |
|-----------|---------|----------|
| **Toast** | Notification popups | Success (green), Error (red), Info (blue) types, auto-dismiss, slide animation, close button |
| **ImageUploadProgress** | Upload feedback | States: compressing (spinner), uploading (progress bar), success (checkmark), error (alert icon + message) |
| **Header** | Top navigation | Logo, greeting, search with autocomplete, dashboard toggle, cart button, avatar button |

---

## 6. Design System & Theming

### Color Palette — "Refined Commerce"
Warm, confident palette inspired by high-end retail (Farfetch, SSENSE) with local brand approachability.

#### Primary Colors
| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `primary` | `#4338CA` (Deep Indigo) | `#818CF8` (Lighter Indigo) | Buttons, active states, links |
| `accent` | `#F59E0B` (Warm Amber) | `#FBBF24` (Brighter Amber) | Highlights, featured badges |

#### Semantic Colors
| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `success` | `#059669` (Emerald) | `#34D399` | Confirmations, active status, current price |
| `danger` | `#E11D48` (Rose) | `#FB7185` | Errors, delete, wishlist heart, discount badge |
| `warning` | `#D97706` (Amber) | `#FBBF24` | Pending states, draft status |
| `info` | `#0284C7` (Sky) | `#38BDF8` | Info toasts, processing status |

#### Background & Surface
| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `background` | `#FAFAF9` (Warm off-white) | `#1C1917` | App background |
| `surface` | `#FFFFFF` | `#292524` | Cards, modals |
| `surfaceRaised` | `#F5F5F4` | `#44403C` | Inputs, chips |

#### Text Colors
| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `text` | `#1C1917` (Stone 900) | `#FAFAF9` | Primary text |
| `textSecondary` | `#57534E` (Stone 600) | `#A8A29E` | Secondary labels |
| `textTertiary` | `#A8A29E` (Stone 400) | `#78716C` | Muted/placeholder text |

#### Border
| Token | Light Mode | Dark Mode |
|-------|------------|-----------|
| `border` | `#E7E5E4` (Stone 200) | `#44403C` |
| `borderFocus` | `#4338CA` | `#818CF8` |

#### Component-Specific Tokens
| Token | Value | Usage |
|-------|-------|-------|
| `tabActive` / `tabInactive` | Primary / Tertiary | Bottom tab bar |
| `chipBackground` / `chipActiveBackground` | surfaceRaised / primary | Filter chips |
| `wishlistHeart` | `#E11D48` | Wishlist toggle |
| `discountBadge` | `#E11D48` | Discount percentage tags |
| `priceCurrent` | success color | Current/sale price |
| `priceOriginal` | tertiary text | Strikethrough original price |

### Soft Variants
Each semantic color has a "soft" variant for backgrounds:
- `primarySoft`, `accentSoft`, `successSoft`, `dangerSoft`, `warningSoft`, `infoSoft`

### Typography
- Font: SpaceMono-Regular (monospace, loaded as custom font)
- Text types: default, defaultSemiBold, title, subtitle, link
- Themed text component supports light/dark color overrides

### Responsive Breakpoints
- **Mobile:** default (< 768px width)
- **Tablet:** ≥ 768px width
- Components adapt: column counts, card sizes, image heights, grid layouts

### Animations & Interactions
- **Bottom sheets**: react-native-reanimated + gesture-handler (drag to dismiss, snap points)
- **Haptic feedback**: Tab bar buttons provide haptic feedback on press
- **Product detail**: Fade-in and scale animations on load
- **Search bar**: Animated border focus state
- **Swipeable cards**: QuickActionCards reveal "Go" action on swipe right
- **Toast notifications**: Slide-in/out with opacity fade

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
                → Order confirmation
                  → View in My Orders → Order Detail (track status)
```

### 7.3 Wishlist Flow
```
Shop tab → Browse products → Tap heart on product card
  → Item added to wishlist (toast confirmation)
    → Access wishlist via Wishlist tab (bottom bar) or FAB on home/shop
      → Tap product → Product Detail → Add to Cart
```

### 7.4 Brand Owner — Product Management
```
Profile tab → "Management Dashboard" (or speedometer icon in Header)
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
Profile tab → "Management Dashboard" (or speedometer icon in Header)
  → Management screen (/manage)
    → "User Management"
  → Users list (search, filter by role/status)
    → Assign role to user
    → Assign user to brand
```

### 7.6 Admin — Brand Management
```
Profile tab → "Management Dashboard" (or speedometer icon in Header)
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
          → Write comment
            → Submit review (goes to admin approval queue)
```

### 7.8 Password Reset Flow
```
Login → "Forgot Password?" link
  → Enter email → Send Reset Link
    → (Email received with token)
      → Reset Password screen (deep link with token)
        → Enter new password + confirm
          → Success → "Go to Login" → Login
```

### 7.9 Profile & Address Management
```
Home → Avatar button → Profile
  → Edit Profile (name, phone, DOB, avatar)
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
- [x] Guest-to-registered user conversion endpoint

### Product Catalog
- [x] Product listing with pagination
- [x] Product search with autocomplete (products & brands)
- [x] Multi-filter system: product type, gender, season, price range, brand, availability, status
- [x] Multi-sort: name, price, creation date, update date, brand name, popularity
- [x] Product detail with image gallery
- [x] Product variants (per-color stock, images, pricing override)
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
- [x] Batch brand import (API only)

### Shopping Cart
- [x] Add products to cart with variant selection
- [x] Update item quantity (increment/decrement)
- [x] Remove individual items
- [x] Clear entire cart
- [x] Cart total calculation
- [x] Navigate to checkout

### Checkout & Orders
- [x] Checkout with address selection
- [x] Order placement with idempotency key (prevents duplicates)
- [x] Order list (my orders)
- [x] Order detail with item breakdown
- [x] Order status timeline visualization
- [x] Order status history audit trail
- [x] Status progression: Pending → Confirmed → Processing → Shipped → Delivered
- [x] Order cancellation
- [x] Admin order status updates

### Wishlist
- [x] Toggle products in/out of wishlist
- [x] Wishlist grid view
- [x] Wishlist FAB on home screen
- [x] Wishlist count in dashboard stats

### Reviews
- [x] View product reviews (star rating, comment, verified badge)
- [x] Submit review (rating + comment)
- [x] "Can review" check (only if user ordered the product)
- [x] Admin review moderation (approve/reject queue)
- [x] Verified purchase badge

### User Profile
- [x] Profile overview with menu navigation
- [x] Edit profile (name, phone, DOB, avatar)
- [x] Avatar upload with Cloudinary
- [x] Address management (CRUD + set default)
- [x] Address types (Shipping, Billing, Both)
- [x] Settings page with notification toggles
- [x] Logout

### Admin Features
- [x] System-wide dashboard with stats (brands, products, users)
- [x] User management (search, filter, role assignment, brand assignment)
- [x] Brand management (all brands, create, edit, delete, status changes)
- [x] Review moderation queue
- [x] Batch import (brands, products)

### Media & Uploads
- [x] Image upload via Cloudinary
- [x] Image compression before upload (resize to 1200px, 0.7 quality)
- [x] Upload progress tracking (compressing → uploading % → success/error)
- [x] Multi-image upload per product variant (1-5 images)

### UX Features
- [x] Dark mode / Light mode support
- [x] Responsive design (mobile + tablet layouts)
- [x] Pull-to-refresh on all list screens
- [x] Toast notifications (success, error, info)
- [x] Loading states and spinners
- [x] Empty states with contextual messages
- [x] Error boundary (global error catching)
- [x] Animated bottom sheet modals
- [x] Haptic feedback on tab bar
- [x] Search with debounced input
- [x] Time-based greeting in header
- [x] 5-tab bottom navigation (Home, Shop, Wishlist, Orders, Profile)
- [x] Guest-friendly tabs with sign-in prompts (Wishlist, Orders, Profile)
- [x] Dedicated management screen for admin/brand owner (`/manage`)
- [x] Management Dashboard entry point in Profile tab menu

---

## 9. Placeholder / Coming Soon Features

These are referenced in the UI but not yet implemented:

| Feature | Location | Current State |
|---------|----------|---------------|
| **System Analytics** | Admin dashboard quick action | "Coming soon" |
| **Admin Settings** | Admin dashboard quick action | "Coming soon" |
| **Order Management** (brand owner) | Brand owner dashboard | "Coming soon" |
| **Brand Analytics** | Brand owner dashboard | "Coming soon" |
| **Email Verification** | `/auth/verify-email` | File exists but code is commented out |
| **Privacy Policy** | Settings screen | Shows "coming soon" alert |
| **Terms of Service** | Settings screen | Shows "coming soon" alert |
| **Delete Account** | Settings screen | Shows alert with contact info (not automated) |
| **Payment processing** | Checkout | No payment gateway integration — order is placed directly |
| **Notification toggles** | Settings screen | UI toggles exist but not connected to backend |
| **Tracking number** | Order entity | Field exists in backend but no UI for entering/displaying |

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
Pending, Approved, Rejected, Suspended, Inactive, Blocked, Active

### Address Types
Shipping, Billing, Both
