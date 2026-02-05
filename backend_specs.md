# Backend Specifications - Local Brands API

The backend is a robust RESTful API built with **NestJS**, utilizing **TypeScript** for type safety, **TypeORM** for Object-Relational Mapping, and **PostgreSQL** as the primary data store.

## Core Technologies
- **Framework**: NestJS 11+
- **Database**: PostgreSQL 15+
- **ORM**: TypeORM with Data Source configuration.
- **Authentication**: JWT-based stateless authentication with Passport.js.
- **Validation**: Strict input validation using `class-validator` and `class-transformer`.
- **Media**: Integrated Cloudinary SDK for secure, signed/unsigned image management.
- **Documentation**: Auto-generated Swagger UI at `/api`.

---

## 🛠 System Architecture & Modules

### 1. Authentication & Security (`AuthModule`)
- **Identity Provider**: Custom JWT implementation with configurable TTL.
- **Role-Based Access Control (RBAC)**:
  - `ADMIN`: Full platform access.
  - `BRAND_OWNER`: Access to own brands, products, and sales stats.
  - `CUSTOMER`: Public discovery and personal order management.
- **Guards**:
  - `JwtAuthGuard`: Enforces valid token presence.
  - `RolesGuard`: Validates user role against route metadata.
  - `BrandAccessGuard`: A specialized guard that validates if the authenticated user has legitimate access (Owner/Staff) to a specific `brandId` provided in the request body or params.
- **Security Features**:
  - Bcrypt password hashing (salt rounds: 10).
  - Domain-locked Cloudinary upload policies.

### 2. Brands & Governance (`BrandsModule`)
- **Entities**: 
  - `Brand`: Core identity (name, logo, location, description).
  - `BrandUser`: Junction table for RBAC within a brand. Includes `role` (`OWNER`, `STAFF`) and granular scopes like `canManageProducts`.
- **Content Lifecycle**:
  - **Statuses**: `DRAFT` (internal), `PUBLISHED` (public), `ARCHIVED` (soft-deleted from public).
  - **Soft Delete**: Uses TypeORM's `@DeleteDateColumn` for `deletedAt` tracking. Brands are never permanently removed from the DB unless explicitly purged.
- **Logic**: Automatic filtering of non-published brands for public endpoints while allowing full access for owners.

### 3. Products & Content (`ProductsModule`)
- **Entities**:
  - `Product`: Base product data (price, salePrice, stock, status).
  - `ProductVariant`: Managed as a nested structure or related entity (JSONB/Table) containing `color`, `size`, and `variantImages`.
- **Guardrails**:
  - **Price Validation**: Database-level check constraint ensures `salePrice <= price`.
  - **Image Limits**: Enforcement of 1-5 Cloudinary URLs per product/variant.
- **Discovery Logic**: 
  - Advanced search using `ILike` and weighted priority.
  - Pagination handled via `take` and `skip` with total count return.
  - Status management: `DRAFT`, `PUBLISHED`, `ARCHIVED`.

### 4. Orders & Fulfillment (`OrdersModule`)
- **Process**:
  - **Snapshotting**: Product details (name, price, image) are cloned into `OrderItem` at creation to preserve historical price/data integrity.
  - **Status Enum**: `PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`.
- **[NEW] Status History**:
  - `OrderStatusHistory`: Records every transition. Each entry stores:
    - `oldStatus` / `newStatus`
    - `changedBy` (User ID)
    - `notes` (e.g., "Courier picked up parcel")
    - `createdAt`
- **Integrity**: Stock deduction occurs upon `CONFIRMED` status.

### 5. Statistics & Analytics (`StatisticsModule`)
- **Aggregations**:
  - **Admin**: Platform-wide revenue, user growth, and active brand counts.
  - **Brand Owner**: Brand-specific sales, top products, and inventory warnings.
- **Performance**: Optimized SQL queries with proper indexing on `brandId` and `createdAt`.

---

## 📁 Data Integrity & Patterns

### Soft Delete Mechanism
- All major entities (`Brand`, `Product`, `User`) implement **Soft Delete**.
- Queries default to `where: { deletedAt: IsNull() }`.
- Restoring is possible via the `restore()` method in Services.

### Image Management (Cloudinary)
- **Validation**: Only URLs matching `*.cloudinary.com/dg4l2eelg/*` are accepted in the persistence layer.
- **Formats**: Enforced `webp` or `jpg` via frontend transformations.

---

## 📡 API Reference (Notable Endpoints)

| Endpoint | Method | Role | Description |
| :--- | :--- | :--- | :--- |
| `/auth/register` | `POST` | Public | Enhanced registration with avatar support. |
| `/brands/:id/status` | `PATCH` | Owner/Admin | Transition brand status (Draft -> Published). |
| `/orders/:id/track` | `GET` | Customer/Owner | Fetch detailed Status History timeline. |
| `/statistics/brand/:id`| `GET` | Owner/Admin | Visual-ready data for dashboard charts. |

