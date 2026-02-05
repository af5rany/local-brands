# Local Brands - Premium E-Commerce Platform

A cross-platform e-commerce solution built with a focus on local brands, featuring high-performance discovery, advanced brand management, and secure multi-role access. This platform empowers local businesses by providing them with premium digital storefronts and robust inventory tools.

---

## 🚀 Technology Stack

### Backend (NestJS)
- **Framework**: NestJS 11 (TypeScript) for a scalable, modular architecture.
- **Database**: PostgreSQL with TypeORM for structured data and complex relations.
- **Security**: JWT-based RBAC (Admin, Brand Owner, Customer) and Scope-based permissions.
- **Media**: Cloudinary integration with signed upload policies.

### Frontend (React Native)
- **Framework**: Expo 54 with **Expo Router** for type-safe navigation.
- **UI Design**: Premium aesthetics using Vanilla CSS/Stylesheets, Linear Gradients, and micro-animations.
- **Performance**: Client-side image compression and debounced search optimizations.

---

## ✨ Core Features & Platform Value

### 👤 For Customers: Premium Discovery
- **Enhanced Onboarding**: Personalized sign-up with avatar support and data validation.
- **Visual Search**: Smart autocomplete with **Entity Badges** to distinguish between Brands and Products.
- **Real-time Tracking**: Visual timeline for order status history from "Pending" to "Delivered".

### 🏢 For Brand Owners: Merchant Mastery
- **Brand Context Switching**: Seamlessly manage multiple brands from a single dashboard.
- **Content Lifecycle**: Comprehensive status management (`Draft`, `Published`, `Archived`).
- **Media Optimization**: Integrated pipeline for logo and product variants with progress tracking.

### 🛡 For Admins: Platform Governance
- **Global Control**: Manage brand approvals, user roles, and platform-wide statistics.
- **Data Integrity**: Soft-delete mechanisms ensuring accidental data loss prevention.

---

## 📂 Project Documentation

Detailed specifications for each layer are available in the root directory:
- 🛠 **[Backend Specifications](file:///Users/f5rany/Documents/Work/local-brands/backend_specs.md)**: Details on entities, security guards, and API logic.
- 🎨 **[Frontend Specifications](file:///Users/f5rany/Documents/Work/local-brands/frontend_specs.md)**: Details on the design system, hook architecture, and routing.

---

## 🛠 Getting Started

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Expo Go (for mobile testing) or an Android/iOS emulator.

### Installation
1. **Clone the Repo**:
   ```bash
   git clone <repo-url>
   cd local-brands
   ```
2. **Infrastructure**:
   ```bash
   cd backend
   docker compose up -d
   ```
3. **Backend Setup**:
   ```bash
   npm install
   npm run start:dev
   ```
4. **Frontend Setup**:
   ```bash
   cd ../frontend
   npm install
   npx expo start
   ```

---
*Built with ❤️ to empower Local Brands.*

