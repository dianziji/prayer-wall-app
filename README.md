# Prayer Wall App

A comprehensive prayer sharing platform built with Next.js 15, TypeScript, Supabase, and Tailwind CSS. Organize prayers by weeks, support multiple user types, and provide rich interaction features.

## ✨ Features

### 🙏 Core Prayer Features
- **Weekly Organization**: Prayers organized by Eastern Time Sunday-to-Saturday weeks
- **Guest & User Posting**: Both anonymous guests and registered users can submit prayers
- **Prayer Management**: Registered users can edit/delete their own prayers (current week only)
- **Interactive Engagement**: Like and comment system for registered users

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
- **Testing**: Jest + React Testing Library
- **Deployment**: Vercel
- **Code Quality**: ESLint + TypeScript

## 📁 Project Structure

```
prayer-wall-app/
├── app/                    # Next.js 15 App Router
│   ├── api/               # API routes
│   ├── week/[date]/       # Weekly prayer walls
│   ├── login/             # Authentication
│   └── auth/callback/     # OAuth callback
├── components/            # React components
├── lib/                   # Utility functions
├── types/                 # TypeScript definitions
├── tests/                 # Test files
└── docs/                  # Documentation
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

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run test suite
- `npm run gen:types` - Generate TypeScript types from Supabase

### Key Development Files
- `SUPABASE_CONFIG.md` - OAuth and database setup
- `DEBUG_GUIDE.md` - Troubleshooting guide
- `TESTING_GUIDE.md` - Testing instructions
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
