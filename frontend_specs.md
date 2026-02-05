# Frontend Specifications - Local Brands Mobile

The frontend is a high-performance, cross-platform mobile application built with **React Native** (Expo), utilizing **Expo Router** for type-safe, file-based navigation.

## Core Technologies
- **Framework**: React Native (via Expo 54+)
- **Navigation**: Expo Router (Typed Routes)
- **State Management**: React Context (Auth, Theme, Cart)
- **Networking**: Axios with custom interceptors for Bearer tokens.
- **Styling**: React Native Stylesheets with **Dynamic Theming** support.
- **Media**: Cloudinary integration with client-side processing.

---

## 🎨 Design System & Aesthetics
The application adheres to a "Premium/Luxury" aesthetic:
- **Typography**: Optimized for readability with varying font weights.
- **Colors**: Curated palettes for Light and Dark modes. Heavy use of **Linear Gradients** for primary actions.
- **Visual Effects**: Subtle micro-animations, glassmorphism (via `BlurView` where applicable), and soft shadows.
- **Feedback**: Immediate haptic/visual feedback on interactive elements.

---

## 🏗 App Structure & Navigation

### 1. Root Layout & Contexts
- `_layout.tsx`: Wraps the app in `ThemeProvider` and `AuthProvider`. Handles initial session restoration.

### 2. Main Discovery ([(tabs)/](file:///Users/f5rany/Documents/Work/local-brands/frontend/app/(tabs)/index.tsx))
- **Home (`index`)**: Segmented view for Products and Brands. Features "Recommendation" cards and "Brand of the Month" highlights.
- **Explore (`explore`)**: Real-time search with **Entity Badges** to distinguish between brand names and product titles.

### 3. Account & Identity (`auth/`, `profile.tsx`)
- **Register**: Multi-field onboarding with real-time validation and **Avatar Upload Progress**.
- **Profile**: Comprehensive settings including Personal Details, Order History, and Shipping Addresses.

### 4. Merchant Tools (`brands/`, `products/`)
- **Brand Management**:
  - `select.tsx`: A dashboard for multi-brand owners to switch contexts.
  - `[brandId]/edit`: Interface to update brand identity and location.
- **Inventory Control**:
  - `create/[brandId]`: Advanced product addition with variant support.
  - `edit/[productId]`: Full CRUD with status toggles (`DRAFT` -> `PUBLISHED`).

---

## 📸 Image Upload System (Cloudinary)
We implement a robust, centralized upload pipeline via the `useCloudinaryUpload` hook.

### 1. Processing Pipeline
1. **Selection**: `expo-image-picker` with enforced 1:1 aspect ratio for logos/variants.
2. **Compression**: `expo-image-manipulator` resizes images to a max width of 1200px and 0.8 quality to minimize upload payload.
3. **Upload**: `Axios` handles the POST request to Cloudinary with an `onUploadProgress` listener.

### 2. Components
- **`ImageUploadProgress`**: Displays a circular progress ring over a thumbnail.
  - States: `Idle` -> `Compressing` -> `Uploading (X%)` -> `Success`.

---

## 🔄 State Management & Logic
- **AuthContext**: Manages JWT lifecycle, user profile hydration, and role-based route protection.
- **ThemeContext**: Exposes `useThemeColor()` hook for semantic color switching.
- **Product Lifecycle**: Products/Brands are managed through distinct states:
  - **Draft**: Only visible to owner/staff.
  - **Published**: Publicly discoverable.
  - **Archived**: Hidden from search but remains in order history.

---

## 📡 Performance Optimizations
- **Image Cloudinary Transformations**: Automated fetching of optimized sizes (e.g., `w_400,c_fill,f_auto,q_auto`).
- **Debounced Search**: Discovery inputs wait 300ms before triggering API calls.
- **List Virtualization**: `SectionList` and `FlatList` used for large brand/product feeds.

