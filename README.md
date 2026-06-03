# TRYAM — AI-Powered Custom Apparel Platform 🎨👕

TRYAM is a next-generation custom merchandise platform that empowers users to design, personalize, and order high-quality apparel. Built with a powerful AI design studio and seamless e-commerce integration, TRYAM makes creating custom T-shirts, hoodies, and accessories effortless.

---

## 🚀 Tech Stack

### Frontend & UI
- **Framework:** React 19 + Vite (Fast compilation, HMR)
- **Routing:** React Router v7
- **Styling:** Tailwind CSS v4 + Framer Motion (Smooth animations)
- **Components:** Shadcn UI (Radix UI primitives)
- **Icons:** Lucide React
- **Design Studio:** Fabric.js (Canvas manipulation for designs)

### Backend & Infrastructure
- **Database:** Firebase Firestore (Real-time NoSQL database)
- **Authentication:** Firebase Auth (Secure user authentication)
- **Cloud Functions:** Firebase Functions (Order processing, Admin webhooks)
- **Payments:** Razorpay / Stripe integration

### SEO & Performance ⚡
- **Dynamic Meta Tags:** `react-helmet-async`
- **Pre-rendering:** `react-snap` (Generates ultra-fast static HTML for bots & SEO)
- **Image Optimization:** Dynamic recoloring using CSS `mix-blend-mode` and Canvas filtering to minimize payload size.

---

## 🌟 Key Features

1. **AI Design Studio (`/design`)** 
   - A fully featured canvas (powered by Fabric.js) allowing users to add text, upload images, and generate AI art directly onto a 3D/2D apparel mockup.
2. **Dynamic Storefront (`/store`)**
   - High-performance product catalog with search, filtering, and instant preview.
3. **Seamless Checkout Flow (`/checkout`)**
   - Secure payment integration with order tracking and Firebase-triggered backend processing.
4. **Admin Dashboard (`/admin`)**
   - Manage orders, update product catalogs, and handle user support directly from a secure admin panel.
5. **SEO Optimized**
   - Pre-rendered static pages, dynamic Open Graph tags, and an automated XML sitemap ensure high search engine visibility.

---

## 🛠️ Getting Started

### 1. Prerequisites
Ensure you have Node.js and a package manager (`npm`, `yarn`, or `pnpm`) installed.

### 2. Installation
Clone the repository and install dependencies:
```bash
npm install
```

### 3. Environment Variables
Create a `.env` or `.env.local` file in the root directory and add your Firebase and Payment Gateway keys:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_RAZORPAY_KEY_ID=your_razorpay_key
```

### 4. Running the Development Server
Start the local Vite server:
```bash
npm run dev
```
Navigate to `http://localhost:5173` to view the application.

---

## 📦 Build & Deployment

To build the application for production, run:
```bash
npm run build
```
*(Note: Because of our SEO optimization, `react-snap` will automatically run post-build to pre-render the static HTML files for the landing and store pages).*

---

## 📂 Project Structure Overview

- `src/pages/` - Core route components (Landing, Storefront, Dashboard, Admin).
- `src/components/` - Reusable UI components, Shadcn elements, and the global `<SEO>` wrapper.
- `src/hooks/` - Custom React hooks for Firebase Auth, Cart state, and Translation.
- `src/context/` - Global state providers (Cart, Auth, etc.).
- `functions/` - Node.js Firebase Cloud functions for secure backend processing (Order webhooks, Bot triggers).
- `public/` - Static assets, `robots.txt`, and `sitemap.xml`.

---

*Wear Your Imagination.*
