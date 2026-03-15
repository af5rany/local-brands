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
| `auth` | JWT login, guest login, registration, Passport strategies |
| `users` | User CRUD, admin user management |
| `brands` | Brand CRUD, brand ownership via `BrandUser` junction |
| `products` | Product lifecycle (DRAFT → PUBLISHED → ARCHIVED), variants |
| `cart` | Per-user shopping cart |
| `orders` | Full order lifecycle with status history and idempotency |
| `wishlist` | Saved products per user |
| `reviews` | Product reviews and ratings |
| `statistics` | Analytics and reporting |
| `common/mail` | Nodemailer email service |

**Database**: PostgreSQL 14, managed via TypeORM with `synchronize: true` (no migration files — schema syncs automatically on boot).

**Authentication flow**:
1. `POST /auth/login` → validates credentials → returns JWT
2. JWT payload contains `{ id, role, isGuest, iat, exp }`
3. Guards applied per route: `JwtAuthGuard`, `RolesGuard`, `BrandAccessGuard`, `RegisteredUsersOnlyGuard`
4. `UserRole` enum: `ADMIN`, `BRAND_OWNER`, `CUSTOMER`, `GUEST`

**Key entity relationships**:
- `User` → `Brand` via `BrandUser` (a user can own multiple brands; one user can have different roles per brand)
- `Brand` → `Product` (1:M, cascade delete)
- `Product` → `ProductVariant` (1:M, each variant tracks color + stock + images; replaces deprecated `variants` JSON field)
- `User` → `Order` (1:M) → `OrderItem` (1:M) + `OrderStatusHistory` (1:M audit trail)
- `User` → `Cart` (1:1) → `CartItem` (1:M)
- `User` → `Wishlist` (1:M, each record links a user to a product)

**Multi-brand context**: `BrandUser` allows `BRAND_OWNER` users to manage multiple brands. `BrandAccessGuard` scopes requests to the brand the user actually owns.

### Frontend

**Expo Router** (file-based routing) with the following top-level route groups:
- `(tabs)/` — main tab navigation
- `auth/` — unauthenticated screens (login, register, forgot/reset password)
- `brands/`, `products/`, `cart/`, `checkout/`, `orders/`, `wishlist/`, `profile/`, `users/`

**Context providers** (all wrapped in root `_layout.tsx`):
- `AuthContext` — JWT token storage (AsyncStorage), user state, token expiration polling every 5 minutes, `login()` / `logout()` / `refreshUser()`
- `BrandContext` — active brand selection for multi-brand owners
- `ToastContext` — global toast notifications

**HTTP**: Axios with the backend base URL configured via environment variable. Auth token is attached per-request from `AuthContext`.

**Media**: Cloudinary (`@cloudinary/react`, `@cloudinary/url-gen`) for product image uploads, accessed via `useCloudinaryUpload` hook.

## Environment Variables

Backend reads from `.env`:
```
DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE
JWT_SECRET
```

Frontend reads from `.env`:
```
EXPO_PUBLIC_API_URL   # Backend base URL
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME
```

Root `.env` is used by docker-compose to seed PostgreSQL credentials.

## Key Conventions

- **ProductVariant entity** (`product-variant.entity.ts`) is the current approach for tracking per-color stock. The `variants` JSON column on `Product` is deprecated — do not add new logic to it.
- **Order idempotency**: orders carry an `idempotencyKey` (UUID) to prevent duplicate submissions.
- **Soft deletes**: `User`, `Product`, and `Order` use TypeORM `@DeleteDateColumn` — use `softDelete()` / `softRemove()`, not hard deletes.
- **Swagger**: Backend exposes OpenAPI docs (via `@nestjs/swagger`). Decorate new endpoints and DTOs accordingly.
- **DTO validation**: All request bodies use `class-validator` decorators. New DTOs go in a `dto/` subfolder within the relevant module.
