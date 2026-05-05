# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Local Brands** is a mobile-first e-commerce platform built as a monorepo with:
- `/backend` — NestJS 11 REST API (TypeScript, TypeORM, PostgreSQL)
- `/frontend` — React Native / Expo 54 mobile app (iOS, Android, Web)

## Commands

### Backend (`/backend`)

```bash
npm run start:dev       # Development with hot reload
npm run build           # Compile TypeScript
npm run start:prod      # Run compiled production build

npm run lint            # ESLint with auto-fix
npm run format          # Prettier formatting

npm test                # Unit tests (Jest, files matching *.spec.ts in src/)
npm run test:watch      # Watch mode
npm run test:cov        # Coverage report
npm run test:e2e        # E2E tests (Jest, files matching *.e2e-spec.ts in test/)

# Run a single test file
npx jest src/orders/orders.service.spec.ts
# Run a single e2e test
npx jest --config ./test/jest-e2e.json test/orders.e2e-spec.ts
```

### Frontend (`/frontend`)

```bash
npm start               # Start Expo dev server
npm run android         # Launch on Android
npm run ios             # Launch on iOS
npm test                # Jest tests (jest-expo preset)
npm run lint            # Expo lint
```

### Infrastructure

```bash
docker compose up -d    # Start PostgreSQL + backend
docker compose down     # Stop services
```

## Architecture

### Backend

**NestJS module structure** — each domain is a self-contained module under `src/`:

| Module | Responsibility |
|--------|---------------|
| `auth` | JWT login, guest login, Google/social login, registration, Passport strategies |
| `users` | User CRUD, admin user management |
| `brands` | Brand CRUD, brand ownership via `BrandUser` junction |
| `products` | Product lifecycle (DRAFT → PUBLISHED → ARCHIVED), variants, similar products |
| `cart` | Per-user shopping cart |
| `orders` | Full order lifecycle with status history and idempotency |
| `wishlist` | Saved products per user |
| `reviews` | Product reviews and ratings |
| `statistics` | Analytics and reporting |
| `feed` | Social posts with visual product tagging (`PostProduct` pins on images) |
| `notifications` | In-app notifications, push notifications (Expo), notify-me subscriptions |
| `promo-codes` | Promo code creation, validation, usage tracking |
| `shipping` | Shipping zones, rates, carrier tracking |
| `returns` | Return requests, return policies per brand |
| `size-guides` | Size guides at product or brand level |
| `bundles` | Product bundles |
| `product-questions` | Product Q&A (questions + brand answers) |
| `email-campaigns` | Email campaigns with Bull queue processor |
| `image-search` | CLIP-based visual image search with `ProductEmbedding` entity |
| `try-on` | Virtual try-on service |
| `referrals` | Referral system |
| `addresses` | User address book |
| `common/mail` | Nodemailer email service |

**Database**: PostgreSQL 14, managed via TypeORM with `synchronize: true` (no migration files — schema syncs automatically on boot).

**Authentication flow**:
1. `POST /auth/login` → validates credentials → returns JWT
2. `POST /auth/google` → social login via Google OAuth → returns JWT
3. JWT payload contains `{ id, role, isGuest, iat, exp }`
4. Guards applied per route: `JwtAuthGuard`, `RolesGuard`, `BrandAccessGuard`, `RegisteredUsersOnlyGuard`
5. `UserRole` enum: `ADMIN`, `BRAND_OWNER`, `CUSTOMER`, `GUEST`
6. `GuestCleanupService` periodically removes stale guest accounts

**Key entity relationships**:
- `User` → `Brand` via `BrandUser` (a user can own multiple brands; one user can have different roles per brand)
- `Brand` → `Product` (1:M, cascade delete)
- `Product` → `ProductVariant` (1:M, each variant tracks color + stock + images; replaces deprecated `variants` JSON field)
- `Product` → `ProductEmbedding` (1:1, CLIP vector for image search)
- `User` → `Order` (1:M) → `OrderItem` (1:M) + `OrderStatusHistory` (1:M audit trail)
- `User` → `Cart` (1:1) → `CartItem` (1:M)
- `User` → `Wishlist` (1:M, each record links a user to a product)
- `Post` → `PostProduct` (1:M, tagged product pins with x/y coordinates on image)
- `Brand` → `ReturnPolicy` (1:1) + `ShippingZone` (1:M) + `SizeGuide` (1:M)
- `PromoCode` → `PromoCodeUsage` (1:M, per-user usage tracking)

**Multi-brand context**: `BrandUser` allows `BRAND_OWNER` users to manage multiple brands. `BrandAccessGuard` scopes requests to the brand the user actually owns.

### Infrastructure

**Services** (docker-compose):
- `postgres` — PostgreSQL 14
- `backend` — NestJS API
- `clip-service` — Python FastAPI service (`/clip-service`) for CLIP image embeddings, used by `image-search` module

### Frontend

**Expo Router** (file-based routing) with the following top-level route groups:
- `(tabs)/` — main tab navigation (home, shop, feed, brands, wishlist)
- `auth/` — unauthenticated screens (login, register, forgot/reset password)
- `brands/[brandId]/` — brand storefront + owner management sub-routes:
  - `dashboard`, `edit`, `posts`, `orders`, `bundles`, `promo-codes`, `returns`, `return-policy`, `shipping`, `size-guides`, `email-campaigns`
- `products/`, `cart/`, `checkout/`, `orders/`, `wishlist/`, `profile/`, `users/`
- `returns/` — customer return flow (create, list, detail)
- `feed/` — post detail with shoppable product pins
- `notifications/` — notification inbox + settings
- `manage/` — admin management + settings
- `info/` — static pages (about, privacy, terms, shipping, returns, contact)
- `referral/` — referral program

**Context providers** (all wrapped in root `_layout.tsx`):
- `AuthContext` — JWT token storage (AsyncStorage), user state, token expiration polling every 5 minutes, `login()` / `logout()` / `refreshUser()`
- `BrandContext` — active brand selection; `productListVersion` + `productVersions` map for targeted product cache invalidation; call `invalidateProduct(id)` after editing a product to trigger refetch in product detail screen
- `ToastContext` — global toast notifications
- `NetworkContext` — online/offline detection
- `HeaderVisibilityContext` — hide/show header on scroll
- `ScrollToTopContext` — scroll-to-top trigger across tabs

**Key hooks**:
- `useCloudinaryUpload` — image upload to Cloudinary
- `useImageSearch` — CLIP-based visual search via clip-service
- `useRecentlyViewed` — recently viewed products (AsyncStorage)
- `useSearchHistory` — persisted search history
- `useSocialAuth` — Google OAuth login flow

**HTTP**: Axios with the backend base URL configured via environment variable. Auth token is attached per-request from `AuthContext`.

**Media**: Cloudinary (`@cloudinary/react`, `@cloudinary/url-gen`) for product image uploads, accessed via `useCloudinaryUpload` hook.

**Styling**: NativeWind (Tailwind CSS for React Native) available alongside StyleSheet. Theme tokens live in `constants/Colors.ts`, accessed via `useThemeColors()` hook.

## Environment Variables

Backend reads from `.env`:
```
DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE
JWT_SECRET
```

Frontend reads from `.env`:
```
EXPO_PUBLIC_API_URL              # Backend base URL
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID # Google OAuth client ID
```

Root `.env` is used by docker-compose to seed PostgreSQL credentials.

`clip-service` runs on port 8001 (internal). Backend `image-search` module calls it directly — no env var needed unless overriding the default URL.

## Key Conventions

- **ProductVariant entity** (`product-variant.entity.ts`) is the current approach for tracking per-color stock. The `variants` JSON column on `Product` is deprecated — do not add new logic to it.
- **Order idempotency**: orders carry an `idempotencyKey` (UUID) to prevent duplicate submissions.
- **Soft deletes**: `User`, `Product`, and `Order` use TypeORM `@DeleteDateColumn` — use `softDelete()` / `softRemove()`, not hard deletes.
- **Swagger**: Backend exposes OpenAPI docs (via `@nestjs/swagger`). Decorate new endpoints and DTOs accordingly.
- **DTO validation**: All request bodies use `class-validator` decorators. New DTOs go in a `dto/` subfolder within the relevant module.
