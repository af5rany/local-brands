# Frontend Specifications - Local Brands Mobile

The frontend is a high-performance, cross-platform mobile application built with **React Native** (Expo), utilizing **Expo Router** for type-safe, file-based navigation.

## Core Technologies
- **Framework**: React Native (via Expo 54+)
- **Navigation**: Expo Router (Typed Routes)
- **State Management**: React Context (Auth, Brand, Cart, Toast)
- **Networking**: Native `fetch` and Axios with Bearer token attachment from `AuthContext`.
- **Styling**: React Native Stylesheets with **Dynamic Theming** support (light/dark mode).
- **Media**: Cloudinary integration via `useCloudinaryUpload` hook with client-side compression.

---

## Design System

### B&W Minimalist (current as of April 2026)

The entire UI follows a strict black-and-white minimalist aesthetic inspired by high-end fashion retail (Celine, SSENSE):

| Rule | Value |
|------|-------|
| **Primary / CTA** | `#000000` black |
| **Background** | `#FFFFFF` white |
| **Surface / Cards** | `#FFFFFF` with `#E5E5E5` border |
| **Raised surfaces / Inputs** | `#F5F5F5` |
| **Text primary** | `#1A1A1A` |
| **Text secondary** | `#666666` |
| **Text tertiary** | `#999999` |
| **Danger / Error / Sale price** | `#C41E3A` deep red — only for errors and delete actions |
| **Border radius** | `0` everywhere — sharp edges on all cards, buttons, badges, avatars, modals |
| **Shadows** | None — no `shadowColor`, `shadowOpacity`, `shadowRadius`, `elevation` anywhere |
| **CTA text** | Uppercase with `letterSpacing` (e.g. `SHOP NOW`, `ADD TO CART`) |
| **Gradients** | None — no gradients or colored backgrounds |

Theme values are defined in `frontend/constants/Colors.ts` and accessed via `useThemeColors()` / `useThemeColor()` hooks throughout all components.

---

## App Structure & Navigation

### 1. Root Layout & Contexts
- `_layout.tsx`: Wraps the app in `AuthProvider`, `BrandProvider`, and `ToastProvider`. Handles initial session restoration, Expo push notification permission request + token registration with backend, and deep-link routing from notification taps (order and return deep links).
  - `PROTECTED_SEGMENTS` — routes requiring any token (unauthenticated → `/auth/login`).
  - `REGISTERED_ONLY_SEGMENTS` (`wishlist`, `manage`, `users`, `referral`, `returns`) — routes blocked for guest sessions (guest token → `/auth/register`).

### 2. Main Tabs (`(tabs)/`)
Six bottom tabs (with label-less icons):

| Tab | File | Role |
|-----|------|------|
| **Home** | `index.tsx` | Customer/guest product & brand discovery; role-based dashboards for admin/brand owner |
| **Shop** | `shop.tsx` | Full product & brand browsing with search, filters, sort, and pagination |
| **Feed** | `feed.tsx` | Social feed of posts from brands; brand owners see FAB to create posts |
| **Wishlist** | `wishlist.tsx` | Saved products grid; shows sign-in prompt for guests |
| **Brands** | `brands.tsx` | Brand discovery and listing |
| **Profile** | `profile.tsx` | User profile overview with menu navigation; guest prompts for sign-in |

### 3. Authentication (`auth/`)
- `login.tsx` — Email/password login with JWT. "Continue as Guest" button creates guest session (30-min token).
- `register.tsx` — Multi-field registration with avatar upload. **If guest token is present** (`isGuest=true`), submits to `POST /auth/convert-guest/:id` (same user ID → cart preserved) instead of `POST /auth/register`. On success, logs in and navigates to tabs.
- `forgot-password.tsx` — Password recovery via email.
- `reset-password.tsx` — Password reset with token; shows success screen on completion.

### 4. User Profile (`profile/`)
- `profile/edit.tsx` — Edit name, phone, DOB, avatar.
- `profile/settings.tsx` — Notification toggles, change password, privacy/terms, delete account.
- `profile/addresses/index.tsx` — Shipping address listing.
- `profile/addresses/new.tsx` — Add new address form.
- `profile/addresses/[id].tsx` — Edit existing address.

### 5. Brands (`brands/`)
- `brands/create.tsx` — Create new brand (admin only).
- `brands/select.tsx` — Multi-brand owner context switcher.
- `brands/[brandId]/index.tsx` — Brand detail with Products | Posts tab switcher. "Posts" tab shows a 2-column grid of brand feed posts; tap → `/feed/[postId]`.
- `brands/[brandId]/edit.tsx` — Edit brand identity & location.
- `brands/[brandId]/products.tsx` — Brand's product listing.
- `brands/[brandId]/dashboard.tsx` — Brand owner analytics dashboard (stats grid, quick actions, top products, recent orders, pending alerts, notify followers modal).
- `brands/[brandId]/promo-codes/index.tsx` — List all promo codes for brand (status badge, toggle active, delete).
- `brands/[brandId]/promo-codes/create.tsx` — Create promo code form (code + GENERATE button, type: percentage/fixed, value, min order amount, max discount, max uses, per-user limit, start/expiry dates, description, isActive switch).
- `brands/[brandId]/promo-codes/[promoId].tsx` — Edit promo code + usage stats grid (total uses, discount given, uses/max) + recent usage list.
- `brands/[brandId]/shipping/index.tsx` — Shipping zones list with expand/collapse to show rates; zone/rate delete actions; link to zone form.
- `brands/[brandId]/shipping/zone.tsx` — Dual-purpose: create zone (name + ISO country codes) OR add rate to zone (when `?zoneId=X` param present); method type selector (STANDARD/EXPRESS/OVERNIGHT/LOCAL_PICKUP).
- `brands/[brandId]/returns/index.tsx` — Brand owner return requests with horizontal status filter tabs (All / Requested / Approved / etc.).
- `brands/[brandId]/returns/[returnId].tsx` — Full admin view: status banner, customer info, return reason, customer photos, approve/reject (with notes input), mark received, process refund buttons.
- `brands/[brandId]/return-policy.tsx` — Return policy settings form (returnWindowDays, restockingFeePercent, conditions textarea, requiresImages switch, isActive switch).
- `brands/[brandId]/size-guides/index.tsx` — List/create/edit size guides (title, unit, headers, rows). Brand-level or product-level scope.
- `brands/[brandId]/email-campaigns/index.tsx` — Campaign list with status badges (DRAFT/SCHEDULED/SENDING/SENT/FAILED), sent count, send/delete actions.
- `brands/[brandId]/email-campaigns/create.tsx` — Compose form (subject, body textarea, preview text, schedule toggle + date picker), SAVE DRAFT / SEND NOW.
- `brands/[brandId]/email-campaigns/[campaignId].tsx` — Edit draft + stats (sent/recipient count) + SEND NOW / SCHEDULE / DELETE.
- `brands/[brandId]/bundles/index.tsx` — Bundle list with active toggle, edit link, delete.
- `brands/[brandId]/bundles/create.tsx` — Create form (name, discount type/value, min quantity, product multi-select, date range).
- `brands/[brandId]/bundles/[bundleId].tsx` — Edit bundle form.
- `brands/[brandId]/orders/index.tsx` — Brand owner order list: paginated orders with status badges, VIEW DETAILS navigation, and per-card fulfillment action button (CONFIRM ORDER / MARK PROCESSING / MARK AS SHIPPED with tracking modal / MARK DELIVERED). Optimistic status update; calls `PUT /orders/:id/fulfill`.

### 6. Products (`products/`)
- `products/index.tsx` — All products listing with advanced search, filters, pagination.
- `products/[productId].tsx` — Product detail: image gallery, variant color picker, pricing, stock status, reviews, try-on modal, admin controls.
- `products/create/[brandId].tsx` — Product creation with variants (color, images, stock), Cloudinary upload, status selection.
- `products/edit/[productId].tsx` — Full product edit with variant management.

### 7. Shopping Cart (`cart/`)
- `cart/index.tsx` — Cart with item listing, quantity adjustment, variant display, total calculation, checkout navigation.

### 8. Checkout (`checkout/`)
- `checkout/index.tsx` — Order placement with address selection, dynamic shipping rate picker, promo code apply/remove, idempotency key generation. Backend returns `Order[]` (one per brand); confirmation screen shows aggregated total + all order numbers.
- `checkout/confirmation.tsx` — Order confirmation screen shown after successful order placement. Accepts `orderCount` param to display multi-vendor summary.

### 9. Orders (`orders/`)
- `orders/index.tsx` — Order history listing with status badges.
- `orders/[orderId].tsx` — Order detail with item breakdown, shipping address (incl. `shippingCarrier` and `shippingMethodName` rows), price summary (incl. discount line if applicable), status timeline, and **REQUEST RETURN** button visible when status is DELIVERED.

### 9b. Returns (`returns/`)
- `returns/index.tsx` — Customer's return history list with status color badges.
- `returns/create.tsx` — Create return request form: loads order info from `?orderId` param, reason picker (dropdown), description textarea, submits `POST /returns`.
- `returns/[returnId].tsx` — Return detail: 5-step status timeline (REQUESTED → APPROVED → SHIPPED BACK → RECEIVED → REFUNDED), return reason/description, rejection notes card, ship-back action (text input for tracking number + submit button visible when status is APPROVED).

### 10. Feed (`feed/`)
- `feed/create.tsx` — Create a new feed post. Brand owners select which brand to post for, write a caption, upload images, and tag products from the selected brand.
- `feed/[postId].tsx` — Post detail screen with full comment list, like/comment actions, three-dot menu on own comments.

### 11. Admin (`users/`)
- `users/index.tsx` — Admin user management: listing, role assignment, brand association.

### 12. Notifications (`notifications/`)
- `notifications/index.tsx` — Notification list with unread indicators, mark-all-read.
- `notifications/settings.tsx` — Notification preference toggles: PUSH NOTIFICATIONS, EMAIL NOTIFICATIONS, ORDER UPDATES, PROMOTIONS & OFFERS. Saves to `PUT /users/notification-preferences`. Loads existing preferences from `user.notificationPreferences` on mount.

### 13. Referral (`referral/`)
- `referral/index.tsx` — Referral program screen with share code, copy button, and referral history list.

### 14. Info / Static Screens (`info/`)
- `info/about.tsx` — About the platform (stats, mission, values).
- `info/contact.tsx` — Contact channels, message form.
- `info/shipping.tsx` — Shipping policy cards.
- `info/returns.tsx` — Returns & refunds policy steps and conditions.
- `info/privacy.tsx` — Full privacy policy text.
- `info/terms.tsx` — Full terms of service text.

---

## Image Upload System (Cloudinary)

Centralized via `useCloudinaryUpload` hook:
1. **Selection**: `expo-image-picker` with multi-select support (up to 5 images per variant).
2. **Compression**: `expo-image-manipulator` resizes to max 1200px width, 0.8 quality.
3. **Upload**: POST to Cloudinary with progress tracking.
4. **Component**: `ImageUploadProgress` — progress bar overlay over thumbnail.

---

## State Management

| Context | Responsibility |
|---------|---------------|
| `AuthContext` | JWT storage (AsyncStorage), user state, token expiration polling (5-min interval), login/logout/refreshUser. Exposes `isGuest: boolean` derived from `user?.isGuest` — used by route gating, GuestBanner, profile tab, and wishlist/review UI. |
| `BrandContext` | Active brand selection for multi-brand owners, management mode toggle |
| `CartContext` | Cart item count tracking, `useCartCount` hook for header badge |
| `ToastContext` | Global toast notifications |

### Custom Hooks

| Hook | Responsibility |
|------|---------------|
| `useRecentlyViewed` | AsyncStorage-backed list of up to 15 viewed product IDs. `addProduct(id)` prepends + deduplicates. `clearProducts()` wipes storage. Used in product detail (write) and home screen (read + display). |
| `useInfiniteScroll` | Paginated list fetching with load-more trigger |
| `useCloudinaryUpload` | Image selection, compression, Cloudinary upload with progress |
| `useImageSearch` | Camera/gallery picker → compressed upload → `POST /image-search` → ranked product results |
| `useCartCount` | Subscribes to cart item count for header badge |

---

## Key Components

### Product Display Cards

| Component | Use Case | Key Features |
|-----------|----------|-------------|
| **RecommendationCard** | Product grids on home/shop | Image, wishlist heart, discount badge, brand name, product name, star rating, price, add-to-cart button |
| **ProductCard** | Browse/management grids | Image with overlays (type tag, discount, status badge, stock indicator, favorite, edit), brand name, price, color dots, add-to-cart |
| **ProductManagementCard** | Brand owner product lists | Thumbnail, product name, price/sale price, stock, color dots, status badge, edit button |

### Filter Components

| Component | Purpose |
|-----------|---------|
| **FilterPanel** | Full-screen animated bottom sheet for filtering (sort, categories, brands, price range) |
| **FilterChips** | Horizontal bar of active filters with clear (×) buttons |
| **FilterModal** | Generic select modal: single-select or multi-select, optional search |
| **SearchModal** | Full-screen search modal (slide-up animation), product grid with debounced search, caches trending products |

### UI Components

| Component | Purpose |
|-----------|---------|
| **Header** | Logo, greeting, search bar (opens SearchModal), cart badge, hamburger menu |
| **GuestBanner** | Yellow banner shown in cart and checkout for guest sessions. Text: "Shopping as guest. Create account to save your order." + "Sign Up" CTA → `/auth/register`. Hidden for registered users. |
| **Toast** | Success/Error/Info notifications — slide animation, auto-dismiss |
| **Pagination** | Prev/next arrows, smart page numbers with ellipsis |
| **AutoSwipeImages** | Auto-swiping image carousel (3s interval) with dot indicators |
| **BrandCard** | Brand logo, name, location |
| **StatsCard** | Stat value, title, icon, accent bar |
| **QuickActionCard** | Icon, title, description, chevron, swipeable "Go" action |
| **ImageUploadProgress** | Upload state overlay: compressing, uploading (% bar), success, error |
| **ProductReviews** | Review list + write review form (star selector, image upload, submit) |
| **TryOnModal** | Full-screen AI virtual try-on: camera/gallery picker, Cloudinary upload, job polling, before/after result view with download |
| **ScreenWrapper** | Standard screen wrapper with safe area and theme background |

---

## Feature Status

### Fully Working

| Feature | Description |
|---------|-------------|
| **Authentication** | Login, register, forgot/reset password, JWT token management, guest session (browse + cart + checkout), convert-guest flow in register screen |
| **Brand Management** | Full CRUD, multi-brand ownership, brand listing with search/sort/filter |
| **Product Management** | Full CRUD, variant system (size + per-size stock; color and images are product-level), status lifecycle, Cloudinary image upload |
| **Product Discovery** | Home dashboard, filter chips, pagination, debounced search |
| **Product Detail** | Image gallery, variant color picker, pricing with discount, stock status, reviews, TryOn modal |
| **Shopping Cart** | Add/remove items, quantity updates (optimistic), remove (optimistic with confirm), variant-aware, total calculation. GuestBanner shown for guest sessions. |
| **Wishlist** | Toggle add/remove (optimistic — instant remove from list, reverts on error), product card hearts, Brands sub-tab with followed brands list. Wishlist heart on product detail shows "Create account" alert for guests (no API call). |
| **Orders** | Order placement with idempotency, order history, order detail with status timeline |
| **Shipping Addresses** | Full CRUD, address selection in checkout, set default |
| **Checkout** | Address selection, order summary, idempotency key, confirmation screen. GuestBanner shown for guest sessions. Guests can complete full checkout. |
| **Product Reviews** | Review display, can-review check (verified purchase), star rating, photo upload, submission |
| **User Profile** | Personal details, avatar upload, shipping addresses, settings |
| **Settings** | Notification toggles, change password link, Privacy Policy → `/info/privacy`, Terms → `/info/terms`, delete account (calls `DELETE /users/me`) |
| **Brand Owner Orders** | `/brands/[brandId]/orders` — paginated order list with per-card fulfillment action buttons: CONFIRM ORDER → MARK PROCESSING → MARK AS SHIPPED (tracking number modal) → MARK DELIVERED; optimistic status update |
| **Search Autocomplete** | SearchModal suggestion rows while typing; backed by `GET /products/suggestions?q=` |
| **Recently Viewed** | `useRecentlyViewed` hook stores up to 15 product IDs in AsyncStorage; tracked on every product detail fetch; home screen shows real images + prices in horizontal scroll, hidden when empty, CLEAR wipes storage |
| **Admin Dashboard** | Platform-wide stats (brands, products, users, revenue) |
| **Brand Owner Dashboard** | Brand-specific stats, product/order management |
| **User Management** | Admin user listing, role management, brand assignment |
| **Image Upload** | Cloudinary pipeline with compression, progress tracking, multi-image per variant |
| **Dark Mode** | Full theme support via `useThemeColor` hook |
| **Feed** | Social feed with posts, like/comment/share, brand owner post creation, post detail with comment avatars |
| **Brand Follow** | Follow/unfollow brands, feed filters to show only followed brands' posts |
| **Header Side Menu** | Animated slide-in menu with navigation, cart badge, user actions |
| **Search Modal** | Full-page search with trending products cache and debounced live search |
| **Notifications** | Notification list with unread indicators and mark-all-read |
| **Notification Settings** | Per-preference toggles (push, email, order updates, promotions) saved to backend |
| **Referral** | Referral program with share code, copy, and referral history |
| **AI Try-On** | Virtual try-on via Cloudinary upload + backend job polling + before/after result display |
| **Search by Image** | Camera icon in SearchModal → `useImageSearch` hook → CLIP-based backend (`POST /image-search`) → results replace product grid. Also wired into `shop.tsx`. |
| **Info / Static Pages** | About, Contact, Shipping Policy, Returns Policy screens |
| **Order Confirmation** | Dedicated confirmation screen after order placement |
| **Promo Codes (brand owner)** | List, create, edit, toggle, delete promo codes; usage stats with recent usage list |
| **Promo Code at Checkout** | Apply/remove promo code field in checkout; discount line in order summary |
| **Shipping Zones (brand owner)** | Zones list with expandable rates; create zone; add rate to zone |
| **Dynamic Shipping at Checkout** | Fetches available rates by address country after address selection; rate picker replaces hardcoded options |
| **Returns (customer)** | Return request creation, return list, return detail with status timeline and ship-back action |
| **Returns (brand owner)** | Brand returns list with status filters, approve/reject/received/refund actions, customer photo review |
| **Return Policy (brand owner)** | Policy form — window, restocking fee, conditions, photo requirement toggle |
| **Order Detail — REQUEST RETURN** | Button visible on delivered orders → navigates to return create screen |
| **Order Detail — Carrier/Service** | `shippingCarrier` and `shippingMethodName` shown in logistics section |
| **Push Notifications** | Token registration on login (Expo push token → `POST /notifications/push-token`), deep-link routing from notification taps (order and return screens) |
| **Brand Dashboard** | Analytics with quick action cards (promo codes, shipping, returns, return policy), pending returns alert, notify followers modal |
| **Brand Notify Followers** | Compose modal in dashboard → sends title + message to all followers via backend (`POST /brands/:id/notifications/send`) |
| **Social Sharing** | Native `Share.share()` wired on product detail share button + share icon in post detail header |
| **Size Guide Modal** | Product detail fetches `/size-guides/product/:id?brandId=`; "SIZE GUIDE" pressable shows Modal with table (headers + rows) |
| **Stock Alerts (subscribe)** | "NOTIFY ME" button on out-of-stock products → `POST /notifications/stock-subscribe`; users auto-notified when stock restored |
| **Admin System Analytics** | AdminDashboard shows revenue cards, GMV bar chart (last 6 months), top brands list, orders-by-status — no longer "Coming Soon" |
| **Size Guide Management** | 3 brand owner screens under `/brands/[brandId]/size-guides/` — list, create, edit |
| **Email Campaigns** | 3 brand owner screens under `/brands/[brandId]/email-campaigns/` — list (with status + sent count), compose/create, edit + stats |
| **Product Bundles** | 3 brand owner screens under `/brands/[brandId]/bundles/` — list, create, edit; bundle discount applied at checkout |
| **Visual Pin Tags** | `feed/create.tsx`: location icon on product chip → tap image to place pin at x/y %. `feed/[postId].tsx`: absolute dot overlays, tap → product mini-card popup |
| **Order Tracking (live)** | TRACK SHIPMENT button calls `GET /orders/:id/tracking`; events timeline shown below financial summary |
| **Invoice PDF** | DOWNLOAD INVOICE generates HTML invoice (items, totals, shipping address) via `expo-print`, shares as PDF via `expo-sharing`; no backend call needed, uses already-loaded order state |
| **Search History** | `useSearchHistory` hook (AsyncStorage, max 8 queries, dedup, newest-first); chips shown in SearchModal when query is empty; saved on submit + suggestion tap; CLEAR wipes all history |
| **Product Q&A** | `ProductQA` component on product detail (below reviews); public read; authenticated customers post questions; brand owners see pending + reply inline; `PUT /products/questions/:id/answer` |
| **Conversion Funnel** | Brand dashboard Top Products row shows "N views → N carts → N sold" with stacked bar visualization; `cartAddCount` tracked server-side on new cart adds |
| **Multi-Vendor Checkout** | Backend returns `Order[]`; frontend aggregates all order numbers + total for confirmation screen |

### Developed But Not Working / Incomplete

None — all previously incomplete features are now working.

### Not Started

| Feature | Notes |
|---------|-------|
| **Payment Integration** | No payment gateway — checkout creates orders but no payment processing |
| **Email Verification** | No verify flow after registration — users auto-approved |

---

## Planned Features — To Be Done

### [DONE ✓] Visual Product Tagging on Post Images

**Status:** Fully implemented.
- `feed/create.tsx`: `taggedProducts` state is `{ productId, xPercent?, yPercent? }[]`. Location icon on product chip enters pin-placement mode; `handleImageTap()` calculates percentage from tap coordinates relative to `imageLayout`. Pins shown as dot overlays on image preview.
- `feed/[postId].tsx`: `activePinProductId` state; absolute-positioned dots at `xPercent/yPercent`%; tap shows product mini-card popup with name, price, "View" navigation.
- Backend stores `xPercent/yPercent` on `PostProduct` entity.

---

### [DONE ✓] Brand Posts Tab on Brand Detail

**Status:** Fully implemented in `brands/[brandId]/index.tsx`.

- Products | Posts tab switcher added below brand header (B&W underline style)
- "Posts" tab shows 2-column grid of brand's posts; tap → `/feed/[postId]`
- Empty state: "No posts yet"
- Data: `GET /feed?brandId=:brandId&page=:page&limit=10`

---

### [DONE ✓] "For You" Personalized Section on Home Screen

**Status: DONE ✓** — Implemented in `frontend/app/(tabs)/index.tsx`.

**What was built:**
- `forYouProducts` state added alongside existing product sections
- Fetched via `GET /products/for-you` with the user's auth token (parallel with statistics fetch)
- Section rendered after the Categories row, before Flash Deals — highest-value position for personalized content
- Only shown for logged-in users; hidden when empty
- Section header: "FOR YOU" (uppercase, matching section title style) + subtitle "Based on your saves & purchases"
- Same `renderProductCard` used as all other product sections

---

### [DONE ✓] Search by Image

**Status:** Fully implemented — camera icon in SearchModal → `useImageSearch` hook → `POST /image-search` (CLIP-based) → results replace product grid. Also wired into `shop.tsx`.

---

## Performance Optimizations
- **Debounced Search**: 300ms debounce on search inputs before triggering API calls.
- **List Virtualization**: `FlatList` with `numColumns` for responsive grids.
- **Optimistic Updates**: Applied across key user actions — all revert with `Alert` on API failure:
  - Wishlist toggle (wishlist tab): instant removal from list, no spinner
  - Wishlist toggle (shop grid): instant heart state flip before API
  - Cart quantity update: instant count + total recalculation, no refetch
  - Cart item remove: instant removal after confirm dialog, no refetch
  - Feed like toggle: instant filled/unfilled heart
- **Pagination**: Server-side pagination on products, brands, orders, and feed posts.
- **Infinite Scroll**: `useInfiniteScroll` hook for feed and other paginated lists.
- **Search Caching**: SearchModal caches trending products to avoid re-fetching on modal reopen.
- **Skeleton Loaders**: `Skeleton.tsx` provides reusable skeleton primitives (`Skeleton`, `ProductCardSkeleton`, `ProductGridSkeleton`, `OrderCardSkeleton`, `OrderListSkeleton`, `BrandCardSkeleton`, `FeedPostSkeleton`). Used on shop, orders, feed, wishlist, home, brand detail, and dashboard during initial load.
- **Offline Handling**: `NetworkContext` provides `useNetwork()` hook with `isConnected` state. A global animated banner shows on disconnect/reconnect. All 10 data-fetching screens (shop, feed, brands, wishlist, home, cart, orders, brand detail, dashboard, brand orders, product detail) show `OfflinePlaceholder` (wifi icon + retry button) when offline with no cached data. Stale data displays normally with the global banner.
- **Press Feedback**: `ShopByLook` figures use `Pressable` with scale-down animation (1 → 0.96 spring) and `expo-haptics` medium impact on press.
- **Recently Viewed Cache**: `useRecentlyViewed` hook reads/writes AsyncStorage. Product detail writes on fetch. Home screen reads IDs and batch-fetches product data in parallel.
