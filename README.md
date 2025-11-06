# Pallihaat Frontend

[![Deployed on Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?style=for-the-badge&logo=vercel)](https://local-market-store-fe.vercel.app/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2.5-000000?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.2.0-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.13-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/0cd86962-288a-4f21-8baa-9c0219c9176a" />
<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/9b302ec8-0bac-4776-8d81-243abc80d677" />
<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/ec5a5084-1dfe-485a-98c3-ef1a5c9295b4" />
<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/2c9c4fec-8fa0-4b68-addb-c15d9d32c27e" />
<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/c54d640f-4bab-45a4-b05b-7a4ef20327ad" />
<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/f2460f8b-1c2e-4f29-886a-f1b912309596" />
<img width="1366" height="768" alt="image" src="https://github.com/user-attachments/assets/0751e504-35f4-482c-9e12-8c0aecae771e" />


A modern, responsive React frontend for the Pallihaat digital marketplace, built with Next.js 14 and featuring multi-language support, real-time search, interactive maps, and a comprehensive producer dashboard.

## 🎨 Design System

### UI Framework
- **Next.js 14**: App Router with server and client components
- **React 18**: Latest React features with concurrent rendering
- **Tailwind CSS**: Utility-first CSS framework
- **Custom Components**: Reusable component library

### Key Dependencies
- `next-intl`: Internationalization framework
- `react-leaflet`: Interactive maps integration
- `embla-carousel-react`: Image carousel component
- `react-dropzone`: File upload interface
- `react-modal`: Modal dialogs
- `react-toastify`: Toast notifications
- `react-select`: Advanced select components
- `recharts`: Data visualization charts
- `firebase`: Push notification client

## 🚀 Features

### 🌐 Multi-language Support
- **Languages**: English, Hindi, and Odia
- **next-intl Integration**: Client-side locale switching
- **Dynamic Loading**: Optimized bundle splitting
- **RTL Ready**: Framework support for right-to-left languages

### 🗺️ Interactive Maps
- **React Leaflet**: Open-source map library
- **MapLibre GL**: Modern map rendering engine
- **Location Picker**: Click-to-select coordinates
- **Geolocation API**: Browser location access
- **Address Autofill**: Map-based address completion

### 🔍 Advanced Search Experience
- **Real-time Search**: Instant results with debouncing
- **Filter System**: Category, price, location filters
- **Search Suggestions**: Dropdown with product previews
- **Mobile Optimized**: Touch-friendly search interface

### 🛒 E-commerce Features
- **Shopping Cart**: Persistent cart with local storage
- **Product Gallery**: High-quality image carousels
- **Bulk Discounts**: Visual discount indicators
- **Inventory Tracking**: Real-time stock updates
- **Quick Actions**: One-click cart additions

### 👤 User Experience
- **Responsive Design**: Mobile-first approach
- **Progressive Web App**: PWA-ready architecture
- **Offline Support**: Service worker caching
- **Accessibility**: WCAG compliant components
- **Performance**: Optimized loading and rendering

### 🧑‍🌾 Producer Dashboard
- **Analytics Charts**: Revenue and order trends
- **KYC Management**: Document upload and status tracking
- **Product Management**: CRUD operations with image uploads
- **Order Fulfillment**: Real-time order status updates
- **Wallet Tracking**: Earnings and payout history

### 👨‍💼 Admin Interface
- **User Management**: Producer verification workflows
- **Category Management**: Product taxonomy administration
- **Order Monitoring**: Platform-wide order analytics
- **Dispute Resolution**: Administrative intervention tools
- **Platform Metrics**: Comprehensive dashboard analytics

## 📁 Project Structure

```
FE/
├── app/                          # Next.js App Router
│   ├── layout.js                 # Root layout component
│   ├── page.js                   # Homepage
│   ├── globals.css              # Global styles
│   ├── favicon.ico              # App favicon
│   ├── account/                  # User account pages
│   │   └── page.js
│   ├── admin/                    # Admin dashboard
│   │   ├── layout.js
│   │   ├── page.js
│   │   └── disputes/
│   │       └── page.js
│   ├── cart/                     # Shopping cart
│   │   └── page.js
│   ├── disputes/                 # Dispute management
│   │   └── page.js
│   ├── orders/                   # Order history
│   │   └── page.js
│   ├── producer/                 # Producer dashboard
│   │   ├── layout.js
│   │   ├── page.js
│   │   ├── analytics/
│   │   │   └── page.js
│   │   ├── disputes/
│   │   │   └── page.js
│   │   ├── kyc/
│   │   │   └── page.js
│   │   ├── orders/
│   │   └── products/
│   │       └── page.js
│   ├── producers/                # Producer listings
│   │   └── page.js
│   ├── producer-profile/         # Producer profiles
│   │   └── [id]/
│   │       └── page.js
│   ├── shop/                     # Product catalog
│   │   ├── page.js
│   │   └── [id]/
│   │       └── page.js
│   ├── signin/                   # Authentication
│   │   └── page.js
│   └── signup/
│       └── page.js
├── components/                   # Reusable components
│   ├── AddressModal.js          # Address management
│   ├── AdminSidebar.js          # Admin navigation
│   ├── CategoriesCarousel.js    # Category browser
│   ├── ChangePasswordModal.js   # Password reset
│   ├── CheckoutModal.js         # Payment checkout
│   ├── CircleSpinner.js         # Loading spinner
│   ├── DocumentViewerModal.js   # Document preview
│   ├── HomeBestSellers.js       # Featured products
│   ├── HomeCarousel.js          # Hero carousel
│   ├── HomeCategoryProducts.js  # Category products
│   ├── Loader.js                # Page loader
│   ├── LocaleProvider.js        # i18n provider
│   ├── LocationCapture.js       # Location picker
│   ├── MapWithSearch.js         # Map integration
│   ├── MiniCartToast.js         # Cart notifications
│   ├── Navbar.js                # Main navigation
│   ├── ProducerReviewsModal.js  # Review display
│   ├── ProducerSidebar.js       # Producer navigation
│   ├── RootNavbar.js            # Root navigation
│   ├── UpdateProfileProducerModal.js # Profile editor
│   ├── UserPushInit.js          # Push notification setup
│   ├── home/                    # Home page components
│   │   ├── FeaturedFarmers.js
│   │   ├── NewsletterButton.js
│   │   └── ValuePropositions.js
│   └── i18n/                    # i18n components
│       └── I18nText.js
├── lib/                         # Utility libraries
│   ├── firebase.js              # Firebase client setup
│   └── api/                     # API client functions
│       ├── addresses.js
│       ├── admin.js
│       ├── cart.js
│       ├── categories.js
│       ├── disputes.js
│       ├── orders.js
│       ├── producers.js
│       ├── productDetails.js
│       ├── products.js
│       ├── push.js
│       ├── pushUser.js
│       ├── reviews.js
│       └── search.js
├── public/                      # Static assets
│   ├── carousel.jpeg
│   ├── carousel2.jpg
│   ├── cart.jpg
│   ├── delivery.jpg
│   ├── file.svg
│   ├── firebase-messaging-sw.js # Service worker
│   ├── globe.svg
│   ├── market.jpg
│   ├── next.svg
│   ├── placeholder.png
│   ├── vercel.svg
│   ├── window.svg
│   ├── home-carousel/           # Carousel images
│   │   ├── 1.png
│   │   ├── 2.png
│   │   └── 3.png
│   └── icons/                   # UI icons
│       ├── clothes.png
│       ├── crafts.png
│       ├── delivery.png
│       ├── gadgets.png
│       ├── groceries.png
│       ├── pallihaat.png
│       ├── security_icon.png
│       └── shop_verified.png
├── i18n/                        # Internationalization
│   ├── messages/
│   │   ├── en.json             # English translations
│   │   ├── hi.json             # Hindi translations
│   │   └── or.json             # Odia translations
│   └── middleware.js           # i18n middleware
├── utils/                       # Helper functions
│   └── locationUtils.js        # Location utilities
├── next.config.mjs             # Next.js configuration
├── package.json                # Dependencies
├── postcss.config.js           # PostCSS configuration
├── tailwind.config.js          # Tailwind configuration
├── jsconfig.json               # JavaScript configuration
└── eslint.config.mjs           # ESLint configuration
```

## 🎨 Styling Architecture

### Tailwind CSS Configuration
- **Custom Design System**: Extended color palette and typography
- **Component Variants**: Consistent button and form styles
- **Responsive Utilities**: Mobile-first breakpoint system
- **Dark Mode Ready**: CSS variable-based theming

### Component Patterns
- **Compound Components**: Related components grouped together
- **Render Props**: Flexible component APIs
- **Custom Hooks**: Reusable stateful logic
- **Context Providers**: Global state management

## 🌐 Internationalization

### next-intl Integration
- **Client-side Switching**: Dynamic locale changes
- **Server Components**: SSR-compatible translations
- **Pluralization**: Advanced number formatting
- **Date/Time Formatting**: Localized date displays

### Language Support
- **English (en)**: Complete translation coverage
- **Hindi (hi)**: Native language support for Indian market
- **Odia (or)**: Regional language support

## 🗺️ Maps Integration

### React Leaflet Setup
- **MapLibre Tiles**: Open-source map tiles
- **Location Markers**: Interactive producer locations
- **Address Search**: Geocoding integration
- **Coordinate Selection**: Click-to-select functionality

### Geolocation Features
- **Browser API**: Native location permissions
- **Fallback Handling**: Manual address input
- **Accuracy Optimization**: High-precision coordinates

## 🔍 Search Implementation

### Real-time Search
- **Debounced Input**: Optimized API calls
- **Instant Results**: Live search suggestions
- **Filter Persistence**: URL-based filter state
- **Mobile Keyboard**: Search-friendly mobile UX

### Advanced Filtering
- **Category Filters**: Hierarchical product categories
- **Price Range**: Min/max price sliders
- **Location Radius**: Distance-based filtering
- **Stock Status**: In-stock only options

## 🔔 Push Notifications

### Firebase Integration
- **Service Worker**: Background message handling
- **Token Management**: Secure FCM token registration
- **Foreground Messages**: Real-time toast notifications
- **Permission Handling**: User consent management

## 📊 Data Visualization

### Recharts Integration
- **Producer Analytics**: Revenue and order charts
- **Admin Dashboard**: Platform performance metrics
- **Interactive Tooltips**: Detailed data exploration
- **Responsive Charts**: Mobile-optimized visualizations

## 🚀 Performance Optimizations

### Next.js Features
- **App Router**: Modern routing architecture
- **Server Components**: Optimized server rendering
- **Image Optimization**: Automatic image optimization
- **Code Splitting**: Automatic bundle splitting

### Frontend Optimizations
- **Lazy Loading**: Component and route lazy loading
- **Memoization**: React.memo and useMemo usage
- **Virtual Scrolling**: Large list optimization
- **Caching**: Browser cache utilization

## 📱 Responsive Design

### Mobile-First Approach
- **Breakpoint System**: Tailwind responsive utilities
- **Touch Interactions**: Mobile-optimized gestures
- **Navigation Patterns**: Mobile-friendly navigation
- **Performance**: Optimized for mobile networks

### Progressive Enhancement
- **Core Functionality**: Works without JavaScript
- **Enhanced Features**: JavaScript-powered enhancements
- **Accessibility**: Screen reader compatibility
- **Cross-browser**: Modern browser support

## 🔧 Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Installation

1. **Clone repository**
   ```bash
   git clone https://github.com/your-username/pallihaat.git
   cd pallihaat/FE
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   npm start
   ```

### Environment Variables

```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=https://your-backend-url.com/api

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Internationalization
NEXT_PUBLIC_DEFAULT_LOCALE=en
```

## 🚀 Deployment

### Vercel Deployment

1. **Connect repository**
   ```bash
   vercel --prod
   ```

2. **Configure build settings**
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

3. **Set environment variables** in Vercel dashboard

### Build Optimization

- **Static Generation**: Optimized static page generation
- **Image Optimization**: Automatic WebP conversion
- **Bundle Analysis**: Webpack bundle analyzer integration
- **CDN Integration**: Global asset delivery

## 🧪 Testing Strategy

### Component Testing
- **React Testing Library**: Component behavior testing
- **Jest**: Test runner and assertion library
- **Mock Service Worker**: API mocking for tests

### E2E Testing
- **Playwright**: Cross-browser end-to-end testing
- **Visual Regression**: Screenshot comparison testing
- **Performance Testing**: Lighthouse CI integration

## 🔍 SEO Optimization

### Next.js SEO
- **Meta Tags**: Dynamic meta tag generation
- **Structured Data**: JSON-LD schema markup
- **Open Graph**: Social media optimization
- **Sitemap**: Automatic sitemap generation

### Performance SEO
- **Core Web Vitals**: Optimized loading metrics
- **Image Optimization**: WebP and responsive images
- **Code Splitting**: Optimized bundle sizes
- **Caching**: Effective caching strategies

## ♿ Accessibility

### WCAG Compliance
- **Semantic HTML**: Proper document structure
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Readers**: ARIA labels and descriptions
- **Color Contrast**: WCAG AA compliant colors

### Inclusive Design
- **Font Sizing**: Readable typography scales
- **Touch Targets**: Adequate touch target sizes
- **Focus Management**: Visible focus indicators
- **Error Handling**: Clear error messaging

## 🔧 Developer Experience

### Development Tools
- **ESLint**: Code quality and consistency
- **Prettier**: Automatic code formatting
- **TypeScript Ready**: TypeScript configuration prepared
- **Hot Reload**: Fast development iteration

### Code Quality
- **Component Composition**: Reusable component patterns
- **Custom Hooks**: Logic extraction and reuse
- **Error Boundaries**: Graceful error handling
- **Performance Monitoring**: React DevTools integration

---

*Modern React frontend delivering exceptional user experiences for farmer-to-consumer marketplace connections*
