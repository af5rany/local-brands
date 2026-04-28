# Backend Specifications - Local Brands API

The backend is a robust RESTful API built with **NestJS**, utilizing **TypeScript** for type safety, **TypeORM** for Object-Relational Mapping, and **PostgreSQL** as the primary data store.

## Core Technologies
- **Framework**: NestJS 11+
- **Database**: PostgreSQL 14+ (via Docker or local)
- **ORM**: TypeORM with `synchronize: true` (no migration files — schema syncs automatically on boot).
- **Authentication**: JWT-based stateless authentication with Passport.js.
- **Validation**: Strict input validation using `class-validator` and `class-transformer`.
- **Media**: Cloudinary URLs validated on persistence layer.
- **Documentation**: Auto-generated Swagger UI at `/api`.

---

## System Architecture & Modules

### 1. Authentication & Security (`AuthModule`)
- **Identity Provider**: Custom JWT implementation with configurable TTL.
- **Role-Based Access Control (RBAC)**:
  - `ADMIN`: Full platform access.
  - `BRAND_OWNER`: Access to own brands, products, and sales stats.
  - `CUSTOMER`: Public discovery and personal order management.
  - `GUEST`: Limited browsing, no write operations.
- **Guards**:
  - `JwtAuthGuard`: Enforces valid token presence.
  - `RolesGuard`: Validates user role against route metadata.
  - `BrandAccessGuard`: Validates if the user has legitimate access to a specific `brandId`.
  - `RegisteredUsersOnlyGuard`: Blocks guest users from protected actions.
- **Security Features**:
  - Bcrypt password hashing.
  - JWT payload: `{ id, role, isGuest, iat, exp }`.

### 2. Users (`UsersModule`)
- Full CRUD with admin user management.
- Role assignment and brand association.
- Soft delete via `@DeleteDateColumn`.

### 3. Brands & Governance (`BrandsModule`)
- **Entities**:
  - `Brand`: Core identity (name, logo, location, description, slug, status).
  - `BrandUser`: Junction table for RBAC within a brand (supports `OWNER`, `STAFF` roles with granular permissions).
- **Content Lifecycle**: `DRAFT` → `PUBLISHED` → `ARCHIVED`.
- **Soft Delete**: Uses `@DeleteDateColumn`.
- **Logic**: Automatic filtering of non-published brands for public endpoints; full access for owners/admin via `/brands/admin`.

### 4. Products & Content (`ProductsModule`)
- **Entities**:
  - `Product`: Base product data (price, salePrice, stock, status, gender, season, tags, material, dimensions).
  - `ProductVariant`: Per-size stock record — fields: `size` (string), `stock` (int), `isAvailable` (bool). Color and images are product-level (one color, shared image gallery per product). Fully in use.
- **Variant Data Flow**: Each `ProductVariant` row = one size option with its own stock count. `mapToPublicDto` maps `product.productVariants` → `variants[]` with `{ id, productId, size, stock, isAvailable }`. `product.color` and `product.images` are returned at product level. The deprecated `variants` JSON column is no longer written to.
- **Discovery**: Advanced search (`ILike`), pagination (`take`/`skip`), filter by category/type/brand/gender, sort by multiple fields.
- **Status Lifecycle**: `DRAFT`, `PUBLISHED`, `ARCHIVED`.
- **Soft Delete**: Supported.
- **Back-in-Stock Alerts**: On `update()`, if `stock` transitions from 0 → >0, queries `StockNotification` (where `notified = false`) → `NotificationsService.createBulk()` + `PushNotificationService.sendPushToMany()` → marks subscribers notified.
- **Low-Stock Inventory Alerts**: On `update()`, if stock drops below `lowStockThreshold`, queries `BrandUser` for brand owner user IDs → sends in-app + push notification to brand owners.

### 5. Shopping Cart (`CartModule`)
- **Entities**: `Cart` (1:1 per user), `CartItem` (1:M with variant selection).
- Auto-creates cart on first item add.
- Quantity management, variant-aware items.

### 6. Orders & Fulfillment (`OrdersModule`)
- **Entities**: `Order` (has `brandId: number nullable`), `OrderItem`, `OrderStatusHistory`.
- **Process**:
  - Product details snapshotted into `OrderItem` at creation (preserves historical price/data).
  - Idempotency key (UUID) per brand group prevents duplicate submissions.
  - Stock deduction on order confirmation.
- **Multi-Vendor Checkout**: `checkout()` groups cart items by `product.brandId`, calls `create()` once per brand group (passing `brandId`, `skipCartClear: true`), clears cart once after all orders created, returns `Order[]`. `POST /orders/checkout` → `Order[]`.
- **Status Enum**: `PENDING` → `CONFIRMED` → `PROCESSING` → `SHIPPED` → `DELIVERED` → `CANCELLED`.
- **Status History**: `OrderStatusHistory` records every transition with `oldStatus`, `newStatus`, `changedBy`, `notes`, `createdAt`.

### 7. Wishlist (`WishlistModule`)
- Add/remove/toggle products.
- `findByUser` returns product data with relations.
- Toggle endpoint returns `{ added: boolean }` for optimistic UI updates.

### 8. Reviews (`ReviewsModule`)
- **Entity**: `ProductReview` with approval workflow.
- Review submission and listing per product.
- `/can-review/:productId` endpoint — checks if the authenticated user has a delivered/completed order containing this product and hasn't already reviewed it.
- Admin approve/reject queue.

### 9. Statistics & Analytics (`StatisticsModule`)
- **Admin**: Platform-wide stats now include: `totalRevenue`, `revenueThisMonth`, `revenueLastMonth`, `ordersTotal`, `ordersThisMonth`, `newUsersThisMonth`, `userGrowthPercent`, `ordersByStatus` (grouped count per status), `topBrands` (top 5 by revenue with name + revenue), `gmvByMonth` (last 6 months array `[{ month, gmv }]`), plus legacy brand/product/user counts.
- **Brand Owner**: Brand-specific sales, top products, inventory.
- **Customer**: Personal order count, wishlist count, cart items.
- Optimized SQL queries with indexing on `brandId` and `createdAt`.

### 10. Feed & Social (`FeedModule`)
- **Entities**: `Post`, `PostLike`, `PostComment`, `PostProduct` (join table with `xPercent: float nullable`, `yPercent: float nullable`), `BrandFollow`.
- **Feed Posts**: Brand owners create posts with images, captions, and tagged products. Only `BRAND_OWNER` role can create posts (admin excluded).
- **Visual Pin Tags**: `CreatePostDto` accepts `products: { productId, xPercent?, yPercent? }[]` alongside legacy `productIds[]`. `PostProduct` stores `xPercent`/`yPercent` as % of image dimensions for responsive positioning.
- **Likes**: Authenticated (non-guest) users can like/unlike posts. Toggle endpoint returns `{ liked: boolean, likeCount: number }`.
- **Comments**: Authenticated users can add, edit, and delete comments on posts. Comments include user avatar and name.
- **Brand Follow**: Users follow/unfollow brands. Feed can be filtered to show only posts from followed brands via `followedOnly=true` query param.
- **Feed Query**: Supports pagination (`page`, `limit`), `followedOnly` filter (uses PostgreSQL subquery on `brand_follow` table). Public access (no auth) returns all posts; authenticated users can filter by followed brands.
- **Post Detail**: Returns post with `isLiked` flag, `likeCount`, `commentCount`, and full comments with user info.

### 11. Notifications & Push (`NotificationModule`)
- **Entities**:
  - `Notification` — stores user notifications with type, message, read status, and related entity references.
  - `PushToken` — Expo push tokens per user (userId, token unique, platform ios/android/web, isActive). One user can have multiple tokens (multi-device). Invalid tokens auto-marked inactive after failed sends.
- **Services**:
  - `NotificationsService` — create, list, mark-read, mark-all-read.
  - `PushNotificationService` — `registerToken(userId, token, platform)`, `unregisterToken`, `sendPush(userId, title, body, data)` (respects `notificationPreferences.push`), `sendPushToMany(userIds[], ...)`, uses `expo-server-sdk`, chunks messages, marks invalid tokens inactive.
- **New endpoints**: `POST /notifications/push-token`, `DELETE /notifications/push-token`.
- **Preferences endpoint**: `PUT /users/notification-preferences` — updates `user.notificationPreferences` JSON (`push`, `email`, `orderUpdates`, `promotions` booleans).
- Notifications dispatched fire-and-forget (`.catch(() => {})`) from all modules that trigger them.

### 12. AI Try-On (`TryOnModule`)
- Virtual try-on feature powered by an AI service.
- **Flow**: Frontend uploads person photo to Cloudinary → sends `personImageUrl` + `garmentImageUrl` + `category` → backend queues a try-on job → frontend polls `/try-on/:jobId/status` until `completed` or `failed`.
- Supports cache hits (instant result if same combination was processed before).
- **Endpoints**:
  - `POST /try-on` — submit a try-on job
  - `GET /try-on/:jobId/status` — poll for result

### 13. Promo Codes (`PromoCodesModule`)
- **Entities**:
  - `PromoCode` — code (unique, uppercase), type (`PERCENTAGE` | `FIXED`), value, minOrderAmount, maxDiscountAmount (cap for % discounts), maxUses (nullable = unlimited), usesCount, maxUsesPerUser (default 1), startDate, expiryDate, isActive, brandId (FK nullable — null = platform-wide). Soft delete.
  - `PromoCodeUsage` — promoCodeId, userId, orderId, discountApplied. Unique constraint `[promoCodeId, userId, orderId]`.
- **Service methods**: `create`, `findAllByBrand`, `findOne`, `update`, `toggleActive`, `remove` (soft delete), `validate(code, cartTotal, userId, brandId?)` — checks active/dates/usage limits/min order → returns discount amount, `applyPromo(code, userId, orderId, discountApplied)` — atomic `usesCount` increment, `getUsageStats(promoCodeId)`.
- **Endpoints**:
  - `POST /promo-codes/validate` — public validation (customer validates code at checkout)
  - `GET /brands/:brandId/promo-codes` — brand owner list
  - `POST /brands/:brandId/promo-codes` — create
  - `PUT /brands/:brandId/promo-codes/:id` — update
  - `PUT /brands/:brandId/promo-codes/:id/toggle` — toggle active
  - `GET /brands/:brandId/promo-codes/:id/usage` — usage stats
  - `DELETE /brands/:brandId/promo-codes/:id` — soft delete
- **Order integration**: `OrdersModule` imports `PromoCodesModule`. In `checkout()`: promo validated → discount applied → usage recorded fire-and-forget after order save. `Order` entity has `promoCode` (string, nullable) and `discountAmount` columns.

### 14. Rate Limiting (`ThrottlerModule`)
- **Package**: `@nestjs/throttler`
- **Global**: `ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }])` + `APP_GUARD ThrottlerGuard` — 100 requests/min default for all routes
- **Per-route overrides** via `@Throttle`:
  - `POST /auth/login` / `POST /auth/register` — 5 requests/min
  - `POST /promo-codes/validate` — 20 requests/min
  - `POST /orders/checkout` — 10 requests/min

### 15. Size Guides (`SizeGuidesModule`)
- **Entity**: `SizeGuide` — `id`, `brandId` (FK nullable), `productId` (FK nullable), `title`, `description` (text, nullable), `headers` (simple-array — column names), `rows` (JSON — `{ label, values: Record<string, string> }[]`), `unit` (default 'in'), `createdAt`, `updatedAt`
- **Service**: `findForProduct(productId, brandId)` — product-level first, falls back to brand-level; `create`, `update`, `remove`, `findByBrand`
- **Endpoints**:
  - `GET /size-guides/product/:productId?brandId=` — public
  - `GET/POST /brands/:brandId/size-guides` — brand owner
  - `PUT/DELETE /brands/:brandId/size-guides/:id` — brand owner

### 16. Email Campaigns (`EmailCampaignsModule`)
- **Entity**: `EmailCampaign` — `id`, `brandId` (FK), `subject`, `body` (text — HTML or plain), `previewText`, `status` ('draft'|'scheduled'|'sending'|'sent'|'failed'), `scheduledAt`, `sentAt`, `recipientCount`, `sentCount`
- **Service**: `create(brandId, dto)`, `update(id, dto)`, `send(campaignId)` — chunks followers (50/batch) into BullMQ jobs, `schedule(campaignId, scheduledAt)` — delayed BullMQ job
- **BullMQ processor**: `email-campaign.processor.ts` — dequeues batch, calls `mailService.sendCampaignEmail()`, increments `sentCount`
- **Mail**: `sendCampaignEmail(to, subject, htmlBody, brandName?)` added to `MailService`
- **Endpoints** (all BrandAccessGuard):
  - `GET/POST /brands/:brandId/email-campaigns`
  - `PUT/DELETE /brands/:brandId/email-campaigns/:id`
  - `POST /brands/:brandId/email-campaigns/:id/send`
  - `POST /brands/:brandId/email-campaigns/:id/schedule`

### 17. Product Bundles (`BundlesModule`)
- **Entity**: `Bundle` — `id`, `brandId`, `name`, `description`, `discountType` ('percentage'|'fixed'), `discountValue`, `minQuantity` (default 2), `isActive` (default true), `productIds` (simple-array), `startDate`, `endDate`
- **Service**: CRUD, `toggleActive(id)`, `checkBundleDiscount(cartProductIds, brandId)` — finds best active matching bundle
- **Endpoints**:
  - `POST /bundles/check` — customer checks cart for bundle discount
  - `GET/POST /brands/:brandId/bundles/` — brand owner list/create
  - `GET/PUT/DELETE /brands/:brandId/bundles/:id` — brand owner detail/edit/delete

### 18. Carrier Tracking (`CarrierTrackingService`)
- Normalized tracking result: `{ carrier, trackingNumber, status, estimatedDelivery?, events: { timestamp, location, description }[] }`
- Supports: FedEx (OAuth + Track API v1), UPS (OAuth + Track API), USPS (Web Tools XML), DHL (Shipment Tracking API)
- Falls back to stored status for unknown carriers
- Env vars: `FEDEX_API_KEY`, `FEDEX_SECRET`, `UPS_CLIENT_ID`, `UPS_CLIENT_SECRET`, `USPS_USER_ID`, `DHL_API_KEY`
- **Endpoint**: `GET /orders/:orderId/tracking` — verifies order belongs to requesting user, calls tracking service

### 19. Shipping (`ShippingModule`)
- **Entities**:
  - `ShippingZone` — name, countries (simple-array of ISO-2 codes), regions, brandId, isActive.
  - `ShippingRate` — zoneId, methodName, method (enum `STANDARD|EXPRESS|OVERNIGHT|LOCAL_PICKUP`), minWeight, maxWeight, price, estimatedDays, isActive.
- **Service methods**: Zone CRUD, Rate CRUD, `calculateShipping(brandId, countryCode, weight?)` — finds matching zone by country, filters rates by weight.
- **Endpoints**:
  - `POST /shipping/calculate` — customer calculates rates for an address
  - Full CRUD under `brands/:brandId/shipping/zones` and `brands/:brandId/shipping/zones/:zoneId/rates` (BrandAccessGuard)
- **Order integration**: `Order` entity has `shippingCarrier` (string, nullable) and `shippingMethodName` (string, nullable) columns.

### 15. Returns (`ReturnsModule`)
- **Entities**:
  - `ReturnRequest` — orderId, orderItemId (nullable = full order), userId, brandId, reason (enum `DEFECTIVE|WRONG_ITEM|NOT_AS_DESCRIBED|CHANGED_MIND|SIZE_FIT|DAMAGED_IN_SHIPPING|OTHER`), description, status (enum `REQUESTED|APPROVED|REJECTED|SHIPPED_BACK|RECEIVED|REFUNDED`, default REQUESTED), images (simple-array, Cloudinary URLs), adminNotes, returnTrackingNumber, refundAmount, resolvedAt.
  - `ReturnPolicy` — brandId (unique — one per brand), returnWindowDays (default 30), conditions, requiresImages (default false), restockingFeePercent (default 0), isActive (default true).
- **Service methods**: `createReturnRequest` (validates ownership, return window vs policy, no duplicate), `getReturnsByUser`, `getReturnsByBrand`, `approveReturn`, `rejectReturn` (notes required), `markShippedBack`, `markReceived`, `completeRefund` (restores stock in transaction, calculates refund minus restocking fee, sets REFUNDED), `getReturnPolicy`, `upsertReturnPolicy`, `getPendingReturnsCount`.
- **Endpoints**:
  - Customer: `POST /returns`, `GET /returns/my-returns`, `GET /returns/:id`, `PUT /returns/:id/ship`
  - Brand owner: `GET /brands/:brandId/returns`, `GET /brands/:brandId/returns/:id`, `PUT /brands/:brandId/returns/:id/approve`, `PUT /brands/:brandId/returns/:id/reject`, `PUT /brands/:brandId/returns/:id/received`, `PUT /brands/:brandId/returns/:id/refund`
  - Policy: `GET /brands/:brandId/return-policy`, `PUT /brands/:brandId/return-policy`

### 16. Brand Notifications (`BrandsModule` extension)
- **Endpoint**: `POST /brands/:id/notifications/send` — brand owner sends in-app + push notification to all brand followers.
- Calls `notificationsService.create()` for each follower (in-app) + `pushService.sendPushToMany()` for push.
- Returns `{ sent: number }` — count of followers notified.
- Protected by `BrandAccessGuard`.

### 17. Brand Analytics (extended)
- `GET /brands/:id/analytics` now returns additional fields via raw SQL:
  - `activePromoCodes` — count of active, non-expired, non-exhausted promo codes
  - `pendingReturns` — count of return requests with status `requested`
  - `totalDiscountGiven` — sum of all discounts applied via the brand's promo codes

### 18. Referral (`ReferralModule`)
- Users have a referral code.
- Users can refer others; tracked per referral with status (pending/completed).
- Frontend shows share code, copy button, and referral history.

### 14. Addresses (`AddressesModule`)
- Full CRUD for user shipping/billing addresses.
- Set default address.
- Auto-unsets previous default when a new one is set.

### 15. Mail (`MailModule`)
- Nodemailer email service.
- Wired to auth events (welcome email on registration) and order events (confirmation, status updates).

---

## Database Schema

### Key Entity Relationships
- `User` → `Brand` via `BrandUser` (M:M with roles)
- `Brand` → `Product` (1:M, cascade delete)
- `Product` → `ProductVariant` (1:M, cascade — fully active; one row per size option, stock tracked per size)
- `User` → `Order` (1:M) → `OrderItem` (1:M) + `OrderStatusHistory` (1:M)
- `User` → `Cart` (1:1) → `CartItem` (1:M)
- `User` → `Wishlist` (1:M, links user to product)
- `User` → `Address` (1:M)
- `Product` → `ProductReview` (1:M)
- `Brand` → `FeedPost` (1:M) → `FeedPostLike` (M:M via user) + `FeedPostComment` (1:M)
- `User` → `BrandFollow` → `Brand` (M:M — user follows brands)
- `User` → `Notification` (1:M)
- `User` → `PushToken` (1:M — multi-device)
- `User` → `Referral` (tracks referrer/referee relationships)
- `Brand` → `PromoCode` (1:M, FK nullable for platform-wide codes)
- `PromoCode` → `PromoCodeUsage` (1:M — one record per use, unique per promoCode+user+order)
- `Brand` → `ShippingZone` (1:M) → `ShippingRate` (1:M)
- `Order` → `ReturnRequest` (1:M — one return per item or whole order)
- `Brand` → `ReturnPolicy` (1:1 — one policy per brand)

### Soft Delete Entities
- `User`, `Product`, `Order` use `@DeleteDateColumn`.
- Queries default to excluding soft-deleted records.

---

## Feature Status

### Fully Working

| Module | Endpoints | Notes |
|--------|-----------|-------|
| **Auth** | login, register, guest login, forgot/reset password | JWT with Passport strategies, welcome email on registration |
| **Users** | CRUD, admin management | Role assignment, soft delete |
| **Brands** | CRUD, admin listing, ownership | Multi-brand via BrandUser, search/filter/sort |
| **Products** | CRUD, listing, filters, search | Variant normalization, status lifecycle, soft delete |
| **Cart** | Add/remove/update items | Variant-aware, auto-create cart |
| **Orders** | Create, list, status updates, history timeline | Idempotency, status history, stock deduction, email notifications |
| **Wishlist** | Add/remove/toggle, list by user | Toggle returns added/removed state |
| **Statistics** | Role-based dashboard stats | Admin, brand owner, customer views |
| **Addresses** | Full CRUD, set default | User-scoped, auto-unsets other defaults |
| **Reviews** | Submit, list by product, can-review check, admin approve/reject, pending list | Verified purchase check, product rating aggregation |
| **Mail** | Password reset, welcome, order confirmation, order status updates | Nodemailer, non-blocking fire-and-forget |
| **Feed** | Create posts, like/unlike, comment CRUD, brand follow/unfollow, filtered feed | Brand owner only posting, `followedOnly` filter, public read access |
| **Notifications** | List, mark read, mark all read, push token register/unregister, notification preferences | In-app + Expo push via `expo-server-sdk`, multi-device tokens |
| **Try-On** | Submit job, poll status | Cloudinary image upload, job queue, cache hits, polling |
| **Referral** | Share code, list referrals | Status tracking per referral |
| **Promo Codes** | Create/update/toggle/delete promo codes, validate at checkout, usage tracking | Atomic `usesCount` increment, per-user limits, % and fixed discount types, soft delete |
| **Shipping Zones & Rates** | Zone CRUD, rate CRUD, calculate shipping by country | Country ISO matching, weight-based rate filtering, brand-scoped |
| **Returns** | Full RMA flow — customer request → brand approve/reject → ship back → received → refund | Stock restoration in transaction, restocking fee, window enforcement via return policy |
| **Return Policy** | Create/update per-brand policy | returnWindowDays, requiresImages, restockingFeePercent, isActive |
| **Brand Analytics (extended)** | `GET /brands/:id/analytics` | Now includes `activePromoCodes`, `pendingReturns`, `totalDiscountGiven` |
| **Brand Notify Followers** | `POST /brands/:id/notifications/send` | Sends in-app + push to all followers, returns `{ sent: N }` |
| **Image Search** | `POST /image-search`, `POST /image-search/batch-embed` | CLIP-based visual similarity search; camera entry point in SearchModal |
| **Rate Limiting** | All endpoints | Global 100 req/min via ThrottlerGuard; auth/checkout routes have stricter per-route limits |
| **Admin System Analytics** | `GET /statistics/admin` | Revenue, GMV by month, top brands, orders by status, user growth |
| **Back-in-Stock Alerts** | `products.service.ts` | Auto-triggers push + in-app when stock restored from 0 |
| **Inventory Alerts (low stock)** | `products.service.ts` | Auto-notifies brand owners when stock drops below `lowStockThreshold` |
| **Social Sharing** | Frontend only | Native `Share.share()` on product detail + post detail |
| **Size Guides** | `SizeGuidesModule` | Brand owner CRUD; product detail modal for customers |
| **Email Campaigns** | `EmailCampaignsModule` | BullMQ-based send/schedule to brand followers |
| **Product Bundles** | `BundlesModule` | Bundle check at checkout; brand owner CRUD |
| **Visual Pin Tags** | `PostProduct.xPercent/yPercent` | Stored as float %; returned in feed/post API responses |
| **Carrier Tracking** | `CarrierTrackingService` | FedEx/UPS/USPS/DHL live tracking; `GET /orders/:id/tracking` |
| **Multi-Vendor Checkout** | `orders.service.ts` | Groups cart by brand, creates `Order[]`, returns array |
| **Search Autocomplete** | `products.service.ts` | `GET /products/suggestions?q=` — returns matching product name strings for live suggestion rows |
| **Cloudinary Image Cleanup** | `products.service.ts` | `deleteCloudinaryImages()` fires on product `softDelete`; requires `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` in `.env` |
| **Brand Owner Orders** | `orders.controller.ts` | `GET /orders/brand/:brandId` — paginated orders for a brand; BrandAccessGuard-protected |
| **Brand Owner Order Fulfillment** | `orders.controller.ts` + `orders.service.ts` | `PUT /orders/:id/fulfill` — brand owner advances order status (PENDING→CONFIRMED→PROCESSING→SHIPPED→DELIVERED); ownership verified via `BrandUser` table; tracking number required for SHIPPED; delegates to existing `update()` for status history + notifications |
| **Delete Account** | `users.controller.ts` | `DELETE /users/me` — soft-deletes authenticated user and logs them out |
| **Product Q&A** | `ProductQuestionsModule` | `GET /products/:id/questions` (public); `POST /products/:id/questions` (authenticated); `PUT /products/questions/:id/answer` (brand owner / admin with brand ownership check); `DELETE /questions/:id` (owner or admin) |
| **Cart-Add Conversion Tracking** | `cart.service.ts` + `product.entity.ts` | `cartAddCount` column on Product; incremented fire-and-forget on NEW cart adds (not re-adds); exposed in brand analytics per-product top-products list |
| **Invoice PDF** | Frontend-only | `expo-print.printToFileAsync(html)` generates PDF from order HTML template; `expo-sharing.shareAsync()` opens system share sheet with PDF |

### Developed But Not Working / Incomplete

None — all previously incomplete modules are now working.

### Not Implemented

| Feature | Notes |
|---------|-------|
| **Payment Processing** | No payment gateway integration |
| **Email Verification** | No verify flow after registration — users auto-approved |

---

## Planned Features — To Be Done

### [DONE ✓] Visual Product Tagging on Post Images

**Status:** Fully implemented.
- `PostProduct` entity has `xPercent: float nullable` and `yPercent: float nullable`
- `CreatePostDto` accepts `products: { productId, xPercent?, yPercent? }[]` (legacy `productIds[]` still supported)
- `GET /feed` and `GET /feed/:id` return full `postProducts` with coordinates via join
- `feed.service.ts` `createPost()` and `updatePost()` handle both formats

---

### [DONE ✓] Brand Posts Endpoint

**Goal:** Expose the feed posts for a specific brand directly, for use on the Brand Detail screen.

**New or existing:** The existing `GET /feed?brandId=:id` query parameter already supports filtering by brand. No new endpoint is strictly required — verify this works and document it officially.

Alternatively, add a dedicated route for clarity:
```
GET /brands/:id/posts?page=1&limit=10
```
Returns paginated `FeedPost` objects for the given brand (same shape as `GET /feed`).

---

### [DONE ✓] Personalized "For You" Feed Endpoint

**Status: DONE ✓** — `GET /products/for-you` is implemented in `ProductsService.getForYou()`.

**How it works:**
- Requires auth (`JwtAuthGuard`, no `@Public`)
- Queries wishlist + order history to extract user preference signals (brand, subcategory, productType, gender)
- Scores unpurchased/unsaved published products using weighted CASE expressions
- Falls back to `getTrending()` for users with no history
- Excludes already-interacted product IDs from results

---

### [DONE ✓] Search by Image

**Status:** Fully implemented — `POST /image-search` with CLIP-based embedding service. Admin `POST /image-search/batch-embed` for indexing all products.

---

## API Reference (Key Endpoints)

| Endpoint | Method | Role | Description |
|----------|--------|------|-------------|
| `/auth/login` | POST | Public | JWT login |
| `/auth/register` | POST | Public | User registration (sends welcome email) |
| `/auth/guest` | POST | Public | Guest token |
| `/brands` | GET | Public | Paginated brand listing |
| `/brands/admin` | GET | Admin | All brands (admin view) |
| `/products` | GET | Public | Paginated product listing with filters |
| `/products/filters` | GET | Public | Available filter options (categories, types) |
| `/products/trending` | GET | Public | Trending products (used by search modal) |
| `/products/for-you` | GET | Auth | Personalized recommendations based on wishlist + order history |
| `/products/suggestions` | GET | Public | Autocomplete suggestions — `?q=query` returns matching product name strings |
| `/cart/items` | POST | Auth | Add item to cart |
| `/orders` | POST | Auth | Create order (with idempotency key, sends confirmation email) |
| `/orders/my-orders` | GET | Auth | Current user's orders |
| `/orders/:id` | GET | Auth | Single order detail |
| `/orders/:id/history` | GET | Auth | Order status timeline |
| `/orders/brand/:brandId` | GET | Brand Owner | Paginated orders for a brand (BrandAccessGuard) |
| `/addresses` | GET/POST | Auth | List/create user addresses |
| `/addresses/:id` | GET/PUT/DELETE | Auth | Get/update/delete address |
| `/addresses/:id/default` | PATCH | Auth | Set address as default |
| `/wishlist/toggle/:productId` | POST | Auth | Toggle wishlist item |
| `/statistics` | GET | Auth | Role-based dashboard statistics |
| `/reviews/product/:productId` | GET | Public | Product reviews |
| `/reviews/can-review/:productId` | GET | Auth | Check if user can review (verified purchase check) |
| `/reviews` | GET | Admin | Pending reviews list |
| `/reviews` | POST | Auth | Submit review |
| `/reviews/:id/approve` | PATCH | Admin | Approve review |
| `/reviews/:id/reject` | PATCH | Admin | Reject review |
| `/feed` | GET | Public/Auth | Paginated feed posts (optional `followedOnly=true` for auth users) |
| `/feed` | POST | Brand Owner | Create feed post (brand picker, images, caption, tagged products) |
| `/feed/:id` | GET | Public/Auth | Single post detail with likes/comments |
| `/feed/:id/like` | POST | Auth | Toggle like on post |
| `/feed/:id/comments` | POST | Auth | Add comment to post |
| `/feed/:id/comments/:commentId` | DELETE | Auth | Delete own comment |
| `/feed/brands/:brandId/follow` | POST | Auth | Follow a brand |
| `/feed/brands/:brandId/unfollow` | DELETE | Auth | Unfollow a brand |
| `/notifications` | GET | Auth | List user notifications |
| `/notifications/:id/read` | PATCH | Auth | Mark notification as read |
| `/notifications/read-all` | PATCH | Auth | Mark all notifications as read |
| `/try-on` | POST | Auth | Submit AI try-on job |
| `/try-on/:jobId/status` | GET | Auth | Poll try-on job status |
| `/notifications/push-token` | POST | Auth | Register Expo push token |
| `/notifications/push-token` | DELETE | Auth | Unregister push token |
| `/users/notification-preferences` | PUT | Auth | Update notification preferences (`push`, `email`, `orderUpdates`, `promotions`) |
| `/promo-codes/validate` | POST | Public | Validate promo code against cart total |
| `/brands/:id/promo-codes` | GET/POST | Brand Owner | List / create promo codes |
| `/brands/:id/promo-codes/:promoId` | PUT/DELETE | Brand Owner | Update / soft-delete promo code |
| `/brands/:id/promo-codes/:promoId/toggle` | PUT | Brand Owner | Toggle promo code active state |
| `/brands/:id/promo-codes/:promoId/usage` | GET | Brand Owner | Usage stats for a promo code |
| `/shipping/calculate` | POST | Public | Calculate shipping rates by country + weight |
| `/brands/:id/shipping/zones` | GET/POST | Brand Owner | List / create shipping zones |
| `/brands/:id/shipping/zones/:zoneId` | PUT/DELETE | Brand Owner | Update / delete shipping zone |
| `/brands/:id/shipping/zones/:zoneId/rates` | GET/POST | Brand Owner | List / create shipping rates |
| `/brands/:id/shipping/zones/:zoneId/rates/:rateId` | PUT/DELETE | Brand Owner | Update / delete shipping rate |
| `/returns` | POST | Auth | Create return request |
| `/returns/my-returns` | GET | Auth | Customer's return history |
| `/returns/:id` | GET | Auth | Return detail |
| `/returns/:id/ship` | PUT | Auth | Customer marks item shipped back (with tracking number) |
| `/brands/:id/returns` | GET | Brand Owner | List brand's return requests (filterable by status) |
| `/brands/:id/returns/:returnId` | GET | Brand Owner | Return request detail |
| `/brands/:id/returns/:returnId/approve` | PUT | Brand Owner | Approve return |
| `/brands/:id/returns/:returnId/reject` | PUT | Brand Owner | Reject return (notes required) |
| `/brands/:id/returns/:returnId/received` | PUT | Brand Owner | Mark item received |
| `/brands/:id/returns/:returnId/refund` | PUT | Brand Owner | Process refund + restore stock |
| `/brands/:id/return-policy` | GET/PUT | Brand Owner | Get / upsert return policy |
| `/brands/:id/notifications/send` | POST | Brand Owner | Send push + in-app notification to all followers |
| `/size-guides/product/:productId` | GET | Public | Size guide for a product (falls back to brand guide) |
| `/brands/:id/size-guides` | GET/POST | Brand Owner | List / create size guides |
| `/brands/:id/size-guides/:guideId` | PUT/DELETE | Brand Owner | Update / delete size guide |
| `/brands/:id/email-campaigns` | GET/POST | Brand Owner | List / create email campaigns |
| `/brands/:id/email-campaigns/:cId` | PUT/DELETE | Brand Owner | Update / delete campaign |
| `/brands/:id/email-campaigns/:cId/send` | POST | Brand Owner | Send campaign to all followers |
| `/brands/:id/email-campaigns/:cId/schedule` | POST | Brand Owner | Schedule campaign send |
| `/brands/:id/bundles` | GET/POST | Brand Owner | List / create product bundles |
| `/brands/:id/bundles/:bundleId` | GET/PUT/DELETE | Brand Owner | Bundle detail / update / delete |
| `/bundles/check` | POST | Public | Check if cart qualifies for bundle discount |
| `/orders/:orderId/tracking` | GET | Auth | Live carrier tracking events for an order |
| `/users/me` | DELETE | Auth | Delete own account (soft delete + logout) |
