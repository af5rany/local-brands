# Frontend Specifications - Local Brands Mobile

The frontend is a high-performance, cross-platform mobile application built with **React Native** (Expo), utilizing **Expo Router** for type-safe, file-based navigation.

## Core Technologies
- **Framework**: React Native (via Expo 54+)
- **Navigation**: Expo Router (Typed Routes)
- **State Management**: React Context (Auth, Brand, Toast)
- **Networking**: Native `fetch` with Bearer token attachment from `AuthContext`.
- **Styling**: React Native Stylesheets with **Dynamic Theming** support.
- **Media**: Cloudinary integration via `useCloudinaryUpload` hook with client-side compression.

---

## App Structure & Navigation

### 1. Root Layout & Contexts
- `_layout.tsx`: Wraps the app in `AuthProvider`, `BrandProvider`, and `ToastProvider`. Handles initial session restoration.

### 2. Main Discovery (`(tabs)/`)
- **Home (`index`)**: Role-based dashboards:
  - **Admin**: Platform-wide stats, user/brand/product management shortcuts.
  - **Brand Owner**: Brand-specific stats, product/order management.
  - **Customer/Guest**: Segmented Products/Brands view with filter chips, featured brands carousel, paginated product grid.
- **Explore (`explore`)**: Real-time search with entity badges.

### 3. Authentication (`auth/`)
- `login.tsx` — Email/password login with JWT.
- `register.tsx` — Multi-field registration with avatar upload.
- `forgot-password.tsx` — Password recovery via email.
- `reset-password.tsx` — Password reset with token.

### 4. User Profile (`profile/`)
- `profile/index.tsx` — Personal details, avatar, account info.
- `profile/addresses/index.tsx` — Shipping address listing.
- `profile/addresses/new.tsx` — Add new address form.
- `profile/addresses/[id].tsx` — Edit existing address.

### 5. Brands (`brands/`)
- `brands/index.tsx` — Paginated brand listing with search, filters, sort.
- `brands/create.tsx` — Create new brand.
- `brands/select.tsx` — Multi-brand owner context switcher.
- `brands/[brandId]/index.tsx` — Brand detail with products.
- `brands/[brandId]/edit.tsx` — Edit brand identity & location.
- `brands/[brandId]/products.tsx` — Brand's product listing.

### 6. Products (`products/`)
- `products/index.tsx` — All products listing with advanced search, filters, pagination.
- `products/[productId].tsx` — Product detail: image gallery, variant color picker, pricing, stock status, reviews, admin controls (edit/delete).
- `products/create/[brandId].tsx` — Product creation with variants (color, images, stock), Cloudinary upload, status selection.
- `products/edit/[productId].tsx` — Full product edit with variant management.
- `products/draft_[productId].tsx` — Draft product preview.

### 7. Shopping Cart (`cart/`)
- `cart/index.tsx` — Cart with item listing, quantity adjustment, variant display, total calculation, checkout navigation.

### 8. Checkout (`checkout/`)
- `checkout/index.tsx` — Order placement with address selection, order summary, idempotency key generation.

### 9. Orders (`orders/`)
- `orders/index.tsx` — Order history listing with status badges, order details.

### 10. Wishlist (`wishlist/`)
- `wishlist/index.tsx` — Saved products grid with remove toggle, product photos, navigation to product detail.

### 11. Admin (`users/`)
- `users/index.tsx` — Admin user management: listing, role assignment, brand association.

---

## Image Upload System (Cloudinary)

Centralized via `useCloudinaryUpload` hook:
1. **Selection**: `expo-image-picker` with multi-select support (up to 5 images per variant).
2. **Compression**: `expo-image-manipulator` resizes to max 1200px width, 0.8 quality.
3. **Upload**: POST to Cloudinary with progress tracking.
4. **Component**: `ImageUploadProgress` — circular progress ring over thumbnail.

---

## State Management

| Context | Responsibility |
|---------|---------------|
| `AuthContext` | JWT storage (AsyncStorage), user state, token expiration polling (5-min interval), login/logout/refreshUser |
| `BrandContext` | Active brand selection for multi-brand owners, management mode toggle |
| `ToastContext` | Global toast notifications |

---

## Feature Status

### Fully Working

| Feature | Description |
|---------|-------------|
| **Authentication** | Login, register, forgot/reset password, JWT token management, guest browsing |
| **Brand Management** | Full CRUD, multi-brand ownership, brand listing with search/sort/filter |
| **Product Management** | Full CRUD, variant system (color + images + stock), status lifecycle (DRAFT/PUBLISHED/ARCHIVED), Cloudinary image upload |
| **Product Discovery** | Home dashboard with product/brand tabs, filter chips (category, type, brand, sort), pagination, debounced search |
| **Product Detail** | Image gallery with parallax, variant color picker, pricing with discount display, stock status, reviews, admin edit/delete controls |
| **Shopping Cart** | Add/remove items, quantity updates, variant-aware, total calculation |
| **Wishlist** | Toggle add/remove, product card photos, heart highlight on dashboard product cards (real-time sync) |
| **Orders** | Order placement with idempotency, order history with status badges, order detail with timeline |
| **Order Detail** | Full order detail screen with items, price breakdown, shipping address, and status timeline from `OrderStatusHistory` |
| **Shipping Addresses** | Full CRUD screens (`profile/addresses/`), address selection in checkout, set default address |
| **Checkout** | Address selection, order summary, idempotency key generation, mock payment |
| **Product Reviews** | Review display per product, `can-review` permission check (verified purchase), star rating, review submission |
| **User Profile** | Personal details, avatar upload, shipping addresses, settings |
| **Settings** | Notification preferences, change password link, privacy/terms placeholders, delete account |
| **Admin Dashboard** | Platform-wide stats (brands, products, users, revenue) |
| **Brand Owner Dashboard** | Brand-specific stats, product/order management |
| **Statistics** | Role-based analytics on home dashboard |
| **User Management** | Admin user listing, role management, brand assignment |
| **Image Upload** | Cloudinary pipeline with compression, progress tracking, multi-image per variant |
| **Dark Mode** | Full theme support via `useThemeColor` hook |

### Developed But Not Working / Incomplete

| Feature | Issue |
|---------|-------|
| **ProductVariant Entity Migration** | New `ProductVariant` entity table exists but the system still uses the deprecated `variants` JSON column on the `Product` entity. Data is saved/read from JSON, not the relational table. Backend normalizes `variantImages → images` on read. |
| **Auth Route Protection** | Login redirect in `_layout.tsx` is commented out — guests can navigate to protected screens (cart, orders, etc.) without being redirected to login. Individual screens handle auth checks independently (showing sign-in prompts). |

### Not Started

| Feature | Notes |
|---------|-------|
| **Payment Integration** | No payment gateway — checkout creates orders but no payment processing |
| **Push Notifications** | Not implemented |
| **Product Search Autocomplete** | Partial — local filtering of loaded data only, no server-side autocomplete endpoint |

---

## Performance Optimizations
- **Debounced Search**: 300ms debounce on search inputs before triggering API calls.
- **List Virtualization**: `FlatList` with `numColumns` for responsive grids.
- **Optimistic Updates**: Wishlist toggle updates UI instantly before API confirmation.
- **Pagination**: Server-side pagination on products, brands, and orders.
