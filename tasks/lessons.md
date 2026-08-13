# Lessons Learned

## Testing

### DB safety guard required for e2e tests
All e2e tests truncate ALL tables. Running without isolation = dev DB wiped.
**Rule:** Always set DB_DATABASE to a name ending `_test_db`. Guard throws at startup if not.
**Implementation:** `backend/test/setup-e2e.ts` loaded via `setupFiles` in `jest-e2e.json`.

### Shared helpers prevent setup drift
11 specs had identical 10-line `beforeAll` + 9-line truncate `beforeEach`. When AppModule API changed, all 11 broke together.
**Rule:** Extract any repeated test setup into `test/helpers/`. Update one file, not eleven.
**Implementation:** `createTestApp()` + `truncateAll()` in `test/helpers/`.

### Frontend component tests need aggressive mocking
React Native screens import many expo and RN modules that aren't available in Jest's Node environment.
**Rule:** Mock at module level (top of test file, before imports) for: expo-router, expo-notifications, expo-secure-store, expo-apple-authentication, react-native-safe-area-context, all custom contexts.
**Implementation:** See `frontend/jest.setup.ts` for shared mocks.

### E2E is the only layer that catches integration bugs
Unit tests pass, e2e tests pass, but real flows break when context is missing or API shape changes.
**Rule:** Always write at least one Maestro flow for each new user-facing feature.
**Implementation:** `.maestro/` flows for login, add-to-cart, checkout.

### app.e2e-spec.ts should use beforeAll not beforeEach
Original scaffold used `beforeEach` to boot the full NestJS app — rebuilt for every single test. Extremely slow.
**Rule:** Boot app once in `beforeAll`, close in `afterAll`. Only truncate data in `beforeEach`.

### RTLN v14: renderHook and act are async
`renderHook()` returns a Promise — always `await` it. `result.current` is null until resolved.
**Rule:** `const { result } = await renderHook(...)`. For throws: `await expect(renderHook(...)).rejects.toThrow()` — NOT `expect(() => renderHook(...)).toThrow()`.

### Un-awaited act() leaks state between tests
Calling `act(() => {...})` without `await` schedules state updates that flush AFTER the test ends. The next test's `renderHook` resolves with `result.current = null` because the stale update corrupts RTLN's HookContainer.
**Rule:** Always `await act(async () => { ... })` — even for synchronous state setters.

### Animated.loop blocks `await render()`
Screens with marquee animations (`Animated.loop`) never settle, so `await render()` hangs indefinitely in RTLN v14.
**Rule:** Use `render()` (no await) + `screen.getByText(...)` inside `waitFor()` for any screen that has looping animations.

### useFocusEffect mock must use useEffect, not direct call
`useFocusEffect: (cb) => cb()` fires the callback synchronously during React's render phase. If the callback sets state with an empty array `[]`, a new reference is created each render → infinite re-render loop.
**Rule:** Mock as `useFocusEffect: (cb: any) => React.useEffect(cb, [])`. Use `require('react')` inside the `jest.mock` factory because mocks are hoisted before imports.

### Screen text assertions must match runtime transforms
Many screens call `.toUpperCase()` on product names and section labels before rendering.
**Rule:** Check what the component actually renders — search for `toUpperCase` in the component source. Write assertions against the rendered string, not the raw data value.

### jest.mock default export needs `__esModule: true`
`import Default, { named }` with a mock factory that returns `{ default: X, named: Y }` without `__esModule: true` causes Babel to treat the whole object as the default export. `Default.something` becomes undefined.
**Rule:** Always include `__esModule: true` in mock factories when the real module uses ES default exports.

### Stub heavy Python deps via sys.modules before importing target
`torch` and `transformers` are not installed in lean CI environments, but `main.py` imports them at module level. `import main` fails with `ModuleNotFoundError`.
**Rule:** At the top of test files (before any `import main`): `sys.modules.setdefault("torch", MagicMock())` and `sys.modules.setdefault("transformers", MagicMock())`. Create a `requirements-test.txt` with only test-needed deps (fastapi, PIL, pytest) — skip the 1GB ML packages.

## General

### Stale files rot silently
`cart.service copy.ts` was in the production source tree. TypeScript compile didn't break, but any search/IDE results were polluted.
**Rule:** Delete dead files immediately when discovered. Don't leave "for reference" copies in source.
