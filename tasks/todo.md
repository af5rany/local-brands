# Testing — Phase 1 ✅ Done

- [x] Backend isolated test DB (.env.test + safety guard)
- [x] Shared e2e helpers (createTestApp, truncateAll)
- [x] Refactor 11 e2e specs to use shared helpers
- [x] Unit tests: auth, cart, orders, products services
- [x] Delete stale cart.service copy.ts
- [x] Frontend: install @testing-library/react-native, @testing-library/jest-native
- [x] Frontend: jest.setup.ts with expo module mocks
- [x] Frontend: component tests for login, cart, checkout, product detail
- [x] Maestro: login, add-to-cart, checkout flows
- [x] GitHub Actions CI (backend unit + e2e, frontend unit)
- [x] Create tasks/ folder (this file)

# Testing — Phase 2 ✅ Done

- [x] Frontend: brand owner flow component tests (dashboard, products, orders, promo-codes, returns, shipping)
- [x] Maestro: guest-checkout, wishlist, brand-owner-publish-product flows (+ social sign-in flows)

**Review:** 45/45 component tests green across 11 suites. Root causes documented in lessons.md (useFocusEffect mock, RTLN v14 async patterns, uppercase text matchers, Animated.loop hang).

# Testing — Phase 3 ✅ Done

- [x] Frontend hook unit tests (useRecentlyViewed, useSearchHistory, useCartCount, useInfiniteScroll, useGuestGuard, useBrandDetails, useImageSearch)
- [x] Frontend context tests (AuthContext, BrandContext, ToastContext)
- [x] clip-service pytest (health, /embed/image, /embed/image-url)
- [x] Coverage gates (frontend ≥50% lines, backend ≥20% lines in CI)
- [x] CI: clip-service job added (Python 3.11, requirements-test.txt, pytest)

**Review:** 94/94 frontend tests, 5/5 clip-service tests. All CI jobs (backend + frontend + clip-service) wired. Coverage floors enforced. Key lesson: sys.modules stub for torch/transformers lets clip-service tests run without the 1GB model download.
