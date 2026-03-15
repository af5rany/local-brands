# Backend Specifications - Local Brands API

The backend is a robust RESTful API built with **NestJS**, utilizing **TypeScript** for type safety, **TypeORM** for Object-Relational Mapping, and **PostgreSQL** as the primary data store.

## Core Technologies
- **Framework**: NestJS 11+
- **Database**: PostgreSQL 14+ (via Docker or local)
- **ORM**: TypeORM with `synchronize: false` and migration support.
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
  - `ProductVariant` (Entity): New relational entity for per-variant color/stock/images tracking. **Currently unused** — system reads/writes the deprecated `variants` JSON column instead.
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
- **Missing**: `/can-review/:productId` endpoint (frontend calls it but backend doesn't implement it).

### 9. Statistics & Analytics (`StatisticsModule`)
- **Admin**: Platform-wide revenue, user growth, active brand counts, product counts.
- **Brand Owner**: Brand-specific sales, top products, inventory.
- **Customer**: Personal order count, wishlist count, cart items.
- Optimized SQL queries with indexing on `brandId` and `createdAt`.

### 10. Mail (`MailModule`)
- Nodemailer email service.
- Available but not currently wired to order/auth events.

---

## Database Schema

### Key Entity Relationships
- `User` → `Brand` via `BrandUser` (M:M with roles)
- `Brand` → `Product` (1:M, cascade delete)
- `Product` → `ProductVariant` (1:M, cascade — **entity exists but not used**)
- `Product.variants` — deprecated JSON column (currently active)
- `User` → `Order` (1:M) → `OrderItem` (1:M) + `OrderStatusHistory` (1:M)
- `User` → `Cart` (1:1) → `CartItem` (1:M)
- `User` → `Wishlist` (1:M, links user to product)
- `User` → `Address` (1:M — **entity exists, no controller/service**)
- `Product` → `ProductReview` (1:M)

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
| `/reviews/can-review/:productId` | GET | Auth | Check if user can review |
| `/reviews` | GET | Admin | Pending reviews list |
| `/reviews` | POST | Auth | Submit review |
| `/reviews/:id/approve` | PATCH | Admin | Approve review |
| `/reviews/:id/reject` | PATCH | Admin | Reject review |
