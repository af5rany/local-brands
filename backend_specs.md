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
  - `ProductVariant` (Entity): Relational entity for per-variant color/stock/images tracking. **Currently unused** — system reads/writes the deprecated `variants` JSON column instead.
- **Variant Data Flow**: Frontend sends `{ color, variantImages, stock }` → backend normalizes to `{ images, attributes: { color }, stock }` on save → normalizes `variantImages → images` and `color → attributes.color` on read via `mapToPublicDto`.
- **Discovery**: Advanced search (`ILike`), pagination (`take`/`skip`), filter by category/type/brand/gender, sort by multiple fields.
- **Status Lifecycle**: `DRAFT`, `PUBLISHED`, `ARCHIVED`.
- **Soft Delete**: Supported.

### 5. Shopping Cart (`CartModule`)
- **Entities**: `Cart` (1:1 per user), `CartItem` (1:M with variant selection).
- Auto-creates cart on first item add.
- Quantity management, variant-aware items.

### 6. Orders & Fulfillment (`OrdersModule`)
- **Entities**: `Order`, `OrderItem`, `OrderStatusHistory`.
- **Process**:
  - Product details snapshotted into `OrderItem` at creation (preserves historical price/data).
  - Idempotency key (UUID) prevents duplicate submissions.
  - Stock deduction on order confirmation.
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
- **Admin**: Platform-wide revenue, user growth, active brand counts, product counts.
- **Brand Owner**: Brand-specific sales, top products, inventory.
- **Customer**: Personal order count, wishlist count, cart items.
- Optimized SQL queries with indexing on `brandId` and `createdAt`.

### 10. Feed & Social (`FeedModule`)
- **Entities**: `FeedPost`, `FeedPostLike`, `FeedPostComment`, `BrandFollow`.
- **Feed Posts**: Brand owners create posts with images, captions, and tagged products. Only `BRAND_OWNER` role can create posts (admin excluded).
- **Likes**: Authenticated (non-guest) users can like/unlike posts. Toggle endpoint returns `{ liked: boolean, likeCount: number }`.
- **Comments**: Authenticated users can add, edit, and delete comments on posts. Comments include user avatar and name.
- **Brand Follow**: Users follow/unfollow brands. Feed can be filtered to show only posts from followed brands via `followedOnly=true` query param.
- **Feed Query**: Supports pagination (`page`, `limit`), `followedOnly` filter (uses PostgreSQL subquery on `brand_follow` table). Public access (no auth) returns all posts; authenticated users can filter by followed brands.
- **Post Detail**: Returns post with `isLiked` flag, `likeCount`, `commentCount`, and full comments with user info.

### 11. Notifications (`NotificationModule`)
- **Entity**: `Notification` — stores user notifications with type, message, read status, and related entity references.
- Endpoints: list notifications, mark as read, mark all as read.

### 12. AI Try-On (`TryOnModule`)
- Virtual try-on feature powered by an AI service.
- **Flow**: Frontend uploads person photo to Cloudinary → sends `personImageUrl` + `garmentImageUrl` + `category` → backend queues a try-on job → frontend polls `/try-on/:jobId/status` until `completed` or `failed`.
- Supports cache hits (instant result if same combination was processed before).
- **Endpoints**:
  - `POST /try-on` — submit a try-on job
  - `GET /try-on/:jobId/status` — poll for result

### 13. Referral (`ReferralModule`)
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
- `Product` → `ProductVariant` (1:M, cascade — **entity exists but not used in active data flow**)
- `Product.variants` — deprecated JSON column (currently active)
- `User` → `Order` (1:M) → `OrderItem` (1:M) + `OrderStatusHistory` (1:M)
- `User` → `Cart` (1:1) → `CartItem` (1:M)
- `User` → `Wishlist` (1:M, links user to product)
- `User` → `Address` (1:M)
- `Product` → `ProductReview` (1:M)
- `Brand` → `FeedPost` (1:M) → `FeedPostLike` (M:M via user) + `FeedPostComment` (1:M)
- `User` → `BrandFollow` → `Brand` (M:M — user follows brands)
- `User` → `Notification` (1:M)
- `User` → `Referral` (tracks referrer/referee relationships)

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
| **Notifications** | List, mark read, mark all read | Type-based notifications with read status |
| **Try-On** | Submit job, poll status | Cloudinary image upload, job queue, cache hits, polling |
| **Referral** | Share code, list referrals | Status tracking per referral |

### Developed But Not Working / Incomplete

| Module | Issue |
|--------|-------|
| **ProductVariant (Relational)** | Entity and relation exist on `Product` (`productVariants`) but **never loaded or used**. All variant data flows through the deprecated `variants` JSON column. Migration to relational model not complete. |

### Not Implemented

| Feature | Notes |
|---------|-------|
| **Payment Processing** | No payment gateway integration |
| **Push Notifications** | Not implemented |
| **Server-side Autocomplete** | Search is basic `ILike` — no dedicated autocomplete/suggestion endpoint |
| **File/Image Cleanup** | No Cloudinary cleanup when products are deleted |
| **Rate Limiting** | No request rate limiting on API endpoints |

---

## Planned Features — To Be Done

### [TODO] Visual Product Tagging on Post Images

**Goal:** Store per-image tap coordinates alongside tagged products in `FeedPost`, enabling Instagram-style pin-based product tagging.

**Data model change** — `FeedPost.taggedProducts` (currently an array of product IDs) should become a structured array:
```ts
taggedProducts: Array<{
  productId: number;
  imageIndex: number;  // which image in the post the pin is on
  x: number;          // horizontal position as % of image width (0–100)
  y: number;          // vertical position as % of image height (0–100)
}>
```
Backward-compatible: items without `x`/`y` fall back to the chip list display.

**Backend changes needed:**
- Update `FeedPost` entity — change `taggedProducts` column from `simple-array` / JSON array of IDs to JSONB array of `{ productId, imageIndex, x, y }` objects
- Update `CreateFeedPostDto` and `UpdateFeedPostDto` to accept the new structure
- `GET /feed` and `GET /feed/:id` already return `taggedProducts` — ensure the richer structure is included in the response

---

### [TODO] Brand Posts Endpoint

**Goal:** Expose the feed posts for a specific brand directly, for use on the Brand Detail screen.

**New or existing:** The existing `GET /feed?brandId=:id` query parameter already supports filtering by brand. No new endpoint is strictly required — verify this works and document it officially.

Alternatively, add a dedicated route for clarity:
```
GET /brands/:id/posts?page=1&limit=10
```
Returns paginated `FeedPost` objects for the given brand (same shape as `GET /feed`).

---

### [TODO] Personalized "For You" Feed Endpoint

**Status: DONE ✓** — `GET /products/for-you` is implemented in `ProductsService.getForYou()`.

**How it works:**
- Requires auth (`JwtAuthGuard`, no `@Public`)
- Queries wishlist + order history to extract user preference signals (brand, subcategory, productType, gender)
- Scores unpurchased/unsaved published products using weighted CASE expressions
- Falls back to `getTrending()` for users with no history
- Excludes already-interacted product IDs from results

---

### [TODO — Later] Search by Image

**Goal:** Accept an image URL and return visually similar products from the catalog.

**New endpoint:**
```
POST /products/search-by-image
Body: { imageUrl: string }   // Cloudinary URL uploaded by the client
Returns: PublicProductDto[]
```

**Integration:** Requires a visual similarity service (e.g., Google Vision Product Search, AWS Rekognition, or a custom CLIP-based embedding). The endpoint submits the image to the external service and maps returned labels/embeddings to products in the DB.

**Priority:** Low — deferred to a later phase.

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
| `/cart/items` | POST | Auth | Add item to cart |
| `/orders` | POST | Auth | Create order (with idempotency key, sends confirmation email) |
| `/orders/my-orders` | GET | Auth | Current user's orders |
| `/orders/:id` | GET | Auth | Single order detail |
| `/orders/:id/history` | GET | Auth | Order status timeline |
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
