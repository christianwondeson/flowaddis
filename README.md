# BookAddis - Ethiopian Travel & Tourism Platform

![BookAddis](https://img.shields.io/badge/version-0.1.0-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16.0.10-black.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-blue.svg)
![License](https://img.shields.io/badge/license-Private-red.svg)

BookAddis is a comprehensive travel and tourism platform for Ethiopia, offering flight bookings, hotel reservations, conference management, shuttle services, and more. Built with Next.js 16, TypeScript, and Firebase.

## 🌟 Features

### Core Features
- **Flight Booking** - Search and book flights with real-time availability via RapidAPI
- **Hotel Reservations** - Browse and book hotels with detailed information, photos, and reviews
- **Conference Management** - Organize and manage conferences and events
- **Shuttle Services** - Book shuttle transportation services
- **User Authentication** - Secure authentication with Firebase (Email/Password, Google, 2FA)
- **Payment Integration** - Multiple payment methods:
  - Local: Telebirr, CBE Birr
  - International: Stripe (Credit/Debit Cards)
- **Admin Dashboard** - Comprehensive admin panel for managing bookings, users, and content
- **Real-time Updates** - Live booking status and notifications

### Additional Features
- Interactive maps with Leaflet
- PDF ticket generation
- QR code booking confirmations
- Responsive design for all devices
- Multi-language support ready
- SEO optimized

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4.0
- **UI Components:** Radix UI
- **Animations:** Framer Motion
- **State Management:** Zustand
- **Forms:** React Hook Form + Zod validation
- **Data Fetching:** TanStack Query (React Query)

**Backend & Services:**
- **Authentication:** Firebase Auth
- **Database:** Firebase Firestore
- **Storage:** Firebase Storage
- **Payment Processing:** Stripe
- **External APIs:** RapidAPI (Flights & Hotels)

**Key Libraries:**
- `leaflet` & `react-leaflet` - Interactive maps
- `date-fns` - Date manipulation
- `axios` - HTTP client
- `jspdf` & `html2canvas` - PDF generation
- `qrcode.react` - QR code generation
- `sonner` - Toast notifications

### Project Structure

```
flowaddis/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/            # Authentication routes
│   │   ├── (bookings)/        # Booking-related routes
│   │   ├── admin/             # Admin dashboard
│   │   ├── api/               # API routes
│   │   ├── booking/           # Booking flow pages
│   │   ├── dashboard/         # User dashboard
│   │   └── ...                # Other pages
│   ├── components/            # React components
│   │   ├── booking/           # Booking-related components
│   │   ├── ui/                # Reusable UI components
│   │   └── ...
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utility libraries
│   │   ├── firebase.ts        # Firebase configuration
│   │   ├── stripe.ts          # Stripe configuration
│   │   └── ...
│   ├── store/                 # Zustand stores
│   ├── styles/                # Global styles
│   ├── types/                 # TypeScript type definitions
│   └── middleware.ts          # Next.js middleware
├── public/                    # Static assets
│   ├── assets/images/         # Images and logos
│   └── ads/                   # Advertisement banners
├── .env.local                 # Environment variables
├── next.config.ts             # Next.js configuration
├── tailwind.config.ts         # Tailwind CSS configuration
└── package.json               # Dependencies
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Firebase project with Firestore, Auth, and Storage enabled
- Stripe account (for payments)
- RapidAPI account (for flight/hotel data)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd flowaddis
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables:**
   
   Create a `.env.local` file in the root directory:
   ```env
   # RapidAPI
   NEXT_PUBLIC_RAPIDAPI_KEY=your_rapidapi_key
   
   # Firebase
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
   NEXT_PUBLIC_FIREBASE_DATABASE_ID=your_database_id
   
   # Stripe
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   
   # Backend
   BACKEND_URL=https://api.bookaddis.com
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Building for Production

```bash
npm run build
npm start
```

## 🔐 Authentication

BookAddis uses Firebase Authentication with support for:
- Email/Password authentication
- Google OAuth
- Two-Factor Authentication (2FA)
- Password reset functionality

## 💳 Payment Integration

### Local Payment Methods
- **Telebirr** - Ethiopian mobile payment service
- **CBE Birr** - Commercial Bank of Ethiopia mobile banking

### International Payments
- **Stripe** - Credit/Debit card payments with secure checkout

Payment flow:
1. User selects items (flights, hotels, etc.)
2. Chooses payment method
3. Completes payment via respective gateway
4. Booking confirmation with QR code and PDF ticket

## 📱 Key Pages

| Route | Description |
|-------|-------------|
| `/` | Homepage with search functionality |
| `/signin` | User login |
| `/signup` | User registration |
| `/dashboard` | User dashboard with bookings |
| `/flights` | Flight search and booking |
| `/hotels` | Hotel search and booking |
| `/booking/success` | Booking confirmation page |
| `/admin` | Admin dashboard |
| `/conferences` | Conference listings |
| `/shuttles` | Shuttle service bookings |

## 🔧 Configuration

### Firebase Setup
1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication (Email/Password, Google)
3. Create a Firestore database
4. Enable Storage
5. Add your web app and copy the configuration

### Stripe Setup
1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get your API keys from the dashboard
3. Configure webhooks for payment events

### RapidAPI Setup
1. Sign up at [rapidapi.com](https://rapidapi.com)
2. Subscribe to flight and hotel APIs
3. Copy your API key

## 🧪 Development

### Code Style
- TypeScript for type safety
- ESLint for code quality
- Tailwind CSS for styling
- Component-based architecture

### Best Practices
- Use server components where possible
- Implement proper error boundaries
- Validate all user inputs with Zod
- Handle loading and error states
- Optimize images with Next.js Image component

## 📦 Deployment

### Firebase Hosting
The project is configured for deployment to Firebase Hosting:

```bash
npm run build
firebase deploy
```

### Vercel
Alternatively, deploy to Vercel:

```bash
vercel deploy
```

## 🤝 Contributing

This is a private project. For authorized contributors:
1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

Private - All rights reserved

## 🆘 Support

For issues or questions, contact the development team.

## 🗺️ Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Multi-language support (Amharic, Oromo)
- [ ] Loyalty program integration
- [ ] AI-powered travel recommendations
- [ ] Social features and reviews
- [ ] Integration with more local payment providers

---

**Built with ❤️ for Ethiopian travelers**
