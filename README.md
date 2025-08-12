# Prayer Wall App

A comprehensive prayer sharing platform built with Next.js 15, TypeScript, Supabase, and Tailwind CSS. Organize prayers by weeks, support multiple user types, and provide rich interaction features with personal prayer management.

## ✨ Features

### 🙏 Core Prayer Features
- **Weekly Organization**: Prayers organized by Eastern Time Sunday-to-Saturday weeks
- **Guest & User Posting**: Both anonymous guests and registered users can submit prayers
- **Prayer Management**: Registered users can edit/delete their own prayers (current week only)
- **Interactive Engagement**: Like and comment system with expandable comment sections

### 🔔 My Prayers Dashboard
- **Personal Timeline**: Comprehensive view of all user's prayers with weekly grouping
- **Advanced Search & Filtering**: Real-time search with sorting by recency, likes, or comments
- **Prayer Analytics**: View engagement metrics including like counts and comment interactions
- **Export Capabilities**: Export prayers to PDF, TXT, or JSON formats with customizable options
- **Sharing Features**: Generate shareable links and QR codes for individual prayers

### 🔔 Prayer Reminders
- **Smart Scheduling**: Set custom reminders for specific prayers with flexible timing
- **Browser Notifications**: Native desktop notifications with permission management
- **Debug Testing Suite**: Comprehensive testing tools for reminder functionality validation
- **Persistent Settings**: Reminder preferences saved locally with automatic restoration

### 👤 User Management
- **Google OAuth**: Seamless authentication via Google
- **Guest Mode**: Browse and post without registration (limited features)
- **User Profiles**: Avatar support and user identification
- **Permission System**: Owner-only editing with proper authorization

### 🎨 User Interface
- **Responsive Design**: Optimized for desktop and mobile devices
- **Modern UI**: Clean card-based layout with consistent three-dot menus
- **Interactive Elements**: Smooth transitions, hover effects, and loading states
- **Accessibility**: Proper contrast, focus states, and semantic HTML

### 🌐 Multi-Environment Support
- **Production Ready**: Unified domain management and SEO optimization
- **Preview Testing**: Full functionality in Vercel preview deployments
- **Local Development**: Complete development environment setup
- **Smart Redirects**: Automatic OAuth handling across all environments

### 🔒 Security & Data
- **Row Level Security**: Supabase RLS policies for data protection
- **Authentication Guards**: API and UI level permission controls
- **Data Validation**: Input sanitization and content length limits
- **Privacy Controls**: User-specific content management

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- NPM or Yarn
- Supabase account
- Vercel account (for deployment)

### 1. Install dependencies
```bash
npm install
```

### 2. Environment Setup
Create a `.env.local` file with your Supabase credentials:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup
1. Set up your Supabase project with the required tables
2. Run the RLS migration script: `supabase-migrations-prayers-rls-edit-delete.sql`
3. Configure Google OAuth in Supabase Auth settings

### 4. OAuth Configuration
In your Supabase Dashboard → Authentication → URL Configuration, add:
```
http://localhost:3000/auth/callback  # Development
https://your-domain.vercel.app/auth/callback  # Production
```

### 5. Run the development server
```bash
npm run dev
```

### 6. Testing
```bash
npm test          # Run test suite  
npm run lint      # Check code quality
npm run build     # Test production build
```

## 🏗️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (Google OAuth)
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with Headless UI patterns
- **State Management**: React hooks + SWR for data fetching
- **Data Export**: jsPDF, html2canvas for PDF generation
- **QR Codes**: qrcode.react for sharing functionality
- **Date Handling**: date-fns for time formatting and calculations
- **Browser APIs**: Web Notifications API, LocalStorage
- **Testing**: Jest + React Testing Library + Custom test suites
- **Deployment**: Vercel
- **Code Quality**: ESLint + TypeScript

## 📁 Project Structure

```
prayer-wall-app/
├── app/                    # Next.js 15 App Router
│   ├── api/               # API routes
│   │   └── user/         # User-specific APIs (prayers, reminders)
│   ├── week/[date]/       # Weekly prayer walls
│   ├── my-prayers/        # Personal prayer dashboard
│   ├── reminders/         # Prayer reminder management
│   ├── login/             # Authentication
│   └── auth/callback/     # OAuth callback
├── components/            # React components
│   └── user/             # User-specific components (timeline, cards, modals)
├── lib/                   # Utility functions
├── types/                 # TypeScript definitions
├── tests/                 # Unified test directory
│   ├── api/              # API route tests
│   ├── components/       # Component tests
│   ├── integration/      # Integration tests
│   ├── lib/              # Library utility tests
│   ├── pages/            # Page component tests
│   ├── utils/            # Utility function tests
│   └── mocks/            # Test mocks and handlers
└── docs/                  # Development documentation (gitignored)
```

## 🎯 User Capabilities

| Feature | Guest Users | Registered Users |
|---------|-------------|------------------|
| View prayers | ✅ | ✅ |
| Submit prayers | ✅ | ✅ |
| Edit own prayers | ❌ | ✅ (current week only) |
| Delete own prayers | ❌ | ✅ (current week only) |
| Like prayers | ❌ | ✅ |
| Comment on prayers | ❌ | ✅ |
| Edit own comments | ❌ | ✅ |
| Delete own comments | ❌ | ✅ |
| **Personal timeline** | ❌ | ✅ |
| **Search & filter prayers** | ❌ | ✅ |
| **Export prayers** | ❌ | ✅ |
| **Share individual prayers** | ❌ | ✅ |
| **Set prayer reminders** | ❌ | ✅ |
| **View expandable comments** | ❌ | ✅ |

## 🎯 My Prayers Ecosystem

### Personal Dashboard (`/my-prayers`)
A comprehensive personal prayer management interface featuring:
- **Timeline View**: Chronological display of all user prayers grouped by week
- **Real-time Search**: Instant filtering across prayer content and author names
- **Advanced Sorting**: Sort by recency, most liked, or most commented
- **Time Range Filters**: View prayers from all time, this month, or last 3 months
- **Export Options**: Download prayers in PDF, TXT, or JSON formats
- **Individual Actions**: Edit, delete, share, and view detailed analytics for each prayer

### Prayer Reminders (`/reminders`)
Dedicated reminder management system with:
- **Custom Scheduling**: Set specific date and time reminders for any prayer
- **Native Notifications**: Browser notification support with permission handling
- **Smart Timer Management**: Robust scheduling system with proper cleanup
- **Testing Suite**: 8 automated tests to validate reminder functionality
- **Debug Console**: Real-time logging for troubleshooting reminder issues
- **Persistent Storage**: Settings and scheduled reminders saved locally

### Enhanced Comment System
Improved interaction features including:
- **Expandable Comments**: Show/hide comments with toggle buttons
- **Accurate Count Display**: Fixed comment counting across all prayers
- **Nested Threading**: Support for comment replies and discussions
- **Real-time Updates**: Live comment updates using SWR data fetching

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run test suite
- `npm run gen:types` - Generate TypeScript types from Supabase

### Key Development Files
- `docs/SUPABASE_CONFIG.md` - OAuth and database setup guide
- `docs/DEBUG_GUIDE.md` - Comprehensive troubleshooting guide
- `docs/TESTING_GUIDE.md` - Testing procedures and instructions
- `docs/PRAYER_REMINDER_TESTING_GUIDE.md` - Reminder functionality testing
- `docs/MY_PRAYERS_PLAN.md` - Complete feature implementation documentation
- `lib/app-config.ts` - Multi-environment configuration

## 🌍 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Configure production domain in `NEXT_PUBLIC_SITE_URL`
4. Update Supabase OAuth redirect URLs

The app automatically handles:
- Production domain unification
- Preview environment testing
- OAuth redirect configuration
- Environment-specific builds

## 📋 License

This project is licensed under the MIT License - see the LICENSE file for details.
